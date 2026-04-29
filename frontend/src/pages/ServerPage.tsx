import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  CheckCircle2,
  Wallet,
  CircleDollarSign,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { Spinner } from '../components/Spinner';
import { formatVnd } from '../utils/money';
import { formatPaymentMethod } from '../utils/payment';
import InvoiceModal, { type InvoiceData } from '../components/InvoiceModal';
import type { Order, OrderStatus, PaymentMethod } from '../types';
import type { StaffOutletContext } from '../layouts/StaffLayout';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'E-Wallet',
  'Bank Transfer',
];

export default function ServerPage() {
  const { t, lang } = useLang();
  const { lastEvent } = useOutletContext<StaffOutletContext>();

  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, PaymentMethod>
  >({});
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const [readyData, deliveredData] = await Promise.all([
        api.getOrders('Ready'),
        api.getOrders('Delivered'),
      ]);
      setReadyOrders(readyData);
      setUnpaidOrders(deliveredData.filter((order) => !order.isPaid));
    } catch {
      // keep current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.eventType === 'payment') return;
    if (lastEvent.status === 'Ready') {
      loadOrders();
    } else if (lastEvent.status === 'Delivered') {
      setReadyOrders((prev) => prev.filter((o) => o.id !== lastEvent.orderId));
      loadOrders();
    } else if (lastEvent.status === 'Cancelled') {
      setReadyOrders((prev) => prev.filter((o) => o.id !== lastEvent.orderId));
      setUnpaidOrders((prev) => prev.filter((o) => o.id !== lastEvent.orderId));
    }
  }, [lastEvent, loadOrders]);

  const handleDeliver = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, 'Delivered' as OrderStatus);
      setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
      loadOrders();
    } catch {
      // SSE will reconcile
    }
  };

  const getOrderTotal = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCollectPayment = async (orderId: string) => {
    const paymentMethod = selectedMethods[orderId] ?? 'Cash';
    setPayingOrderId(orderId);
    try {
      const result = await api.markOrderPaid(orderId, paymentMethod);
      const paidOrder = unpaidOrders.find((o) => o.id === orderId);
      if (paidOrder) {
        setInvoiceData({
          ticketNumber: paidOrder.ticketNumber,
          table: paidOrder.table,
          isPaid: true,
          paymentMethod,
          paidAt: result.paidAt,
          timestamp: paidOrder.timestamp,
          items: paidOrder.items,
          total: getOrderTotal(paidOrder),
        });
      }
      setUnpaidOrders((prev) => prev.filter((order) => order.id !== orderId));
      setToast({ type: 'success', message: t.paymentDone });
    } catch (err) {
      const message = (err as Error)?.message || t.paymentFailed;
      setToast({ type: 'error', message });
    } finally {
      setPayingOrderId(null);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className='pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-350 mx-auto'>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed top-24 right-6 z-50 rounded-xl border px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <div className='flex items-center gap-2'>
              {toast.type === 'success' ? (
                <CheckCircle2 className='w-4 h-4' />
              ) : (
                <AlertCircle className='w-4 h-4' />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-xl font-extrabold text-slate-800'>
            {t.readyToServe}
          </h2>
          <p className='text-sm text-slate-400 font-medium mt-0.5'>
            {t.waitingDelivery}
          </p>
        </div>
        <div className='flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100'>
          <CheckCircle2 className='w-3.5 h-3.5' />
          {readyOrders.length} {t.newItems}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : readyOrders.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-center'>
          <Truck className='w-12 h-12 text-slate-200' />
          <p className='font-bold text-slate-400'>{t.noReadyOrders}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence>
            {readyOrders.map((order, idx) => (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className='bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden'
              >
                {idx === 0 && (
                  <div className='absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 to-indigo-400' />
                )}

                <div className='flex justify-between items-start mb-6'>
                  <div>
                    <p className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-1'>
                      {t.table}
                    </p>
                    <p className='text-4xl font-extrabold text-slate-800 leading-none'>
                      {order.table}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
                      #{order.ticketNumber}
                    </p>
                    <p
                      className={`text-sm font-extrabold mt-1 ${
                        idx === 0
                          ? 'text-rose-500 animate-pulse'
                          : 'text-slate-400'
                      }`}
                    >
                      {order.timestamp}
                    </p>
                  </div>
                </div>

                <div className='flex-1 space-y-3 mb-6'>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className='flex gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors'
                    >
                      <span className='text-sm font-extrabold text-indigo-600 shrink-0'>
                        {item.qty}×
                      </span>
                      <div>
                        <p className='text-sm font-bold text-slate-800'>
                          {item.name}
                        </p>
                        {item.modifications?.map((mod) => (
                          <p
                            key={mod}
                            className='text-xs text-slate-400 font-semibold'
                          >
                            {mod}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDeliver(order.id)}
                  className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-100'
                >
                  <CheckCircle2 className='w-4 h-4' />
                  {t.confirmDelivery}
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className='mt-12 mb-5 flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-extrabold text-slate-800'>
            {t.unpaidOrders}
          </h3>
          <p className='text-sm text-slate-400 font-medium mt-0.5'>
            {t.unpaidSub}
          </p>
        </div>
        <div className='flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-xs font-bold border border-amber-100'>
          <Wallet className='w-3.5 h-3.5' />
          {unpaidOrders.length} {t.items}
        </div>
      </div>

      {loading ? null : unpaidOrders.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-14 gap-3 text-center border border-slate-100 rounded-3xl bg-white'>
          <CircleDollarSign className='w-12 h-12 text-slate-200' />
          <p className='font-bold text-slate-400'>{t.noUnpaidOrders}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {unpaidOrders.map((order) => {
            const selectedMethod = selectedMethods[order.id] ?? 'Cash';
            const total = getOrderTotal(order);
            const isPaying = payingOrderId === order.id;

            return (
              <article
                key={order.id}
                className='bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm flex flex-col'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <p className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-1'>
                      {t.table}
                    </p>
                    <p className='text-2xl font-extrabold text-slate-800 leading-none'>
                      {order.table}
                    </p>
                  </div>
                  <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
                    #{order.ticketNumber}
                  </p>
                </div>

                <div className='rounded-xl border border-slate-100 bg-slate-50 p-3 mb-4'>
                  <div className='flex items-center justify-between text-sm mb-1.5'>
                    <span className='text-slate-500 font-semibold'>
                      {t.total}
                    </span>
                    <span className='font-extrabold text-slate-800'>
                      {formatVnd(total)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-400'>{t.paymentMethod}</span>
                    <span className='font-bold text-slate-600'>
                      {formatPaymentMethod(selectedMethod, lang)}
                    </span>
                  </div>
                </div>

                <label className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block'>
                  {t.paymentMethod}
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => {
                    setSelectedMethods((prev) => ({
                      ...prev,
                      [order.id]: e.target.value as PaymentMethod,
                    }));
                  }}
                  className='w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 mb-4 bg-white'
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {formatPaymentMethod(method, lang)}
                    </option>
                  ))}
                </select>

                <div className='flex gap-2'>
                  <button
                    onClick={() => handleCollectPayment(order.id)}
                    disabled={isPaying}
                    className='flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-100'
                  >
                    <CircleDollarSign className='w-4 h-4' />
                    {isPaying ? t.processingPayment : t.collectPayment}
                  </button>
                  <button
                    onClick={() =>
                      setInvoiceData({
                        ticketNumber: order.ticketNumber,
                        table: order.table,
                        isPaid: false,
                        paymentMethod: selectedMethod,
                        paidAt: undefined,
                        timestamp: order.timestamp,
                        items: order.items,
                        total,
                      })
                    }
                    title='Preview Invoice'
                    className='px-3.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all'
                  >
                    <Printer className='w-4 h-4' />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {invoiceData && (
        <InvoiceModal
          data={invoiceData}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </div>
  );
}
