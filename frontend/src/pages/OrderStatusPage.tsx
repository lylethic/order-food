import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { ClipboardList } from 'lucide-react';
import type { OrderStatus } from '../types';
import type { CustomerOutletContext } from '../layouts/CustomerLayout';

const STATUS_STEPS: OrderStatus[] = [
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
];

type StepKey = keyof ReturnType<typeof useLang>['t']['steps'];

const STEP_KEYS: Record<OrderStatus, StepKey> = {
  Received:  'received',
  Preparing: 'preparing',
  Cooking:   'cooking',
  Ready:     'ready',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

export default function OrderStatusPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { placedOrder, onCancelOrder, lastEvent } =
    useOutletContext<CustomerOutletContext>();

  const [status, setStatus] = useState<OrderStatus>(
    placedOrder?.status ?? 'Received',
  );
  const [cancelling, setCancelling] = useState(false);

  // Update status from SSE events
  useEffect(() => {
    if (lastEvent && placedOrder && lastEvent.orderId === placedOrder.id) {
      setStatus(lastEvent.status as OrderStatus);
    }
  }, [lastEvent, placedOrder]);

  // Keep in sync if the order was just placed (status may have arrived before mount)
  useEffect(() => {
    if (placedOrder) setStatus(placedOrder.status);
  }, [placedOrder?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!placedOrder) {
    return (
      <div className="pt-24 pb-32 md:pb-10 flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <ClipboardList className="w-16 h-16 text-slate-200" />
        <p className="text-xl font-extrabold text-slate-700">{t.noOrderYet}</p>
        <p className="text-slate-400 font-medium">{t.noOrderSub}</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-2 flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-100"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToMenu}
        </button>
      </div>
    );
  }

  const isCancelled = status === 'Cancelled';
  const currentIdx  = isCancelled ? -1 : STATUS_STEPS.indexOf(status);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancelOrder();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">{t.orderStatus}</h2>
          <p className="text-slate-400 font-medium text-sm mt-0.5">
            {t.orderNumber} #{placedOrder.ticketNumber} · {t.table} {placedOrder.table}
          </p>
        </div>
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToMenu}
        </button>
      </div>

      {/* Live badge */}
      <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Current status
          </p>
          <StatusBadge status={status} />
        </div>
        {!isCancelled && status !== 'Delivered' && (
          <div className="flex gap-2 items-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-indigo-500"
            />
            <span className="text-xs font-bold text-slate-400">Live</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-[28px] p-8 border border-slate-100 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">
          {t.trackingProgress}
        </h3>

        {isCancelled ? (
          <div className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="font-bold text-rose-600">{t.steps.cancelled.label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{t.steps.cancelled.desc}</p>
            </div>
          </div>
        ) : (
          <div className="relative space-y-8">
            {/* Track line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
            {/* Progress fill */}
            <motion.div
              className="absolute left-5 top-5 w-0.5 bg-indigo-500 origin-top"
              animate={{
                height: `${Math.max(0, (currentIdx / (STATUS_STEPS.length - 1)) * 100)}%`,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const done   = idx < currentIdx;
              const active = idx === currentIdx;
              const key    = STEP_KEYS[step];
              return (
                <div key={step} className="flex items-start gap-5 relative">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 shrink-0 transition-all duration-500 ${
                      done
                        ? 'bg-indigo-600 text-white'
                        : active
                          ? 'bg-white border-2 border-indigo-500 text-indigo-500 scale-110 shadow-md shadow-indigo-100'
                          : 'bg-white border border-slate-200 text-slate-300'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : active ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`pt-1.5 ${!done && !active ? 'opacity-40' : ''}`}>
                    <p
                      className={`font-bold text-sm ${active ? 'text-indigo-600' : 'text-slate-800'}`}
                    >
                      {t.steps[key].label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.steps[key].desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel button */}
      {status === 'Received' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 py-3.5 border border-rose-200 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-50 active:scale-95 transition-all disabled:opacity-60"
        >
          {cancelling ? (
            <>
              <Spinner size="sm" />
              {t.cancelling}
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              {t.cancelOrder}
            </>
          )}
        </button>
      )}
    </div>
  );
}
