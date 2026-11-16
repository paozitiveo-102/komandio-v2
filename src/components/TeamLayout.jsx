const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';

import { Bell, ClipboardList, Gift, LayoutDashboard, Loader2, Settings, Users } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import useCustomer from '@/lib/useCustomer';
import { loadReminders } from '@/lib/reminders';

const TABS = [
  { to: '/equipe', label: "Aujourd'hui", Icon: LayoutDashboard, exact: true, key: 'orders', reminders: true },
  { to: '/equipe/commandes', label: 'Commandes', Icon: ClipboardList, key: 'orders' },
  { to: '/equipe/clients', label: 'Clients', Icon: Users, key: 'customers' },
  { to: '/equipe/cadeaux', label: 'Cadeaux', Icon: Gift, key: 'gifts' },
  { to: '/equipe/reglages', label: 'Réglages', Icon: Settings, key: 'settings' },
];

export default function TeamLayout() {
  const { loading, user, isTeam } = useCustomer();
  const [badges, setBadges] = useState({ orders: 0, gifts: 0, payments: 0, reminders: 0 });

  useEffect(() => {
    if (!isTeam) return;
    const load = async () => {
      const [orders, payments, gifts, reminders] = await Promise.all([
        db.entities.Order.count({ team_seen: false }).catch(() => 0),
        db.entities.Order.count({ payment_status: 'a_verifier' }).catch(() => 0),
        db.entities.Gift.count({ team_seen: false }).catch(() => 0),
        loadReminders()
          .then((data) => data.rows.filter((r) => !r.reminder_done).length)
          .catch(() => 0),
      ]);
      setBadges({ orders, payments, gifts, reminders });
    };
    load();
    const unsubscribe = db.entities.Order.subscribe(() => load());
    const interval = setInterval(load, 20000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isTeam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Loader2 className="h-6 w-6 animate-spin text-brand-terra" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream px-5">
        <div className="pao-card max-w-md p-6 text-center">
          <h1 className="font-heading text-[19px] font-semibold">Espace réservé à l'équipe</h1>
          <p className="mt-1 text-[14px] text-brand-brownSoft">
            Ton compte client ne donne pas accès à cet espace. Si tu penses que c'est une erreur,
            écris-nous, on s'en occupe.
          </p>
          <Link to="/" className="pao-btn mt-4 h-12 w-full text-[15px]">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <header
        className="border-b border-brand-pink/70 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BrandLogo size={32} />
            <span className="font-heading text-[15px] font-semibold text-brand-terra">Équipe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-pink/70 px-2.5 py-1 text-[12px] font-bold text-brand-terra">
              {badges.payments} paiement{badges.payments > 1 ? 's' : ''} à vérifier
            </span>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map(({ to, label, Icon, exact, key, reminders }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                  isActive
                    ? 'bg-brand-terra text-white'
                    : 'bg-brand-pink/40 text-brand-brown hover:bg-brand-pink/70'
                }`
              }
            >
              <Icon size={15} />
              {label}
              {key === 'orders' && badges.orders > 0 && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badges.orders}
                </span>
              )}
              {key === 'gifts' && badges.gifts > 0 && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badges.gifts}
                </span>
              )}
              {reminders && badges.reminders > 0 && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  <Bell size={9} />
                  {badges.reminders}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl overscroll-contain px-4 pb-16 pt-4">
        <Outlet />
      </main>
    </div>
  );
}