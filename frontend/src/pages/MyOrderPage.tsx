import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  ClipboardList,
  RefreshCw,
  FileText,
  Star,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { Spinner } from '../components/Spinner';
import { StatusBadge } from '../components/StatusBadge';
import { formatVnd } from '../utils/money';
import { formatPaymentMethod } from '../utils/payment';
import InvoiceModal from '../components/InvoiceModal';
import type { CustomerOutletContext } from '../layouts/CustomerLayout';
import type {
  OrderDetail,
  OrderItem,
  OrderSummary,
  OrderStatus,
  PaymentMethod,
} from '../types';

// ─── Mini StarRating ──────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type='button'
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className='transition-transform active:scale-90'
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              (hovered || value) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Rating Panel ─────────────────────────────────────────────────────────────

function RatingPanel({ items, orderId }: { items: OrderItem[]; orderId: string }) {
  const rateableItems = items.filter((i) => i.menuItemId);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (item: OrderItem) => {
    if (!item.menuItemId) return;
    const content = comments[item.id]?.trim();
    if (!content) {
      setErrors((e) => ({ ...e, [item.id]: 'Vui lòng nhập nội dung đánh giá' }));
      return;
    }
    setErrors((e) => ({ ...e, [item.id]: '' }));
    setSubmitting((s) => ({ ...s, [item.id]: true }));
    try {
      await api.createComment(item.menuItemId!, {
        content,
        rating: ratings[item.id] ?? undefined,
      });
      setSubmitted((s) => ({ ...s, [item.id]: true }));
    } catch (err: any) {
      setErrors((e) => ({ ...e, [item.id]: err.message ?? 'Gửi thất bại' }));
    } finally {
      setSubmitting((s) => ({ ...s, [item.id]: false }));
    }
  };

  if (rateableItems.length === 0) return null;

  return (
    <div className='border border-amber-100 bg-amber-50 rounded-2xl p-4 space-y-4'>
      <h4 className='font-extrabold text-slate-800 flex items-center gap-2 text-sm'>
        <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
        Đánh giá món ăn của bạn
      </h4>

      <div className='space-y-3'>
        {rateableItems.map((item) => (
          <div key={item.id} className='bg-white rounded-xl border border-slate-100 p-3'>
            <p className='font-bold text-slate-800 text-sm mb-2'>{item.name}</p>

            {submitted[item.id] ? (
              <div className='flex items-center gap-2 text-emerald-600 text-sm font-semibold py-1'>
                <CheckCircle2 className='w-4 h-4' />
                Đánh giá đã được gửi. Cảm ơn bạn!
              </div>
            ) : (
              <div className='space-y-2'>
                <StarPicker
                  value={ratings[item.id] ?? 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [item.id]: v }))}
                />
                <div className='flex gap-2'>
                  <input
                    value={comments[item.id] ?? ''}
                    onChange={(e) =>
                      setComments((c) => ({ ...c, [item.id]: e.target.value }))
                    }
                    placeholder='Chia sẻ cảm nhận...'
                    className='flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300'
                  />
                  <button
                    onClick={() => handleSubmit(item)}
                    disabled={submitting[item.id]}
                    className='px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1'
                  >
                    {submitting[item.id] ? (
                      <Spinner size='sm' />
                    ) : (
                      <Send className='w-3.5 h-3.5' />
                    )}
                  </button>
                </div>
                {errors[item.id] && (
                  <p className='text-xs text-rose-500'>{errors[item.id]}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyOrderPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { placedOrder, lastEvent } = useOutletContext<CustomerOutletContext>();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingList(true);
      setError('');
      try {
        const items = await api.getCustomerOrders();
        if (!mounted) return;

        setOrders(items);

        const initialId = placedOrder?.id || items[0]?.id || '';
        setSelectedOrderId(initialId);

        if (initialId) {
          setLoadingDetail(true);
          const detail = await api.getCustomerOrderDetail(initialId);
          if (!mounted) return;
          setSelectedOrder(detail);
        } else {
          setSelectedOrder(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message);
      } finally {
        if (mounted) {
          setLoadingList(false);
          setLoadingDetail(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [placedOrder?.id]);
  console.log(selectedOrder);

  useEffect(() => {
    if (!lastEvent) return;

    console.log('[MyOrderPage] Update triggered for lastEvent:', lastEvent);

    if (lastEvent.eventType === 'payment') {
      setOrders((current) =>
        current.map((order) =>
          order.id === lastEvent.orderId
            ? {
                ...order,
                isPaid: lastEvent.isPaid ?? true,
                paymentMethod: lastEvent.paymentMethod as
                  | PaymentMethod
                  | undefined,
                paidAt: lastEvent.paidAt,
              }
            : order,
        ),
      );

      setSelectedOrder((current) =>
        current && current.id === lastEvent.orderId
          ? {
              ...current,
              isPaid: lastEvent.isPaid ?? true,
              paymentMethod: lastEvent.paymentMethod as
                | PaymentMethod
                | undefined,
              paidAt: lastEvent.paidAt,
            }
          : current,
      );
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === lastEvent.orderId
          ? { ...order, status: lastEvent.status as OrderStatus }
          : order,
      ),
    );

    setSelectedOrder((current) =>
      current && current.id === lastEvent.orderId
        ? { ...current, status: lastEvent.status as OrderStatus }
        : current,
    );
  }, [lastEvent]);

  const handleSelect = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    setError('');
    try {
      const detail = await api.getCustomerOrderDetail(orderId);
      setSelectedOrder(detail);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefresh = async () => {
    setLoadingList(true);
    setError('');
    try {
      const items = await api.getCustomerOrders();
      setOrders(items);
      if (selectedOrderId) {
        const detail = await api.getCustomerOrderDetail(selectedOrderId);
        setSelectedOrder(detail);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder || selectedOrder.status !== 'Received') return;

    try {
      await api.cancelOrder(selectedOrder.id);
      setSelectedOrder((current) =>
        current ? { ...current, status: 'Cancelled' } : current,
      );
      setOrders((current) =>
        current.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: 'Cancelled' }
            : order,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const paymentBadgeClass = (isPaid: boolean) =>
    isPaid
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className='pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-8 gap-4'>
        <div className='flex items-center gap-3'>
          <div>
            <h2 className='text-2xl font-extrabold text-slate-800'>
              {t.orderStatus}
            </h2>
            <p className='text-slate-400 font-medium text-sm mt-0.5'>
              {t.statusSub}
            </p>
          </div>
          {lastEvent !== null && (
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full'>
              <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse' />
              <span className='text-xs font-semibold text-emerald-700'>
                Live
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={handleRefresh}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all'
          >
            <RefreshCw className='w-4 h-4' />
            Refresh
          </button>
          <button
            onClick={() => navigate('/menu')}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-sm transition-all'
          >
            <ArrowLeft className='w-4 h-4' />
            {t.backToMenu}
          </button>
        </div>
      </div>

      {error && (
        <div className='mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600'>
          {error}
        </div>
      )}

      {loadingList ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : orders.length === 0 ? (
        <div className='bg-white rounded-[28px] p-10 border border-slate-100 shadow-sm text-center'>
          <ClipboardList className='w-16 h-16 text-slate-200 mx-auto mb-4' />
          <p className='text-xl font-extrabold text-slate-700'>
            {t.noOrderYet}
          </p>
          <p className='text-slate-400 font-medium mt-2'>{t.noOrderSub}</p>
          <button
            onClick={() => navigate('/menu')}
            className='mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-100'
          >
            <ArrowLeft className='w-4 h-4' />
            {t.backToMenu}
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6'>
          <div className='bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-extrabold text-slate-800'>My Orders</h3>
              <span className='text-xs font-bold text-slate-400'>
                {orders.length} orders
              </span>
            </div>

            <div className='space-y-3 max-h-[70vh] overflow-y-auto pr-1'>
              {orders.map((order) => {
                const isActive = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelect(order.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isActive
                        ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3 mb-3'>
                      <div>
                        <p className='font-extrabold text-slate-800'>
                          #{order.ticketNumber}
                        </p>
                        <p className='text-xs text-slate-400 mt-0.5 flex items-center gap-1'>
                          <Clock3 className='w-3.5 h-3.5' />
                          {order.timestamp}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-slate-500'>
                        Table {order.table} · {order.itemCount} items
                      </span>
                      <span className='font-extrabold text-slate-800'>
                        {formatVnd(order.total)}
                      </span>
                    </div>

                    <div className='mt-3'>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${paymentBadgeClass(Boolean(order.isPaid))}`}
                      >
                        {Boolean(order.isPaid) ? t.paid : t.unpaid}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm min-h-105'>
            {loadingDetail || !selectedOrder ? (
              <div className='flex h-full min-h-90 items-center justify-center'>
                <Spinner size='lg' />
              </div>
            ) : (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='space-y-6'
              >
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-widest text-slate-400 mb-2'>
                      Order Detail
                    </p>
                    <h3 className='text-2xl font-extrabold text-slate-800'>
                      #{selectedOrder.ticketNumber}
                    </h3>
                    <p className='text-sm text-slate-400 mt-1'>
                      Table {selectedOrder.table} · {selectedOrder.timestamp}
                    </p>
                  </div>
                  <StatusBadge status={selectedOrder.status} />
                </div>

                <div className='rounded-2xl bg-slate-50 p-4 border border-slate-100'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>Status</span>
                    <span className='font-bold text-slate-800'>
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div className='mt-3 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>{t.paymentStatus}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${paymentBadgeClass(Boolean(selectedOrder.isPaid))}`}
                    >
                      {Boolean(selectedOrder.isPaid) ? t.paid : t.unpaid}
                    </span>
                  </div>

                  <div className='mt-3 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>{t.paymentMethod}</span>
                    <span className='font-bold text-slate-800'>
                      {formatPaymentMethod(selectedOrder.paymentMethod, lang)}
                    </span>
                  </div>

                  <div className='mt-3 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>{t.paidAt}</span>
                    <span className='font-bold text-slate-800'>
                      {selectedOrder.paidAt
                        ? new Date(selectedOrder.paidAt).toLocaleString()
                        : '--'}
                    </span>
                  </div>

                  <div className='mt-3 flex items-center justify-between text-sm'>
                    <span className='text-slate-500'>Total</span>
                    <span className='font-extrabold text-indigo-600'>
                      {formatVnd(selectedOrder.total)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className='font-extrabold text-slate-800 mb-4'>Items</h4>
                  <div className='space-y-3'>
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className='flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-4'
                      >
                        <div>
                          <p className='font-bold text-slate-800'>
                            {item.name}
                          </p>
                          <p className='text-sm text-slate-400 mt-0.5'>
                            Qty {item.qty}
                            {item.modifications?.length
                              ? ` · ${item.modifications.join(', ')}`
                              : ''}
                          </p>
                        </div>
                        <p className='font-extrabold text-slate-800'>
                          {formatVnd(item.price * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating panel — show after delivery */}
                {(selectedOrder.status === 'Delivered' || selectedOrder.isPaid) && (
                  <RatingPanel items={selectedOrder.items} orderId={selectedOrder.id} />
                )}

                {selectedOrder.status === 'Received' && (
                  <button
                    onClick={handleCancel}
                    className='w-full py-3.5 border border-rose-200 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-50 active:scale-95 transition-all'
                  >
                    {t.cancelOrder}
                  </button>
                )}

                {selectedOrder.isPaid && (
                  <button
                    onClick={() => setShowInvoice(true)}
                    className='w-full py-3.5 border border-indigo-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2'
                  >
                    <FileText className='w-4 h-4' />
                    {lang === 'vi'
                      ? 'Xem & Tải hóa đơn'
                      : 'View & Download Invoice'}
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {showInvoice && selectedOrder && (
        <InvoiceModal
          data={{
            ticketNumber: selectedOrder.ticketNumber,
            table: selectedOrder.table,
            isPaid: Boolean(selectedOrder.isPaid),
            paymentMethod: selectedOrder.paymentMethod,
            paidAt: selectedOrder.paidAt,
            timestamp: selectedOrder.timestamp,
            items: selectedOrder.items,
            total: selectedOrder.total,
          }}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
