import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, ImageOff } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { Spinner } from '../components/Spinner';
import { MenuItemDetailModal } from '../components/MenuItemDetailModal';
import { formatVnd } from '../utils/money';
import type { MenuItem, Category } from '../types';
import type { CustomerOutletContext } from '../layouts/CustomerLayout';

export default function MenuPage() {
  const { t } = useLang();
  const { user } = useAuthContext();
  const { cart, cartCount, addItem, updateQty, onOpenCart, commentRepliedEvent } =
    useOutletContext<CustomerOutletContext>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailInitImg, setDetailInitImg] = useState<string | undefined>();

  // Fetch categories once on mount
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Re-fetch items whenever active category changes
  useEffect(() => {
    setLoadingItems(true);
    api
      .getMenuItems(activeCat || undefined)
      .then((items) => {
        if (items.length) setMenuItems(items);
        else setMenuItems([]);
      })
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, [activeCat]);

  const allCats: Category[] = [
    { id: '', name: t.allCategories },
    ...categories,
  ];

  const filtered = menuItems;

  const getQty = (id: string) =>
    cart.find((c) => c.menuItemId === id)?.qty ?? 0;

  return (
    <div className='pt-24 pb-32 md:pb-10 px-6 md:px-10 max-w-350 mx-auto'>
      {/* Category filter */}
      <div className='overflow-x-auto scrollbar-hide flex gap-2 mb-8 -mx-1 px-1'>
        {allCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCat === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Item count */}
      <p className='text-sm font-semibold text-slate-400 mb-6'>
        {filtered.length} {t.items}
      </p>

      {/* Grid */}
      {loadingItems ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence>
            {filtered.map((item) => {
              const qty = getQty(item.id);
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className='bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-card transition-all group'
                >
                  {/* Image — click to open detail */}
                  <div
                    className='aspect-4/3 overflow-hidden m-3 rounded-[20px] bg-slate-100 cursor-pointer'
                    onClick={() => {
                      setDetailId(item.id);
                      setDetailInitImg(item.image);
                    }}
                  >
                    {item.image ? (
                      <img
                        src={`/${item.image}`}
                        alt={item.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-slate-300'>
                        <ImageOff className='w-8 h-8' />
                      </div>
                    )}
                  </div>

                  <div className='px-6 pb-6 pt-2 flex flex-col'>
                    <h3
                      className='text-base font-extrabold text-slate-800 mb-1 cursor-pointer hover:text-indigo-600 transition-colors'
                      onClick={() => {
                        setDetailId(item.id);
                        setDetailInitImg(item.image);
                      }}
                    >
                      {item.name}
                    </h3>
                    <p className='text-slate-400 text-sm line-clamp-2 leading-relaxed mb-5'>
                      {item.description}
                    </p>
                    <div className='flex items-center justify-between mt-auto'>
                      <span className='text-xl font-extrabold text-slate-800'>
                        {formatVnd(item.price)}
                      </span>

                      {qty === 0 ? (
                        <button
                          onClick={() =>
                            addItem({
                              menuItemId: item.id,
                              name: item.name,
                              price: item.price,
                              image: item.image,
                            })
                          }
                          className='flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
                        >
                          <ShoppingCart className='w-4 h-4' />
                          {t.add}
                        </button>
                      ) : (
                        <div className='flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-1'>
                          <button
                            onClick={() =>
                              addItem({
                                menuItemId: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                              })
                            }
                            className='w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-90 transition-all'
                          >
                            <Plus className='w-3.5 h-3.5' />
                          </button>
                          <span className='text-sm font-extrabold text-slate-800 w-5 text-center'>
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, qty - 1)}
                            className='w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all'
                          >
                            <Minus className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Menu item detail modal */}
      {detailId && (
        <MenuItemDetailModal
          itemId={detailId}
          initialImage={detailInitImg}
          cart={cart}
          onAddItem={addItem}
          onUpdateQty={updateQty}
          onClose={() => setDetailId(null)}
          currentUserId={user?.userId ?? null}
          currentUserRole={user?.role?.[0] ?? null}
          commentRepliedEvent={commentRepliedEvent}
        />
      )}

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={onOpenCart}
            className='fixed bottom-24 md:bottom-8 right-6 md:right-10 z-20 bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xl hover:bg-slate-800 active:scale-95 transition-all'
          >
            <div className='relative'>
              <ShoppingCart className='w-5 h-5' />
              <span className='absolute -top-2.5 -right-2.5 bg-indigo-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900'>
                {cartCount}
              </span>
            </div>
            <span className='text-sm font-bold'>{t.openCart}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
