import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { api } from '../../services/api';
import { useLang } from '../../context/LangContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Spinner';
import { formatVnd } from '../../utils/money';
import type { Order, OrderStatus } from '../../types';

const STATUS_TABS: (OrderStatus | 'All')[] = [
  'All',
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const { t } = useLang();

  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'All'>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getOrders(
        activeStatus === 'All' ? undefined : activeStatus,
      );
      setOrders(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className='flex-1 p-6 space-y-6 mt-12'>
      {/* Header */}
      <div className='flex items-center justify-end'>
        <button
          onClick={load}
          disabled={loading}
          className='flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.ordersRefresh}
        </button>
      </div>

      {/* Status filter tabs */}
      <div className='flex flex-wrap gap-2'>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeStatus === s
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'All' ? t.ordersAll : s}
          </button>
        ))}
      </div>

      {/* Content */}
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
          <Receipt className='w-12 h-12 text-slate-200' />
          <p className='font-bold text-slate-400'>{t.ordersNoData}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <div
                key={order.id}
                className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'
              >
                {/* Row */}
                <button
                  className='w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors'
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  {/* Ticket + table */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg'>
                        #{order.ticketNumber}
                      </span>
                      <span className='text-sm font-bold text-slate-700'>
                        {t.ordersTable} {order.table}
                      </span>
                    </div>
                    <p className='text-xs text-slate-400 mt-0.5'>
                      {order.timestamp} · {order.items?.length ?? 0}{' '}
                      {t.ordersItems}
                    </p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={order.status} />

                  {/* Total */}
                  <div className='text-right hidden sm:block'>
                    <p className='text-sm font-extrabold text-slate-800'>
                      {formatVnd(order.total)}
                    </p>
                    <span
                      className={`text-xs font-bold ${
                        order.isPaid ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    >
                      {order.isPaid ? t.ordersPaid : t.ordersUnpaid}
                    </span>
                  </div>

                  {/* Expand icon */}
                  <div className='text-slate-300'>
                    {expanded ? (
                      <ChevronUp className='w-4 h-4' />
                    ) : (
                      <ChevronDown className='w-4 h-4' />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className='border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-2'>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className='flex justify-between text-sm'
                      >
                        <span className='text-slate-700'>
                          <span className='font-bold text-slate-400 mr-2'>
                            ×{item.qty}
                          </span>
                          {item.name}
                          {item.modifications &&
                            item.modifications.length > 0 && (
                              <span className='text-xs text-slate-400 ml-1'>
                                ({item.modifications.join(', ')})
                              </span>
                            )}
                        </span>
                        <span className='font-semibold text-slate-600 shrink-0'>
                          {formatVnd(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between pt-2 border-t border-slate-200 font-extrabold text-slate-800 text-sm'>
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
