'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useStaffLayout } from '@/contexts/staff-layout-context';
import orderApiRequest from '@/apiRequests/order';
import Spinner from '@/components/restaurant/spinner';
import StatusBadge from '@/components/restaurant/status-badge';
import { formatVnd } from '@/lib/money';
import type {
  OrderType,
  OrderStatusType,
} from '@/schemaValidations/order.schema';

const STATUS_TABS: (OrderStatusType | 'All')[] = [
  'All',
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
  'Cancelled',
];

export default function StaffOrdersPage() {
  const { t } = useAppContext();
  const { lastEvent } = useStaffLayout();
  const [activeStatus, setActiveStatus] = useState<OrderStatusType | 'All'>(
    'All',
  );
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderApiRequest.list(
        activeStatus === 'All' ? undefined : { status: activeStatus },
      );
      const data = res.payload.data;
      setOrders(Array.isArray(data) ? data : ((data as any)?.data ?? []));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh on SSE status events
  useEffect(() => {
    if (!lastEvent || lastEvent.eventType === 'payment') return;
    load();
  }, [lastEvent]); // eslint-disable-line

  return (
    <div className='flex-1 p-6 space-y-6 mt-8'>
      <div className='flex items-center justify-end'>
        <button
          onClick={load}
          disabled={loading}
          className='flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-accent transition-all disabled:opacity-50'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.ordersRefresh}
        </button>
      </div>

      <div className='flex flex-wrap gap-2'>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeStatus === s
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'border border-border hover:bg-accent'
            }`}
          >
            {s === 'All' ? t.ordersAll : s}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : error ? (
        <div className='text-center py-16 text-rose-500 font-semibold'>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-center'>
          <Receipt className='w-12 h-12' />
          <p className='font-bold'>{t.ordersNoData}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <div
                key={order.id}
                className='rounded-2xl border border-border shadow-sm overflow-hidden'
              >
                <button
                  className='w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent transition-colors'
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg'>
                        #{order.ticketNumber}
                      </span>
                      <span className='text-sm font-bold'>
                        {t.ordersTable} {order.table}
                      </span>
                    </div>
                    <p className='text-xs mt-0.5'>
                      {order.timestamp} · {order.items?.length ?? 0}{' '}
                      {t.ordersItems}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                  <div className='text-right hidden sm:block'>
                    <p className='text-sm font-extrabold'>
                      {formatVnd(order.total)}
                    </p>
                    <span
                      className={`text-xs font-bold ${order.isPaid ? 'text-emerald-600' : 'text-amber-500'}`}
                    >
                      {order.isPaid ? t.ordersPaid : t.ordersUnpaid}
                    </span>
                  </div>
                  <div className=''>
                    {expanded ? (
                      <ChevronUp className='w-4 h-4' />
                    ) : (
                      <ChevronDown className='w-4 h-4' />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className='border-t border-border px-5 py-4 space-y-2'>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className='flex justify-between text-sm'
                      >
                        <span className=''>
                          <span className='font-bold mr-2'>×{item.qty}</span>
                          {item.name}
                          {item.modifications &&
                            item.modifications.length > 0 && (
                              <span className='text-xs ml-1'>
                                ({item.modifications.join(', ')})
                              </span>
                            )}
                        </span>
                        <span className='font-semibold shrink-0'>
                          {formatVnd(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between pt-2 border-t border-border font-extrabold text-sm'>
                      <span>{t.total}</span>
                      <span className='text-indigo-600'>
                        {formatVnd(order.total)}
                      </span>
                    </div>
                    {order.isPaid && order.paidAt && (
                      <p className='text-xs text-emerald-600 font-semibold'>
                        {t.paidAt}: {new Date(order.paidAt).toLocaleString()}
                        {order.paymentMethod && ` · ${order.paymentMethod}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
