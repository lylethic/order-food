import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Spinner } from '../components/Spinner';
import { LangToggle } from '../components/LangToggle';

export default function AuthPage() {
  const { login, register } = useAuthContext();
  const { t } = useLang();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: 'error';
    message: string;
  } | null>(null);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setToast(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone, username);
      }
      // Navigation handled by RequireGuest guard in AppRouter
    } catch (err) {
      setToast({ type: 'error', message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className='fixed top-6 right-6 z-50 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-lg'
          >
            <div className='flex items-center gap-2'>
              <AlertCircle className='w-4 h-4' />
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left — branding (desktop only) */}
      <div className='hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-14'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
            <UtensilsCrossed className='w-5 h-5 text-white' strokeWidth={2.5} />
          </div>
          <span className='font-extrabold text-xl text-white tracking-tight italic uppercase'>
            RUBYKET
          </span>
        </div>

        <div>
          <h1 className='text-5xl font-extrabold text-white leading-tight mb-6'>
            Fine dining,
            <br />
            <span className='text-indigo-400'>at your fingertips.</span>
          </h1>
          <p className='text-slate-400 font-medium leading-relaxed text-lg'>
            Browse our curated menu, place orders, and track every step — all in
            real time.
          </p>
        </div>

        <div className='flex gap-6'>
          {['Starters', 'Mains', 'Desserts', 'Beverages'].map((c) => (
            <span
              key={c}
              className='text-xs font-bold text-slate-500 uppercase tracking-widest'
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className='flex-1 flex flex-col items-center justify-center p-8'>
        {/* Mobile logo */}
        <div className='flex lg:hidden items-center gap-2 mb-10'>
          <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center'>
            <UtensilsCrossed className='w-5 h-5 text-white' strokeWidth={2.5} />
          </div>
          <span className='font-extrabold text-lg text-slate-800 italic uppercase'>
            RUBYKET
          </span>
        </div>

        <div className='w-full max-w-sm'>
          {/* Mode tabs */}
          <div className='flex bg-slate-100 rounded-xl p-1 mb-8'>
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.signIn}
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.createAccount}
            </button>
          </div>

          <h2 className='text-2xl font-extrabold text-slate-800 mb-1'>
            {mode === 'login' ? t.loginTitle : t.registerTitle}
          </h2>
          <p className='text-slate-400 text-sm font-medium mb-8'>
            {mode === 'login' ? t.loginSubtitle : t.registerSubtitle}
          </p>

          <AnimatePresence mode='wait'>
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSubmit}
              className='space-y-4'
            >
              {mode === 'register' && (
                <>
                  {/* Username */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-600 mb-1.5'>
                      {t.username}
                    </label>
                    <input
                      type='text'
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder='abc_09@'
                      className='w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-600 mb-1.5'>
                      {t.fullName}
                    </label>
                    <input
                      type='text'
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='Alex Rivera'
                      className='w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                    />
                  </div>

                  {/* Phone number */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-600 mb-1.5'>
                      {t.phone}
                    </label>
                    <input
                      type='text'
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder='090987699'
                      className='w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className='block text-sm font-semibold text-slate-600 mb-1.5'>
                  {t.email}
                </label>
                <input
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  className='w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-600 mb-1.5'>
                  {t.password}
                </label>
                <div className='relative'>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    className='w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPw(!showPw)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                  >
                    {showPw ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100 mt-2'
              >
                {loading ? (
                  <>
                    <Spinner size='sm' />
                    {mode === 'login' ? t.signingIn : t.creatingAccount}
                  </>
                ) : mode === 'login' ? (
                  t.signIn
                ) : (
                  t.createAccount
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className='mt-6 flex justify-center'>
            <LangToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
