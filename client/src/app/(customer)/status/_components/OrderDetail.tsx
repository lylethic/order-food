'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useCustomerLayout } from '@/contexts/customer-layout-context';
import StatusBadge from '@/components/restaurant/status-badge';
import Spinner from '@/components/restaurant/spinner';
import { formatVnd } from '@/lib/money';
import type {
  OrderStatusType,
  OrderDetailResType,
} from '@/schemaValidations/order.schema';
import Image from 'next/image';
import envConfig from '@/config';

const STATUS_STEPS: OrderStatusType[] = [
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
];

interface OrderDetailProps {
  initialData: OrderDetailResType['data'];
}

export default function OrderDetail({ initialData }: OrderDetailProps) {
  const router = useRouter();
  const { t } = useAppContext();

  const { lastEvent } = useCustomerLayout();

  const [orderDetail, setOrderDetail] =
    useState<OrderDetailResType['data']>(initialData);
  const [isLoading] = useState(false);

  // Apply realtime status updates from the shared SSE connection in the layout
  useEffect(() => {
    if (!lastEvent || !orderDetail) return;
    if (lastEvent.orderId !== orderDetail.id) return;
    setOrderDetail((prev) =>
      prev ? { ...prev, status: lastEvent.status as OrderStatusType } : prev,
    );
  }, [lastEvent]);

  const status = orderDetail?.status as OrderStatusType;
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

  return (
    <div className='w-full h-screen'>
      <button
        onClick={() => router.back()}
        className='flex items-center gap-2 hover:text-accent-foreground text-sm font-semibold mb-6 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        {t.back}
      </button>

      {isLoading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : (
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
            {/* Left side */}
            <div className='lg:col-span-4 lg:sticky lg:top-6'>
              {/* Order Header */}
              <div className='rounded-3xl shadow-sm border border-border p-6 mb-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <p className='text-xs font-bold  uppercase tracking-widest'>
                      {t.orderNumber}
                    </p>
                    <p className='text-2xl font-extrabold '>
                      #{orderDetail?.ticketNumber}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {isCancelled ? (
                  <div className='flex flex-col items-center gap-3 py-6 text-center'>
                    <XCircle className='w-12 h-12 text-rose-400' />
                    <p className='font-bold '>{t.orderCancelled}</p>
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
                                    : 'bg-muted '
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className='w-4 h-4' />
                              ) : active ? (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                  }}
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
                                done || active ? '' : ''
                              }`}
                            >
                              {info.label}
                            </p>
                            <p className='text-xs '>{info.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className='lg:col-span-8 space-y-6'>
              {/* Order Items */}
              <div className='rounded-3xl shadow-sm border border-border p-6 mb-6'>
                <h3 className='text-sm font-extrabold mb-4'>{t.items}</h3>
                <div className='space-y-4'>
                  {orderDetail?.items?.map((item) => (
                    <div
                      key={item.id}
                      className='flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0'
                    >
                      {item.image && (
                        <Image
                          // Fix: Use ${item.image} to get the actual variable value
                          src={`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${item.image}`}
                          alt={item.name}
                          width={64}
                          height={64}
                          className='w-16 h-16 rounded-lg object-cover flex-shrink-0'
                          loading='lazy'
                        />
                      )}
                      <div className='flex-1'>
                        <p className='font-bold text-sm'>{item.name}</p>
                        {item.modifications && (
                          <p className='text-xs mt-1'>{item.modifications}</p>
                        )}
                        <div className='flex items-center justify-between mt-2'>
                          <span className='text-xs'>x{item.qty}</span>
                          <span className='font-bold text-sm'>
                            {formatVnd(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className='rounded-3xl shadow-sm border border-border p-6'>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className=''>{t.table}</span>
                    <span className='font-bold'>{orderDetail?.table}</span>
                  </div>
                  {orderDetail?.timestamp && (
                    <div className='flex justify-between text-sm'>
                      <span className=''>
                        {t.ordersTime.toLocaleLowerCase()}
                      </span>
                      <span className='font-bold'>
                        {orderDetail?.timestamp}
                      </span>
                    </div>
                  )}
                  {orderDetail?.isPaid && (
                    <div className='flex justify-between text-sm pt-2 border-t border-border'>
                      <span className=''>{t.paymentStatus}</span>
                      <span className='font-bold'>
                        {orderDetail?.isPaid
                          ? 'Đã thanh toán'
                          : 'Chưa thanh toán'}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between text-base font-extrabold pt-3 border-t border-border'>
                    <span>{t.total}</span>
                    <span className='text-indigo-600'>
                      {orderDetail ? formatVnd(orderDetail.total) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
