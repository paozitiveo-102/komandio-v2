const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { addMonthsDate, weeksUntil } from '@/lib/format';

function asList(res) {
  return res?.items || (Array.isArray(res) ? res : []);
}

export function computeProgress(orders, customer, settings) {
  const target = settings?.loyalty_target || 10;
  const months = settings?.loyalty_months || 2;
  const cycleStart = customer?.loyalty_cycle_start || null;
  const qualifying = (orders || [])
    .filter((o) => o.status === 'livree' && ['paye', 'confirme'].includes(o.payment_status))
    .filter((o) => !cycleStart || new Date(o.delivered_at || o.delivery_date) >= new Date(cycleStart));
  const count = Math.min(qualifying.length, target);
  const deadline = cycleStart ? addMonthsDate(new Date(cycleStart), months) : null;
  return {
    count,
    target,
    weeksLeft: deadline ? weeksUntil(deadline) : months * 4,
    deadline,
    reward: settings?.loyalty_reward || 5,
  };
}

export async function syncLoyalty(customer, settings) {
  if (!customer?.id) return null;
  const target = settings?.loyalty_target || 10;
  const months = settings?.loyalty_months || 2;
  const orders = asList(await db.entities.Order.filter({ customer_id: customer.id }, { limit: 500 }));

  const qualified = orders
    .filter((o) => o.status === 'livree' && ['paye', 'confirme'].includes(o.payment_status))
    .sort((a, b) =>
      String(a.delivered_at || a.delivery_date).localeCompare(String(b.delivered_at || b.delivery_date))
    );

  let cycleStart = customer.loyalty_cycle_start || null;
  if (!cycleStart) {
    const first = orders.map((o) => o.created_date).filter(Boolean).sort()[0];
    cycleStart = first || new Date().toISOString();
  }

  const expiry = addMonthsDate(new Date(cycleStart), months);
  let inCycle = qualified.filter(
    (o) => new Date(o.delivered_at || `${o.delivery_date}T12:00:00Z`) >= new Date(cycleStart)
  );

  if (inCycle.length < target && expiry.getTime() < Date.now()) {
    cycleStart = new Date().toISOString();
    inCycle = [];
  }

  let gift = null;
  const patch = {
    loyalty_cycle_start: cycleStart,
    loyalty_count: inCycle.length,
    loyalty_lifetime: qualified.length,
  };

  if (inCycle.length >= target) {
    const existing = asList(
      await db.entities.Gift.filter({ customer_id: customer.id, earned_date: { $gte: cycleStart } })
    );
    const addresses = asList(await db.entities.Address.filter({ customer_id: customer.id }, { limit: 5 }));
    const main = addresses.find((a) => a.is_default) || addresses[0];
    if (!existing.length) {
      gift = await db.entities.Gift.create({
        customer_id: customer.id,
        customer_user_id: customer.user_id || '',
        customer_name: customer.first_name,
        customer_phone: customer.phone,
        earned_date: new Date().toISOString(),
        address_details: main ? `${main.label} · ${main.details}` : '',
        status: 'en_preparation',
        team_seen: false,
      });
    }
    patch.loyalty_cycle_start = new Date().toISOString();
    patch.loyalty_count = 0;
  }

  const updated = await db.entities.Customer.update(customer.id, patch);
  return { customer: updated, gift };
}