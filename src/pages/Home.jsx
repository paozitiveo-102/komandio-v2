const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { StatusPill } from '@/components/StatusPill';
import PullToRefresh from '@/components/PullToRefresh';
import useCustomer from '@/lib/useCustomer';
import useSettings from '@/lib/useSettings';
import { computeProgress } from '@/lib/loyalty';
import { writeCart } from '@/lib/cart';
import { formatAriary, formatDay } from '@/lib/format';

export default function Home() {
  const { loading, user, customer, isTeam } = useCustomer();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [gifts, setGifts] = useState([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!customer?.id) return;
    const [o, g] = await Promise.all([
      db.entities.Order
        .filter({ customer_id: customer.id }, { sort: '-created_date', limit: 20 })
        .catch(() => null),
      db.entities.Gift.filter({ customer_id: customer.id }, { limit: 5 }).catch(() => null),
    ]);
    if (o) setOrders(o.items || (Array.isArray(o) ? o : []));
    if (g) setGifts(g.items || (Array.isArray(g) ? g : []));
  }, [customer?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && user && !customer && !isTeam) {
      navigate('/bienvenue', { replace: true });
    }
  }, [loading, user, customer, isTeam]);

  const progress = computeProgress(orders, customer, settings);
  const last = orders[0];
  const gift = gifts[0];

  const reorder = () => {
    const cart = {};
    (last.items || []).forEach((i) => {
      if (i.product_id) cart[i.product_id] = (cart[i.product_id] || 0) + i.qty;
    });
    writeCart(cart);
    navigate('/commande');
  };

  return (
    <PullToRefresh onRefresh={load}>
    <div className="pt-5">
      <section className="relative overflow-hidden rounded-[32px] bg-white px-6 pb-7 pt-8 text-center shadow-[0_18px_40px_-30px_rgba(74,46,37,0.5)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-pink/60" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-brand-blueSoft/50" />
        <div className="relative">
          <BrandLogo size={104} className="mx-auto drop-shadow-sm" />
          <h1 className="mt-4 font-heading text-[26px] font-semibold leading-tight">
            Une dose de bonheur
            <br />à chaque PAO !
          </h1>
          <p className="mx-auto mt-2 max-w-[19rem] text-[15px] leading-relaxed text-brand-brownSoft">
            {customer
              ? `Contente de te revoir ${customer.first_name}. On te prépare quoi aujourd'hui ?`
              : 'Des pao tout chauds, préparés le matin et livrés chez toi à Antananarivo.'}
          </p>

          <Link to="/menu" className="pao-btn mt-6 h-14 w-full text-[17px]">
            Commander <ArrowRight size={19} />
          </Link>

          {last ? (
            <button onClick={reorder} className="pao-btn-soft mt-3 h-12 w-full text-[15px]">
              <RotateCcw size={17} className="text-brand-terra" />
              Recommander en 1 tap
              <span className="text-[13px] font-semibold text-brand-brownSoft">
                · {last.pao_count} pao
              </span>
            </button>
          ) : (
            !loading && !user && (
              <Link to="/register" className="pao-btn-soft mt-3 h-12 w-full text-[15px]">
                Créer mon compte
              </Link>
            )
          )}
        </div>
      </section>

      {isTeam && (
        <Link to="/equipe" className="pao-card mt-5 flex items-center justify-between p-4">
          <span className="font-heading text-[15px] font-semibold text-brand-terra">Espace équipe</span>
          <ArrowRight size={17} className="text-brand-terra" />
        </Link>
      )}

      {customer && (
        <section className="mt-5 rounded-[28px] bg-brand-pink/70 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-[17px] font-semibold">Ta carte gourmande</h2>
            <span className="text-[13px] font-bold text-brand-terra">
              {progress.count} / {progress.target}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from({ length: progress.target }).map((_, i) => (
              <span
                key={i}
                className={`h-7 w-7 rounded-full border-2 ${
                  i < progress.count ? 'border-brand-terra bg-brand-terra' : 'border-brand-pink bg-white'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-brand-brown/80">
            Il te reste <strong>{Math.max(0, progress.target - progress.count)} commandes</strong> et{" "}
            {progress.weeksLeft} semaines pour gagner{" "}
            <strong>{progress.reward} pao offerts</strong>.
          </p>
        </section>
      )}

      {gift && (
        <section className="mt-4 flex items-center gap-3 rounded-[24px] bg-brand-honey/20 p-4">
          <Sparkles size={20} className="text-brand-honeyDeep" />
          <div>
            <p className="font-heading text-[15px] font-semibold">
              {gift.status === 'livre' ? 'Ton cadeau est livré' : 'Ton cadeau est en préparation'}
            </p>
            <p className="text-[12.5px] text-brand-brownSoft">5 pao offerts, rien que pour toi.</p>
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-[17px] font-semibold">Tes dernières commandes</h2>
          <Link to="/suivi" className="text-[13px] font-bold text-brand-terra">
            Tout voir
          </Link>
        </div>
        <div className="space-y-3">
          {orders.slice(0, 3).map((o) => (
            <Link key={o.id} to={`/suivi/${o.id}`} className="pao-card flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[13px] font-semibold text-brand-brownSoft">
                  {o.delivery_date ? formatDay(o.delivery_date) : ''} · {o.slot_label}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold">
                  {(o.items || []).map((i) => `${i.qty} ${i.name.toLowerCase()}`).join(' · ')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-[15px] font-semibold text-brand-terra">
                  {formatAriary(o.total)}
                </p>
                <div className="mt-1">
                  <StatusPill status={o.status} />
                </div>
              </div>
            </Link>
          ))}
          {customer && orders.length === 0 && (
            <div className="pao-card p-6 text-center text-[14px] text-brand-brownSoft">
              Ta première commande arrive bientôt. On a hâte de te régaler !
            </div>
          )}
        </div>
      </section>
    </div>
    </PullToRefresh>
  );
}