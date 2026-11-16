const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ChevronRight, Plus } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';
import { StatusPill } from '@/components/StatusPill';
import { CHANNELS } from '@/lib/orderStatus';
import { addDays, formatAriary, formatDay, formatDayShort, todayIso } from '@/lib/format';
import useSettings from '@/lib/useSettings';
import RemindersJ2 from '@/components/team/RemindersJ2';

const asList = (res) => res?.items || (Array.isArray(res) ? res : []);

export default function TeamDashboard() {
  const { settings } = useSettings();
  const [date, setDate] = useState(addDays(todayIso(), 1));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({ unseen: [], payments: [] });

  useEffect(() => {
    const loadAlerts = async () => {
      const [unseen, payments] = await Promise.all([
        db.entities.Order.filter({ team_seen: false }, { limit: 5 }).catch(() => []),
        db.entities.Order.filter({ payment_status: 'a_verifier' }, { limit: 5 }).catch(() => []),
      ]);
      setAlerts({ unseen: asList(unseen), payments: asList(payments) });
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    const res = await db.entities.Order
      .filter({ delivery_date: date }, { sort: 'slot_label', limit: 200 })
      .catch(() => null);
    if (res) setOrders(asList(res).filter((o) => o.status !== 'annulee'));
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
    const unsubscribe = db.entities.Order.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const bySlot = orders.reduce((acc, o) => {
    acc[o.slot_label || '—'] = acc[o.slot_label || '—'] || [];
    acc[o.slot_label || '—'].push(o);
    return acc;
  }, {});

  const byFlavor = {};
  orders.forEach((o) => {
    (o.items || []).forEach((i) => {
      byFlavor[i.name] = (byFlavor[i.name] || 0) + i.qty;
    });
  });
  const totalPao = orders.reduce((s, o) => s + (o.pao_count || 0), 0);

  const dates = [todayIso(), addDays(todayIso(), 1), addDays(todayIso(), 2)];

  const showPreparations = () => {
    setDate(addDays(todayIso(), 2));
    setTimeout(() => {
      document.getElementById('preparations')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[21px] font-semibold">À préparer</h1>
        <Link to="/equipe/nouvelle-commande" className="pao-btn h-10 px-4 text-[13px]">
          <Plus size={15} /> Commande
        </Link>
      </div>

      {alerts.unseen.length > 0 && (
        <div className="mt-3 rounded-2xl bg-brand-pink/70 p-3.5">
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-terra">
            Nouvelles commandes
          </p>
          {alerts.unseen.map((o) => (
            <Link
              key={o.id}
              to={`/equipe/commandes/${o.id}`}
              className="mt-1 block text-[12.5px] text-brand-brown"
            >
              Nouvelle commande de <strong>{o.customer_name}</strong>, {o.pao_count} pao, livraison{" "}
              {formatDayShort(o.delivery_date)} {o.slot_label}
            </Link>
          ))}
        </div>
      )}

      {alerts.payments.length > 0 && (
        <Link
          to="/equipe/commandes"
          className="mt-2 flex items-center justify-between rounded-2xl bg-brand-honey/25 p-3.5 text-[12.5px] font-semibold text-brand-honeyDeep"
        >
          {alerts.payments.length} paiement(s) MVola à vérifier
          <ChevronRight size={15} />
        </Link>
      )}

      <RemindersJ2 settings={settings} onShowPreparations={showPreparations} />

      <div className="mt-3 flex gap-2">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            className={`flex h-11 flex-1 items-center justify-center rounded-2xl px-3 text-[12.5px] font-semibold transition ${
              date === d ? 'bg-brand-terra text-white' : 'border border-brand-pink bg-white text-brand-brown'
            }`}
          >
            {d === todayIso() ? "Aujourd'hui" : formatDay(d).split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="pao-card p-4">
          <p className="text-[12px] font-semibold text-brand-brownSoft">Commandes</p>
          <p className="font-heading text-[23px] font-semibold text-brand-terra">{orders.length}</p>
        </div>
        <div className="pao-card p-4">
          <p className="text-[12px] font-semibold text-brand-brownSoft">Pao à cuire</p>
          <p className="font-heading text-[23px] font-semibold text-brand-terra">{totalPao}</p>
        </div>
      </div>

      {Object.keys(byFlavor).length > 0 && (
        <div id="preparations" className="pao-card mt-3 p-4">
          <p className="font-heading text-[14px] font-semibold">Total par saveur</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(byFlavor).map(([name, qty]) => (
              <div key={name} className="flex justify-between text-[13px]">
                <span className="truncate text-brand-brownSoft">{name}</span>
                <span className="font-bold">{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-[13px] font-semibold text-brand-brownSoft">{formatDay(date)}</p>

      {loading && <p className="mt-4 text-[13px] text-brand-brownSoft">On regarde le planning…</p>}

      {!loading && orders.length === 0 && (
        <p className="mt-4 rounded-2xl bg-white p-4 text-[13px] text-brand-brownSoft">
          Aucune livraison prévue ce jour-là.
        </p>
      )}

      <div className="mt-2 space-y-4">
        {Object.entries(bySlot).map(([slot, list]) => (
          <div key={slot}>
            <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-brand-terra">{slot}</p>
            <div className="space-y-2">
              {list.map((o) => (
                <Link
                  key={o.id}
                  to={`/equipe/commandes/${o.id}`}
                  className="pao-card flex items-center gap-3 p-3.5"
                >
                  <div className="flex-1">
                    <p className="font-heading text-[14.5px] font-semibold">
                      {o.customer_name} · {o.pao_count} pao
                    </p>
                    <p className="text-[12px] text-brand-brownSoft">
                      {(o.items || []).map((i) => `${i.qty} ${i.name.replace('Pao ', '')}`).join(' · ')}
                    </p>
                    <p className="mt-1 text-[12px] text-brand-brownSoft">
                      {CHANNELS[o.channel] || 'App'} · {o.customer_phone} · {formatAriary(o.total)}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                  <ChevronRight size={16} className="text-brand-brownSoft" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </PullToRefresh>
  );
}