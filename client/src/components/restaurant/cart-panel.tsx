'use client';

import { useState } from 'react';
import {
  ShoppingCart,
  X,
  Minus,
  Plus,
  ScanQrCode,
  CheckCircle,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { formatVnd } from '@/lib/money';
import Spinner from './spinner';
import type { CartItemType } from '@/schemaValidations/order.schema';

interface Props {
  onClose: () => void;
  onPlaceOrder: (
    tableNumber: string,
    guestName?: string,
    guestPhone?: string,
  ) => Promise<void>;
  isPlacing: boolean;
  isGuest?: boolean;
}

export default function CartPanel({
  onClose,
  onPlaceOrder,
  isPlacing,
  isGuest = false,
}: Props) {
  const {
    cart,
    updateQty,
    removeItem,
    cartTotal,
    t,
    tableSession,
    clearTableSession,
  } = useAppContext();

  const [tableNumber, setTableNumber] = useState(
    tableSession?.tableNumber ?? '',
  );
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [error, setError] = useState('');

  const count = cart.reduce((s, c) => s + c.qty, 0);

  const handlePlace = async () => {
    const resolvedTable = tableSession?.tableNumber ?? tableNumber.trim();
    if (!resolvedTable) {
      setError(`${t.tableNumber}: ${t.tableNumberPlaceholder}`);
      return;
    }
    if (isGuest) {
      if (!guestName.trim()) {
        setError(t.guestName);
        return;
      }
      if (!guestPhone.trim()) {
        setError(t.guestPhone);
        return;
      }
    }
    setError('');
    try {
      await onPlaceOrder(
        resolvedTable,
        isGuest ? guestName.trim() : undefined,
        isGuest ? guestPhone.trim() : undefined,
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl translate-x-0 transition-transform bg-white'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-border'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5 text-indigo-600' />
            <h2 className='text-lg font-extrabold text-foreground'>{t.cart}</h2>
            <span className='bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full'>
              {count} {t.items}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-muted-foreground transition-all'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className='flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center'>
            <ShoppingCart className='w-12 h-12 text-muted-foreground' />
            <p className='font-bold text-muted-foreground'>{t.cartEmpty}</p>
            <p className='text-sm text-muted-foreground'>{t.cartEmptySub}</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className='flex-1 overflow-y-auto px-6 py-4 space-y-3'>
              {cart.map((item: CartItemType) => (
                <div
                  key={item.menuItemId}
                  className='flex items-center gap-3 p-3 rounded-2xl border border-border'
                >
                  {item.image && (
                    <div className='w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border'>
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-bold text-foreground truncate'>
                      {item.name}
                    </p>
                    <p className='text-sm font-extrabold text-indigo-600'>
                      {formatVnd(item.price * item.qty)}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => updateQty(item.menuItemId, item.qty - 1)}
                      className='w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent active:scale-90 transition-all'
                    >
                      <Minus className='w-3 h-3' />
                    </button>
                    <span className='w-6 text-center text-sm font-extrabold text-foreground'>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.menuItemId, item.qty + 1)}
                      className='w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 active:scale-90 transition-all'
                    >
                      <Plus className='w-3 h-3' />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className='text-muted-foreground hover:text-rose-500 transition-colors ml-1'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='px-6 py-5 border-t border-border space-y-4'>
              {/* Table number */}
              {tableSession ? (
                <div className='flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl'>
                  <div className='flex items-center gap-2 text-emerald-700'>
                    <ScanQrCode className='w-4 h-4 shrink-0' />
                    <span className='text-sm font-bold'>
                      {t.qrTableBadge} {tableSession.tableNumber}
                    </span>
                    <CheckCircle className='w-3.5 h-3.5' />
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      clearTableSession();
                      setTableNumber('');
                    }}
                    className='text-xs text-emerald-600 hover:text-rose-500 transition-colors font-medium'
                  >
                    {t.qrChangeTable}
                  </button>
                </div>
              ) : (
                <div>
                  <label className='block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
                    {t.tableNumber}
                  </label>
                  <input
                    type='text'
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder={t.tableNumberPlaceholder}
                    className='w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                  />
                </div>
              )}

              {/* Guest fields */}
              {isGuest && (
                <div className='space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl'>
                  <p className='text-xs font-bold text-amber-700 uppercase tracking-wider'>
                    {t.guestCheckoutTitle}
                  </p>
                  <p className='text-xs text-amber-600'>{t.guestCheckoutSub}</p>
                  <input
                    type='text'
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={t.guestNamePlaceholder}
                    className='w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all'
                  />
                  <input
                    type='tel'
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder={t.guestPhonePlaceholder}
                    className='w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all'
                  />
                </div>
              )}

              {/* Totals */}
              <div className='space-y-1.5 text-sm'>
                <div className='flex justify-between text-muted-foreground'>
                  <span>{t.subtotal}</span>
                  <span className='font-semibold text-foreground'>
                    {formatVnd(cartTotal)}
                  </span>
                </div>
                <div className='flex justify-between font-extrabold text-foreground text-base pt-2 border-t border-border'>
                  <span>{t.total}</span>
                  <span className='text-indigo-600'>
                    {formatVnd(cartTotal)}
                  </span>
                </div>
              </div>

              {error && (
                <p className='text-sm text-rose-500 font-medium'>{error}</p>
              )}

              <button
                onClick={handlePlace}
                disabled={isPlacing}
                className='w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100'
              >
                {isPlacing ? (
                  <>
                    <Spinner size='sm' />
                    {t.placing}
                  </>
                ) : (
                  t.placeOrder
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
