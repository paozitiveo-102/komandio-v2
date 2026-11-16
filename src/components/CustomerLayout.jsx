import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Truck, User } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const ONGLETS = [
  { to: '/', label: 'Accueil', Icon: Home, exact: true },
  { to: '/menu', label: 'Menu', Icon: ShoppingBag },
  { to: '/suivi', label: 'Suivi', Icon: Truck },
  { to: '/compte', label: 'Compte', Icon: User },
];

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isTabActive = (to) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

  const retap = (e, to) => {
    if (!isTabActive(to)) return;
    e.preventDefault();
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto w-full max-w-md overscroll-contain px-5 pb-28 pt-4">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <BrandLogo size={38} />
          <span className="font-heading text-[19px] font-semibold leading-none text-brand-terra">
            pao-zitiveo
          </span>
        </Link>
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-pink/80 bg-brand-cream/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {ONGLETS.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={(e) => retap(e, to)}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${
                  isActive ? 'text-brand-terra' : 'text-brand-brownSoft/70'
                }`
              }
            >
              <Icon size={21} strokeWidth={2.2} />
              <span className="text-[12px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}