import { UtensilsCrossed } from 'lucide-react';
import LoginForm from '@/app/(auth)/login/login-form';

export default function LoginPage() {
  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4'>
      <div className='flex items-center gap-3 mb-8'>
        <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50'>
          <UtensilsCrossed className='w-5 h-5 text-white' strokeWidth={2.5} />
        </div>
        <span className='text-white font-extrabold text-2xl italic uppercase tracking-tight'>
          RUBYKET
        </span>
      </div>

      <div className='w-full max-w-sm backdrop-blur border border-white/10 rounded-3xl p-8 shadow-2xl'>
        <h2 className='text-xl font-extrabold text-white text-center mb-1'>
          Đăng nhập
        </h2>
        <p className='text-sm text-center mb-6'>Chào mừng trở lại!</p>
        <LoginForm />
      </div>
    </div>
  );
}
