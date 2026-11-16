const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { addDays, formatDay, todayIso } from '@/lib/format';
import { timeFr } from '@/lib/availability';

export const DEFAULT_REMINDER_TEMPLATE =
  'Coucou {prenom} ! Petit rappel : ta commande de {pao} pao arrive le {date}, entre {heure_debut} et {heure_fin}. Une dose de bonheur en route !';

// Jour calendaire à Madagascar (UTC+3) à partir d'un horodatage
export function madagascarDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Date(date.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export function telNumber(raw) {
  const clean = String(raw || '').replace(/\s/g, '');
  const digits = clean.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `+261${digits.slice(1)}`;
  return clean.startsWith('+') ? `+${digits}` : digits;
}

export function reminderMessage(template, order, settings) {
  const slot = (settings?.slots || []).find((s) => s.label === order?.slot_label);
  const start = slot ? timeFr(slot.start) : order?.slot_label || '';
  const end = slot ? timeFr(slot.end) : '';

  return String(template || DEFAULT_REMINDER_TEMPLATE)
    .replace(/{prenom}/g, order?.customer_name || '')
    .replace(/{pao}/g, String(order?.pao_count ?? ''))
    .replace(/{date}/g, formatDay(order?.delivery_date))
    .replace(/{heure_debut}/g, start)
    .replace(/{heure_fin}/g, end);
}

export function formatDoneAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date
    .toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Indian/Antananarivo',
    })
    .replace(':', ' h ');
}

// Commandes à rappeler : livraison dans 2 jours ou demain, pas annulées ni livrées,
// et passées avant le J-2 (celles du jour même ou de la veille n'ont pas besoin de rappel).
export async function loadReminders() {
  const today = todayIso();
  const tomorrow = addDays(today, 1);
  const day2 = addDays(today, 2);

  const res = await db.entities.Order.filter(
    { delivery_date: { $in: [tomorrow, day2] }, status: { $nin: ['annulee', 'livree'] } },
    { sort: 'delivery_date', limit: 200 }
  );
  const list = res?.items || (Array.isArray(res) ? res : []);

  const rows = list
    .filter((order) => {
      const delivery = String(order.delivery_date || '').slice(0, 10);
      return madagascarDay(order.created_date) <= addDays(delivery, -2);
    })
    .sort((a, b) => {
      if (a.delivery_date !== b.delivery_date) return a.delivery_date < b.delivery_date ? -1 : 1;
      return String(a.slot_label || '') < String(b.slot_label || '') ? -1 : 1;
    });

  return { rows, today, tomorrow, day2 };
}