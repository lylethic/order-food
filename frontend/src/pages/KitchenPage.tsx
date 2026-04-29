import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import type { Order, OrderStatus } from '../types';
import type { StaffOutletContext } from '../layouts/StaffLayout';

const KITCHEN_STATUSES: OrderStatus[] = ['Received', 'Preparing', 'Cooking'];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  Received:  'Preparing',
  Preparing: 'Cooking',
  Cooking:   'Ready',
};

const BORDER_COLOR: Partial<Record<OrderStatus, string>> = {
  Received:  'border-t-emerald-400',
  Preparing: 'border-t-amber-400',
  Cooking:   'border-t-orange-500',
};

export default function KitchenPage() {
  const { t } = useLang();
  const { lastEvent } = useOutletContext<StaffOutletContext>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.filter((o) => KITCHEN_STATUSES.includes(o.status)));
    } catch {
      // keep previous list on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Apply SSE patch
  useEffect(() => {
    if (!lastEvent) return;
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === lastEvent.orderId ? { ...o, status: lastEvent.status as OrderStatus } : o,
      );
      return updated.filter((o) => KITCHEN_STATUSES.includes(o.status));
    });
  }, [lastEvent]);

  const handleNext = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await api.updateOrderStatus(orderId, next);
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === orderId ? { ...o, status: next } : o,
        );
        return updated.filter((o) => KITCHEN_STATUSES.includes(o.status));
      });
    } catch {
      // SSE will reconcile state
    }
  };

  return (
    <div className="pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">{t.activeOrders}</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            {orders.length} {t.queueInfo}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold border border-indigo-100">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ClipboardList className="w-12 h-12 text-slate-200" />
          <p className="font-bold text-slate-400">{t.noActiveOrders}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-[28px] shadow-sm flex flex-col overflow-hidden border-t-4 border border-slate-100 ${
                  BORDER_COLOR[order.status] ?? 'border-t-slate-200'
                }`}
              >
                <div className="p-6 flex-1 flex flex-col gap-4">
                  {/* Ticket header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-slate-800">
                        #{order.ticketNumber}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {t.table} {order.table} · {t.dineIn}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Items */}
                  <div className="border-y border-slate-50 py-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-800">
                            {item.qty}× {item.name}
                          </span>
                        </div>
                        {item.modifications?.map((mod) => (
                          <span
                            key={mod}
                            className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-tighter mt-1 inline-block mr-1"
                          >
                            • {mod}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 font-medium">{order.timestamp}</p>
                </div>

                {/* Action button */}
                {NEXT_STATUS[order.status] && (
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleNext(order.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all shadow-sm shadow-indigo-100"
                    >
                      {order.status === 'Received'
                        ? t.acceptOrder
                        : order.status === 'Preparing'
                          ? t.completeOrder
                          : t.markReady}
                    </button>
                  </div>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
