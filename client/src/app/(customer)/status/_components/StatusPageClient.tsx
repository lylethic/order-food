'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useCustomerLayout } from '@/contexts/customer-layout-context';
import StatusBadge from '@/components/restaurant/status-badge';
import Spinner from '@/components/restaurant/spinner';
import { formatVnd } from '@/lib/money';
import orderApiRequest from '@/apiRequests/order';
import type {
  OrderStatusType,
  OrderType,
} from '@/schemaValidations/order.schema';

const STATUS_STEPS: OrderStatusType[] = [
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
];

export default function StatusPageClient() {
  const router = useRouter();
  const { user, t } = useAppContext();
  const { placedOrder, onCancelOrder, lastEvent } = useCustomerLayout();

  const [status, setStatus] = useState<OrderStatusType>(
    (placedOrder?.status as OrderStatusType) ?? 'Received',
  );
  const [cancelling, setCancelling] = useState(false);

  // My orders (for logged-in customers)
  const [myOrders, setMyOrders] = useState<OrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (lastEvent && placedOrder && lastEvent.orderId === placedOrder.id) {
      setStatus(lastEvent.status as OrderStatusType);
      // Keep sessionStorage in sync so status survives remounts
      try {
        const updated = { ...placedOrder, status: lastEvent.status };
        sessionStorage.setItem('placedOrder', JSON.stringify(updated));
      } catch {}
    }
  }, [lastEvent, placedOrder]);

  useEffect(() => {
    if (placedOrder) setStatus(placedOrder.status as OrderStatusType);
  }, [placedOrder?.id]); // eslint-disable-line

  useEffect(() => {
    if (!user || !t) return;
    setOrdersLoading(true);
    orderApiRequest
      .myOrders()
      .then((res) => {
        const data = res.payload.data;
        setMyOrders(Array.isArray(data) ? data : ((data as any)?.data ?? []));
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleCancel = async () => {
    if (!placedOrder) return;
    setCancelling(true);
    try {
      await onCancelOrder();
    } finally {
      setCancelling(false);
    }
  };

  const activeIdx = STATUS_STEPS.indexOf(status);
  const isCancelled = status === 'Cancelled';

  const stepLabels: Record<OrderStatusType, { label: string; desc: string }> = {
    Received: t.steps.received,
    Preparing: t.steps.preparing,
    Cooking: t.steps.cooking,
    Ready: t.steps.ready,
    Delivered: t.steps.delivered,
    Cancelled: t.steps.cancelled,
  };

  const filteredHistory = myOrders.filter(o => o.id !== placedOrder?.id);

  const OrderHistory = () => (
    user && (
      <div className='mt-10 border-t border-border pt-10'>
        <h3 className='text-base font-extrabold mb-4'>
          {placedOrder ? 'Lịch sử đơn hàng khác' : 'Lịch sử đơn hàng'}
        </h3>
        {ordersLoading ? (
          <div className='flex justify-center py-10'>
            <Spinner size='lg' />
          </div>
        ) : filteredHistory.length === 0 ? (
          <p className='text-sm text-center py-8 opacity-60'>Chưa có đơn hàng nào khác.</p>
        ) : (
          <div className='space-y-3'>
            {filteredHistory.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/status/${order.id}`)}
                className='w-full rounded-2xl border border-border shadow-sm px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-border transition-all text-left bg-card'
              >
                <div>
                  <p className='text-sm font-extrabold'>
                    #{order.ticketNumber} · {t.table} {order.table}
                  </p>
                  <p className='text-xs mt-0.5 opacity-70'>
                    {order.timestamp} · {formatVnd(order.total)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  );

  if (!placedOrder) {
    return (
      <div className='pt-8 pb-32 md:pb-10 px-6 md:px-10 max-w-2xl mx-auto'>
        <div className='flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center'>
          <ClipboardList className='w-16 h-16 ' />
          <h2 className='text-lg font-extrabold '>{t.noOrderYet}</h2>
          <p className=' text-sm'>{t.noOrderSub}</p>
          <button
            onClick={() => router.push('/menu')}
            className='mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95'
          >
            {t.menu}
          </button>
        </div>

        <OrderHistory />
      </div>
    );
  }

  return (
    <div className='pt-8 pb-32 md:pb-10 px-6 md:px-10 max-w-lg mx-auto'>
      <button
        onClick={() => router.push('/menu')}
        className='flex items-center gap-2 hover:text-foreground text-sm font-semibold mb-6 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        {t.menu}
      </button>

      <div className='rounded-3xl shadow-sm border border-border p-6 mb-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <p className='text-xs font-bold uppercase tracking-widest'>
              {t.orderNumber}
            </p>
            <p className='text-2xl font-extrabold'>
              #{placedOrder.ticketNumber}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {isCancelled ? (
          <div className='flex flex-col items-center gap-3 py-6 text-center'>
            <XCircle className='w-12 h-12 text-rose-400' />
            <p className='font-bold'>{t.orderCancelled}</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {STATUS_STEPS.map((step, idx) => {
              const done = idx < activeIdx;
              const active = idx === activeIdx;
              const info = stepLabels[step];
              return (
                <div key={step} className='flex items-start gap-3'>
                  <div className='relative flex flex-col items-center'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        done
                          ? 'bg-indigo-600 text-white'
                          : active
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : 'bg-muted'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className='w-4 h-4' />
                      ) : active ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Clock className='w-4 h-4' />
                        </motion.div>
                      ) : null}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-1 h-6 mt-1 transition-colors ${
                          done ? 'bg-indigo-600' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                  <div className='flex-1 py-0.5'>
                    <p
                      className={`font-bold text-sm ${
                        done || active ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {info.label}
                    </p>
                    <p className='text-xs'>{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isCancelled && (
        <button
          disabled={cancelling}
          onClick={handleCancel}
          className='w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50'
        >
          {cancelling ? `${t.cancelling}...` : t.cancel}
        </button>
      )}

      <OrderHistory />
    </div>
  );
}
