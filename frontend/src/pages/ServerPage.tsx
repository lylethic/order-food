import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { Spinner } from '../components/Spinner';
import type { Order, OrderStatus } from '../types';
import type { StaffOutletContext } from '../layouts/StaffLayout';

export default function ServerPage() {
  const { t } = useLang();
  const { lastEvent } = useOutletContext<StaffOutletContext>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders('Ready');
      setOrders(data);
    } catch {
      // keep current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.status === 'Ready') {
      loadOrders();
    } else if (lastEvent.status === 'Delivered' || lastEvent.status === 'Cancelled') {
      setOrders((prev) => prev.filter((o) => o.id !== lastEvent.orderId));
    }
  }, [lastEvent, loadOrders]);

  const handleDeliver = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, 'Delivered' as OrderStatus);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      // SSE will reconcile
    }
  };

  return (
    <div className="pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">{t.readyToServe}</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">{t.waitingDelivery}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {orders.length} {t.newItems}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Truck className="w-12 h-12 text-slate-200" />
          <p className="font-bold text-slate-400">{t.noReadyOrders}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order, idx) => (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden"
              >
                {idx === 0 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 to-indigo-400" />
                )}

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {t.table}
                    </p>
                    <p className="text-4xl font-extrabold text-slate-800 leading-none">
                      {order.table}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      #{order.ticketNumber}
                    </p>
                    <p
                      className={`text-sm font-extrabold mt-1 ${
                        idx === 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      {order.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-extrabold text-indigo-600 shrink-0">
                        {item.qty}×
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        {item.modifications?.map((mod) => (
                          <p key={mod} className="text-xs text-slate-400 font-semibold">
                            {mod}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDeliver(order.id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.confirmDelivery}
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
