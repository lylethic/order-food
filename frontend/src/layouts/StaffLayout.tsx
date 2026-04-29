import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Truck } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useSSE, type StatusEvent } from '../hooks/useSSE';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import type { NavItem } from '../types';

// ─── Outlet context type ──────────────────────────────────────────────────────

export interface StaffOutletContext {
  lastEvent: StatusEvent | null;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function StaffLayout() {
  const { user, token, isStaff, logout } = useAuthContext();
  const { t } = useLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const lastEvent = useSSE(token);

  // Role guards
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/menu" replace />;

  const navItems: NavItem[] = [
    { id: 'kitchen', label: t.kitchen, icon: ChefHat },
    { id: 'server',  label: t.server,  icon: Truck   },
  ];

  const activeTab    = pathname.startsWith('/server') ? 'server' : 'kitchen';
  const topTitle     = activeTab === 'server' ? t.deliveryStation : t.chefDashboard;
  const topSubtitle  = activeTab === 'server' ? t.serverSub       : t.kitchenSub;

  const outletCtx: StaffOutletContext = { lastEvent };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        items={navItems}
        active={activeTab}
        onChange={(id) => navigate(`/${id}`)}
        user={user}
        onLogout={logout}
      />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar title={topTitle} subtitle={topSubtitle} onLogout={logout} />

        <main className="flex-1">
          <Outlet context={outletCtx} />
        </main>
      </div>

      <BottomNav
        items={navItems}
        active={activeTab}
        onChange={(id) => navigate(`/${id}`)}
      />
    </div>
  );
}
