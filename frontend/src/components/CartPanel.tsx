import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Minus, Plus, ScanQrCode, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useTableSession } from '../context/TableContext';
import { Spinner } from './Spinner';
import { formatVnd } from '../utils/money';
import type { CartItem } from '../types';

interface Props {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (tableNumber: string) => Promise<void>;
  isPlacing: boolean;
}

export function CartPanel({
  cart,
  onClose,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  isPlacing,
}: Props) {
  const { t } = useLang();
  const { tableSession, clearTableSession } = useTableSession();
  const [tableNumber, setTableNumber] = useState(tableSession?.tableNumber ?? '');
  const [error, setError] = useState('');

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = 0;

  const handlePlace = async () => {
    const resolvedTable = tableSession?.tableNumber ?? tableNumber.trim();
    if (!resolvedTable) {
      setError('Please enter a table number.');
      return;
    }
    setError('');
    try {
      await onPlaceOrder(resolvedTable);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key='backdrop'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40'
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key='panel'
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className='fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5 text-indigo-600' />
            <h2 className='text-lg font-extrabold text-slate-800'>{t.cart}</h2>
            <span className='bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full'>
              {cart.reduce((s, c) => s + c.qty, 0)} {t.items}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className='flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center'>
            <ShoppingCart className='w-12 h-12 text-slate-200' />
            <p className='font-bold text-slate-500'>{t.cartEmpty}</p>
            <p className='text-sm text-slate-400'>{t.cartEmptySub}</p>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className='flex-1 overflow-y-auto px-6 py-4 space-y-3'>
              {cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className='flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100'
                >
                  {item.image && (
                    <div className='w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100'>
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-bold text-slate-800 truncate'>
                      {item.name}
                    </p>
                    <p className='text-sm font-extrabold text-indigo-600'>
                      {formatVnd(item.price * item.qty)}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => onUpdateQty(item.menuItemId, item.qty - 1)}
                      className='w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all'
                    >
                      <Minus className='w-3 h-3' />
                    </button>
                    <span className='w-6 text-center text-sm font-extrabold text-slate-800'>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.menuItemId, item.qty + 1)}
                      className='w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 active:scale-90 transition-all'
                    >
                      <Plus className='w-3 h-3' />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.menuItemId)}
                    className='text-slate-300 hover:text-rose-500 transition-colors ml-1'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='px-6 py-5 border-t border-slate-100 space-y-4'>
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
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    {t.tableNumber}
                  </label>
                  <input
                    type='text'
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder={t.tableNumberPlaceholder}
                    className='w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
                  />
                </div>
              )}

              {/* Totals */}
              <div className='space-y-1.5 text-sm'>
                <div className='flex justify-between text-slate-500'>
                  <span>{t.subtotal}</span>
                  <span className='font-semibold text-slate-700'>
                    {formatVnd(subtotal)}
                  </span>
                </div>
                <div className='flex justify-between text-slate-500'>
                  <span>{t.tax}</span>
                  <span className='font-semibold text-slate-700'>
                    {formatVnd(tax)}
                  </span>
                </div>
                <div className='flex justify-between font-extrabold text-slate-800 text-base pt-2 border-t border-slate-100'>
                  <span>{t.total}</span>
                  <span className='text-indigo-600'>
                    {formatVnd(subtotal + tax)}
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
      </motion.div>
    </AnimatePresence>
  );
}
