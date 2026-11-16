import { lazy, Suspense, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import CustomerLayout from '@/components/CustomerLayout';
import TeamLayout from '@/components/TeamLayout';
// Add page imports here
import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import Checkout from '@/pages/Checkout';
import Suivi from '@/pages/Suivi';
import SuiviDetail from '@/pages/SuiviDetail';
import Compte from '@/pages/Compte';
import Bienvenue from '@/pages/Bienvenue';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import BrandLoader from '@/components/BrandLoader';

const TeamDashboard = lazy(() => import('@/pages/team/TeamDashboard'));
const TeamOrders = lazy(() => import('@/pages/team/TeamOrders'));
const TeamOrderDetail = lazy(() => import('@/pages/team/TeamOrderDetail'));
const TeamNewOrder = lazy(() => import('@/pages/team/TeamNewOrder'));
const TeamCustomers = lazy(() => import('@/pages/team/TeamCustomers'));
const TeamGifts = lazy(() => import('@/pages/team/TeamGifts'));
const TeamSettings = lazy(() => import('@/pages/team/TeamSettings'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const pageRef = useRef(null);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { x: '16%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduceMotion ? { opacity: 1 } : { x: '16%', opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          // évite qu'un transform résiduel casse les barres fixes (tab bar, bouton d'enregistrement)
          if (pageRef.current) {
            pageRef.current.style.transform = 'none';
            pageRef.current.style.willChange = 'auto';
          }
        }}
        ref={pageRef}
      >
    <Suspense fallback={<BrandLoader />}>
    <Routes location={location}>
      {/* Add your page Route elements here */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/bienvenue" element={<Bienvenue />} />

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/commande" element={<Checkout />} />
        <Route path="/suivi" element={<Suivi />} />
        <Route path="/suivi/:id" element={<SuiviDetail />} />
        <Route path="/compte" element={<Compte />} />
      </Route>

      <Route path="/equipe" element={<TeamLayout />}>
        <Route index element={<TeamDashboard />} />
        <Route path="commandes" element={<TeamOrders />} />
        <Route path="commandes/:id" element={<TeamOrderDetail />} />
        <Route path="nouvelle-commande" element={<TeamNewOrder />} />
        <Route path="clients" element={<TeamCustomers />} />
        <Route path="cadeaux" element={<TeamGifts />} />
        <Route path="reglages" element={<TeamSettings />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App