import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';
import CustomerLayout from '../layouts/CustomerLayout';
import StaffLayout from '../layouts/StaffLayout';
import AuthPage from '../pages/AuthPage';
import MenuPage from '../pages/MenuPage';
import MyOrderPage from '../pages/MyOrderPage';
import KitchenPage from '../pages/KitchenPage';
import ServerPage from '../pages/ServerPage';

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg'>
          <UtensilsCrossed className='w-6 h-6 text-white' />
        </div>
        <Spinner size='lg' />
      </div>
    </div>
  );
}

// ─── Route guards ─────────────────────────────────────────────────────────────

/** Shown at / — redirects to the right home page once auth resolves. */
function RootRedirect() {
  const { user, isLoading, isStaff } = useAuthContext();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to='/auth' replace />;
  return <Navigate to={isStaff ? '/kitchen' : '/menu'} replace />;
}

/** Wraps the auth page — redirects away if already logged in. */
function RequireGuest() {
  const { user, isLoading, isStaff } = useAuthContext();
  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to={isStaff ? '/kitchen' : '/menu'} replace />;
  return <AuthPage />;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/auth', element: <RequireGuest /> },

  // Customer routes — CustomerLayout enforces its own role guards
  {
    element: <CustomerLayout />,
    children: [
      { path: '/menu', element: <MenuPage /> },
      { path: '/status', element: <MyOrderPage /> },
    ],
  },

  // Staff routes — StaffLayout enforces its own role guards
  {
    element: <StaffLayout />,
    children: [
      { path: '/kitchen', element: <KitchenPage /> },
      { path: '/server', element: <ServerPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to='/' replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
