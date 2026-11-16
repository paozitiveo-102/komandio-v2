const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ArrowLeft, Sparkles } from 'lucide-react';
import useCustomer from '@/lib/useCustomer';
import OrderTimeline from '@/components/OrderTimeline';
import { PaymentPill, StatusPill } from '@/components/StatusPill';
import { formatAriary, formatDay } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function SuiviDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('nouvelle') === '1';
  const { customer } = useCustomer();
  const [order, setOrder] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [accepting, setAccepting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const o = await db.entities.Order.get(id);
    setOrder(o);
  };

  useEffect(() => {
    load().catch(() => setOrder(null));
    if (customer?.id) {
      db.entities.Gift
        .filter({ customer_id: customer.id }, { limit: 5 })
        .then((res) => setGifts(res?.items || (Array.isArray(res) ? res : [])))
        .catch(() => setGifts([]));
    }
  }, [id, customer?.id]);

  const acceptFee = async () => {
    const previous = order;
    setAccepting(true);
    setOrder({ ...order, fee_change_pending: false });
    try {
      await db.entities.Order.update(order.id, { fee_change_pending: false });
      await load();
    } catch {
      setOrder(previous);
      toast({
        title: "On n'a pas pu accepter le nouveau total",
        description: 'Réessaie dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (!order) {
    return <div className="pt-10 text-center text-[14px] text-brand-brownSoft">On cherche ta commande…</div>;
  }

  const gift = gifts[0];

  return (
    <div className="pt-4">
      <Link to="/suivi" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-terra">
        <ArrowLeft size={16} /> Mes commandes
      </Link>

      {isNew && (
        <div className="mb-4 rounded-[26px] bg-brand-terra p-5 text-white">
          <Sparkles size={22} className="opacity-80" />
          <h1 className="mt-2 font-heading text-[21px] font-semibold leading-tight">
            Merci ! Ta dose de bonheur est en route
          </h1>
          <p className="mt-1 text-[13px] text-white/85">
            Une dose de bonheur à chaque PAO ! On te prépare tout pour {formatDay(order.delivery_date)}.
          </p>
        </div>
      )}

      {order.fee_change_pending && (
        <div className="mb-4 rounded-[24px] border border-brand-terra/30 bg-brand-pink/60 p-4">
          <p className="font-heading text-[15px] font-semibold text-brand-terra">
            Les frais de livraison ont été ajustés
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-brand-brown">
            L'équipe a ajusté les frais de livraison pour cette commande (accès ou itinéraire
            particulier). Ton nouveau total est de{" "}
            <strong>{formatAriary(order.total)}</strong>.
          </p>
          <button onClick={acceptFee} disabled={accepting} className="pao-btn mt-3 h-11 w-full text-[14px]">
            {accepting ? 'On enregistre…' : "J'accepte ce nouveau total"}
          </button>
        </div>
      )}

      <div className="pao-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-brownSoft">
            {order.reference}
          </p>
          <StatusPill status={order.status} />
        </div>
        <div className="mt-4">
          <OrderTimeline status={order.status} />
        </div>
      </div>

      <div className="pao-card mt-3 space-y-2 p-5">
        {(order.items || []).map((i, idx) => (
          <div key={idx} className="flex justify-between text-[14px]">
            <span>
              {i.qty} × {i.name}
            </span>
            <span className="font-semibold">{formatAriary(i.qty * i.unit_price)}</span>
          </div>
        ))}
        <div className="my-2 h-px bg-brand-pink/70" />
        <div className="flex justify-between text-[14px]">
          <span>Livraison</span>
          <span className="font-semibold">{formatAriary(order.delivery_fee)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-heading text-[16px] font-semibold">Total</span>
          <span className="font-heading text-[20px] font-semibold text-brand-terra">
            {formatAriary(order.total)}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-[24px] bg-brand-blueSoft/40 p-4 text-[13px] text-brand-brown">
        <p className="font-semibold">
          {formatDay(order.delivery_date)} · {order.slot_label}
        </p>
        <p className="mt-0.5 text-brand-brownSoft">
          {order.address_label} — {order.address_details}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <PaymentPill status={order.payment_status} />
          <span className="text-[12px] text-brand-brownSoft">
            {order.payment_method === 'mvola' ? 'MVola' : 'Cash'}
          </span>
        </div>
        {order.payment_method === 'mvola' && order.mvola_ref && (
          <p className="mt-1 text-[12px] text-brand-brownSoft">Référence : {order.mvola_ref}</p>
        )}
      </div>

      {gift && (
        <div className="mt-3 rounded-[24px] bg-brand-honey/20 p-4">
          <p className="font-heading text-[15px] font-semibold">
            {gift.status === 'livre' ? 'Ton cadeau est livré' : 'Ton cadeau est en préparation'}
          </p>
          <p className="mt-1 text-[13px] text-brand-brownSoft">
            5 pao offerts pour ta fidélité. On te les livre sur ton adresse principale.
          </p>
        </div>
      )}
    </div>
  );
}