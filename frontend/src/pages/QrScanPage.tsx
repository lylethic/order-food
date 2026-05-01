import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useTableSession } from '../context/TableContext';
import { api } from '../services/api';

type State = 'verifying' | 'success' | 'error';

// How long to show the success flash before navigating (ms)
const SUCCESS_DELAY = 800;

export default function QrScanPage() {
  const { t } = useLang();
  const { setTableSession } = useTableSession();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tableParam = searchParams.get('table') ?? '';
  const sidParam = searchParams.get('sid') ?? '';

  const [state, setState] = useState<State>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!tableParam || !sidParam) {
      setErrorMsg(t.qrInvalid);
      setState('error');
      return;
    }

    let cancelled = false;

    api
      .verifyTableToken(tableParam, sidParam)
      .then(({ valid }) => {
        if (cancelled) return;

        if (!valid) {
          setErrorMsg(t.qrInvalid);
          setState('error');
          return;
        }

        // Save verified session to sessionStorage — survives the /auth redirect
        setTableSession({
          tableNumber: tableParam,
          verifiedAt: new Date().toISOString(),
          source: 'qr',
        });

        setState('success');

        // Brief success flash, then go to /menu
        // CustomerLayout will redirect to /auth?returnTo=/menu if not logged in,
        // and after login RequireGuest returns the user to /menu with table intact.
        const timer = setTimeout(() => {
          if (!cancelled) navigate('/menu', { replace: true });
        }, SUCCESS_DELAY);

        return () => clearTimeout(timer);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMsg(t.qrVerifyError);
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-800 px-4">
      {/* Brand mark */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-amber-400">
        <UtensilsCrossed size={22} />
        <span className="font-semibold tracking-wide text-sm uppercase">
          Restaurant
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Verifying ── */}
        {state === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <Loader2 size={48} className="animate-spin text-amber-400" />
            <p className="text-neutral-300 text-lg">{t.qrVerifying}</p>
          </motion.div>
        )}

        {/* ── Success ── */}
        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CheckCircle size={64} className="text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-white text-2xl font-bold">{t.qrWelcome}</h1>
              <p className="text-neutral-400 mt-1">
                {t.qrTableLabel}{' '}
                <span className="text-amber-400 font-bold text-xl">
                  {tableParam}
                </span>
              </p>
            </div>
            <p className="text-neutral-500 text-sm">{t.qrRedirecting}</p>
          </motion.div>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 text-center max-w-xs w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <XCircle size={64} className="text-red-400" />
            </motion.div>
            <div>
              <h1 className="text-white text-2xl font-bold">{t.qrErrorTitle}</h1>
              <p className="text-neutral-400 mt-1 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate('/menu', { replace: true })}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-900 font-semibold text-sm transition-colors"
            >
              {t.qrGoToMenu}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
