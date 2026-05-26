'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Clock } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useStaffLayout } from '@/contexts/staff-layout-context';
import orderApiRequest from '@/apiRequests/order';
import Spinner from '@/components/restaurant/spinner';
import StatusBadge from '@/components/restaurant/status-badge';
import MenuItemReviewBrowser from '@/app/admin/comments/_components/menu-item-review-browser';
import { computeWaitInfo, WAIT_LEVEL_STYLE, type WaitInfo } from '@/lib/wait-level';
import type {
  OrderType,
  OrderStatusType,
} from '@/schemaValidations/order.schema';

function WaitBadge({ createdAt }: { createdAt: string }) {
  const [info, setInfo] = useState<WaitInfo>(() => computeWaitInfo(createdAt));

  useEffect(() => {
    const id = setInterval(() => setInfo(computeWaitInfo(createdAt)), 60_000);
    return () => clearInterval(id);
  }, [createdAt]);

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${WAIT_LEVEL_STYLE[info.waitLevel]}`}
    >
      <Clock className='w-3 h-3' />
      {info.waitTimeMinutes}m · {info.waitLevel}
    </span>
  );
}

const KITCHEN_STATUSES: OrderStatusType[] = [
  'Received',
  'Preparing',
  'Cooking',
];

const NEXT_STATUS: Partial<Record<OrderStatusType, OrderStatusType>> = {
  Received: 'Preparing',
  Preparing: 'Cooking',
  Cooking: 'Ready',
};

const BORDER_COLOR: Partial<Record<OrderStatusType, string>> = {
  Received: 'border-t-emerald-400',
  Preparing: 'border-t-amber-400',
  Cooking: 'border-t-orange-500',
};

export default function KitchenPage() {
  const { t } = useAppContext();
  const { lastEvent } = useStaffLayout();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const res = await orderApiRequest.list();
      const data = res.payload.data;
      const all: OrderType[] = Array.isArray(data)
        ? data
        : ((data as any)?.data ?? []);
      setOrders(all.filter((o) => KITCHEN_STATUSES.includes(o.status)));
    } catch {
      // keep previous
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
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === lastEvent.orderId
          ? { ...o, status: lastEvent.status as OrderStatusType }
          : o,
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
      await orderApiRequest.updateStatus(orderId, { status: next });
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === orderId ? { ...o, status: next } : o,
        );
        return updated.filter((o) => KITCHEN_STATUSES.includes(o.status));
      });
    } catch {
      // SSE will reconcile
    }
  };

  return (
    <div className='pt-8 pb-32 md:pb-10 px-6 md:px-10 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-xl font-extrabold'>{t.activeOrders}</h2>
          <p className='text-sm font-medium mt-0.5'>
            {orders.length} {t.queueInfo}
          </p>
        </div>
        <div className='flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold border border-indigo-100'>
          <span className='w-2 h-2 rounded-full bg-indigo-500 animate-ping' />
          Live
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : orders.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-center'>
          <ClipboardList className='w-12 h-12' />
          <p className='font-bold'>{t.noActiveOrders}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence>
            {orders.map((order) => (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-[28px] shadow-sm flex flex-col overflow-hidden border-t-4 border border-border ${
                  BORDER_COLOR[order.status] ?? 'border-t-slate-200'
                }`}
              >
                <div className='p-6 flex-1 flex flex-col gap-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-2xl font-extrabold'>
                        #{order.ticketNumber}
                      </p>
                      <p className='text-xs font-bold uppercase tracking-wider mt-0.5'>
                        {t.table} {order.table} · {t.dineIn}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className='border-y border-border py-4 space-y-2'>
                    {order.items?.map((item) => (
                      <div key={item.id}>
                        <div className='flex justify-between text-sm'>
                          <span className='font-bold'>
                            {item.qty}× {item.name}
                          </span>
                        </div>
                        {item.modifications?.map((mod) => (
                          <span
                            key={mod}
                            className='text-[10px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-tighter mt-1 inline-block mr-1'
                          >
                            • {mod}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='text-xs font-medium'>{order.timestamp}</p>
                    {order.createdAt && (
                      <WaitBadge createdAt={order.createdAt} />
                    )}
                  </div>
                </div>

                {NEXT_STATUS[order.status] && (
                  <div className='px-6 pb-6'>
                    <button
                      onClick={() => handleNext(order.id)}
                      className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all shadow-sm shadow-indigo-100'
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

      <div className='mt-12'>
        <MenuItemReviewBrowser
          title='Đánh giá món ăn'
          subtitle='Theo dõi đánh giá theo từng món và phản hồi khi cần.'
          canReply
          commentScope='all'
        />
      </div>
    </div>
  );
}
