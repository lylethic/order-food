'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  CheckCircle2,
  Wallet,
  CircleDollarSign,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useStaffLayout } from '@/contexts/staff-layout-context';
import orderApiRequest from '@/apiRequests/order';
import Spinner from '@/components/restaurant/spinner';
import MenuItemReviewBrowser from '@/app/admin/comments/_components/menu-item-review-browser';
import InvoiceModal, {
  type InvoiceData,
} from '@/components/restaurant/invoice-modal';
import { formatVnd } from '@/lib/money';
import { formatPaymentMethod } from '@/lib/payment';
import type {
  OrderType,
  OrderStatusType,
  PaymentMethodType,
} from '@/schemaValidations/order.schema';

const PAYMENT_METHODS: PaymentMethodType[] = [
  'Cash',
  'Credit Card',
  'E-Wallet',
  'Bank Transfer',
];

export default function ServerPage() {
  const { t, lang } = useAppContext();
  const { lastEvent } = useStaffLayout();

  const [readyOrders, setReadyOrders] = useState<OrderType[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<OrderType[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, PaymentMethodType>
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
      const [readyRes, deliveredRes] = await Promise.all([
        orderApiRequest.list({ status: 'Ready', is_paid: false }),
        orderApiRequest.list({ status: 'Delivered', is_paid: false }),
      ]);
      const readyData = readyRes.payload.data;
      const deliveredData = deliveredRes.payload.data;
      const readyAll: OrderType[] = Array.isArray(readyData)
        ? readyData
        : ((readyData as any)?.data ?? []);
      const deliveredAll: OrderType[] = Array.isArray(deliveredData)
        ? deliveredData
        : ((deliveredData as any)?.data ?? []);
      setReadyOrders(readyAll);
      setUnpaidOrders(deliveredAll.filter((o) => !o.isPaid));
    } catch {
      // keep current
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDeliver = async (orderId: string) => {
    try {
      await orderApiRequest.updateStatus(orderId, { status: 'Delivered' });
      setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
      loadOrders();
    } catch {
      // SSE will reconcile
    }
  };

  const getOrderTotal = (order: OrderType) =>
    order.items?.reduce((sum, item) => sum + item.price * item.qty, 0) ??
    order.total;

  const handleCollectPayment = async (orderId: string) => {
    const paymentMethod = selectedMethods[orderId] ?? 'Cash';
    setPayingOrderId(orderId);
    try {
      const res = await orderApiRequest.markPaid(orderId, { paymentMethod });
      await orderApiRequest.updateStatus(orderId, { status: 'Received' });
      const result = res.payload.data as any;
      const paidOrder = unpaidOrders.find((o) => o.id === orderId);
      if (paidOrder) {
        setInvoiceData({
          ticketNumber: paidOrder.ticketNumber,
          table: paidOrder.table,
          isPaid: true,
          paymentMethod,
          paidAt: result?.paidAt,
          timestamp: paidOrder.timestamp,
          items: paidOrder.items ?? [],
          total: getOrderTotal(paidOrder),
        });
      }
      setUnpaidOrders((prev) => prev.filter((o) => o.id !== orderId));
      setToast({ type: 'success', message: t.paymentDone });
    } catch (err) {
      setToast({
        type: 'error',
        message: (err as Error)?.message || t.paymentFailed,
      });
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div className='pt-8 pb-32 md:pb-10 px-6 md:px-10 max-w-7xl mx-auto'>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed top-20 right-6 z-50 rounded-xl border px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-sm ${
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

      {/* Ready to serve */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-xl font-extrabold'>{t.readyToServe}</h2>
          <p className='text-sm font-medium mt-0.5'>{t.waitingDelivery}</p>
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
          <Truck className='w-12 h-12' />
          <p className='font-bold'>{t.noReadyOrders}</p>
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
                className='rounded-[28px] p-6 border border-border shadow-sm flex flex-col relative overflow-hidden'
              >
                {idx === 0 && (
                  <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400' />
                )}

                <div className='flex justify-between items-start mb-6'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-widest mb-1'>
                      {t.table}
                    </p>
                    <p className='text-4xl font-extrabold leading-none'>
                      {order.table}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-bold uppercase tracking-widest'>
                      #{order.ticketNumber}
                    </p>
                    <p
                      className={`text-sm font-extrabold mt-1 ${idx === 0 ? 'text-rose-500 animate-pulse' : ''}`}
                    >
                      {order.timestamp}
                    </p>
                  </div>
                </div>

                <div className='flex-1 space-y-3 mb-6'>
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className='flex gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors'
                    >
                      <span className='text-sm font-extrabold text-indigo-600 shrink-0'>
                        {item.qty}×
                      </span>
                      <div>
                        <p className='text-sm font-bold'>{item.name}</p>
                        {item.modifications?.map((mod) => (
                          <p key={mod} className='text-xs font-semibold'>
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

      {/* Unpaid orders */}
      <div className='mt-12 mb-5 flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-extrabold'>{t.unpaidOrders}</h3>
          <p className='text-sm font-medium mt-0.5'>{t.unpaidSub}</p>
        </div>
        <div className='flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-xs font-bold border border-amber-100'>
          <Wallet className='w-3.5 h-3.5' />
          {unpaidOrders.length} {t.items}
        </div>
      </div>

      {loading ? null : unpaidOrders.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-14 gap-3 text-center border border-border rounded-3x'>
          <CircleDollarSign className='w-12 h-12' />
          <p className='font-bold'>{t.noUnpaidOrders}</p>
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
                className='rounded-[28px] p-6 border border-border shadow-sm flex flex-col'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-widest mb-1'>
                      {t.table}
                    </p>
                    <p className='text-2xl font-extrabold leading-none'>
                      {order.table}
                    </p>
                  </div>
                  <p className='text-xs font-bold uppercase tracking-widest'>
                    #{order.ticketNumber}
                  </p>
                </div>

                <div className='rounded-xl border border-border p-3 mb-4'>
                  <div className='flex items-center justify-between text-sm mb-1.5'>
                    <span className='font-semibold'>{t.total}</span>
                    <span className='font-extrabold'>{formatVnd(total)}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className=''>{t.paymentMethod}</span>
                    <span className='font-bold'>
                      {formatPaymentMethod(selectedMethod, lang)}
                    </span>
                  </div>
                </div>

                <label className='text-xs font-bold uppercase tracking-wider mb-2 block'>
                  {t.paymentMethod}
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) =>
                    setSelectedMethods((prev) => ({
                      ...prev,
                      [order.id]: e.target.value as PaymentMethodType,
                    }))
                  }
                  className='w-full h-11 px-3 rounded-xl border border-border text-sm font-semibold mb-4'
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
                        items: order.items ?? [],
                        total,
                      })
                    }
                    title='Preview Invoice'
                    className='px-3.5 rounded-xl border hover:bg-accent hover:text-foreground transition-all'
                  >
                    <Printer className='w-4 h-4' />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className='mt-12'>
        <MenuItemReviewBrowser
          title='Đánh giá món ăn'
          subtitle='Xem đánh giá theo từng món, lọc theo category và phản hồi ngay trong chi tiết món.'
          canReply
          commentScope='all'
        />
      </div>

      {invoiceData && (
        <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />
      )}
    </div>
  );
}
