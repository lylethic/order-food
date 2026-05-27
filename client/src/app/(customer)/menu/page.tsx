'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingCart, Plus, Minus, ImageOff } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useCustomerLayout } from '@/contexts/customer-layout-context';
import categoryApiRequest from '@/apiRequests/category';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import MenuItemDetailModal from '@/components/restaurant/menu-item-detail-modal';
import { formatVnd } from '@/lib/money';
import type {
  CategoryItemType,
  MenuItemType,
} from '@/schemaValidations/menu.schema';
import Image from 'next/image';

export default function MenuPage() {
  const { user, cart, addItem, updateQty, t } = useAppContext();
  const { onOpenCart, commentRepliedEvent } = useCustomerLayout();

  const [categories, setCategories] = useState<CategoryItemType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [activeCat, setActiveCat] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailInitImg, setDetailInitImg] = useState<string | undefined>();

  useEffect(() => {
    categoryApiRequest
      .list()
      .then((res) => {
        const data = res.payload.data;
        setCategories(Array.isArray(data) ? data : ((data as any)?.data ?? []));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingItems(true);
    menuItemApiRequest
      .list(activeCat ? { categoryId: activeCat } : undefined)
      .then((res) => {
        const data = res.payload.data;
        const items = Array.isArray(data) ? data : ((data as any)?.data ?? []);
        setMenuItems(items as MenuItemType[]);
      })
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, [activeCat]);

  const allCats = [{ id: '', name: t.allCategories }, ...categories];
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const getQty = (id: string) =>
    cart.find((c) => c.menuItemId === id)?.qty ?? 0;

  const roles = user?.role
    ? Array.isArray(user.role)
      ? user.role.map(String)
      : [String(user.role)]
    : [];
  const currentUserRole = roles[0] ?? null;

  return (
    <div className='pt-8 pb-32 md:pb-10 px-6 md:px-10 max-w-7xl mx-auto'>
      {/* Category filter */}
      <div className='overflow-x-auto scrollbar-hide flex gap-2 mb-8 -mx-1 px-1'>
        {allCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCat === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'border border-border  hover:bg-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <p className='text-sm font-semibold  mb-6'>
        {menuItems.length} {t.items}
      </p>

      {loadingItems ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence>
            {menuItems.map((item) => {
              const qty = getQty(item.id);
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className='rounded-[28px] overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all group'
                >
                  <div
                    className='aspect-4/3 overflow-hidden m-3 rounded-[20px] bg-muted cursor-pointer'
                    onClick={() => {
                      setDetailId(item.id);
                      setDetailInitImg(item.image);
                    }}
                  >
                    {item.image ? (
                      <div className='relative w-full h-[300px] overflow-hidden'>
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${item.image}`}
                          alt={item.name}
                          fill // replace to w-full h-full
                          unoptimized
                          className='object-cover group-hover:scale-105 transition-transform duration-700'
                        />
                      </div>
                    ) : (
                      <div className='w-full h-full flex items-center justify-center '>
                        <ImageOff className='w-8 h-8' />
                      </div>
                    )}
                  </div>

                  <div className='px-6 pb-6 pt-2 flex flex-col'>
                    <h3
                      className='text-base font-extrabold  mb-1 cursor-pointer hover:text-indigo-600 transition-colors'
                      onClick={() => {
                        setDetailId(item.id);
                        setDetailInitImg(item.image);
                      }}
                    >
                      {item.name}
                    </h3>
                    <p className=' text-sm line-clamp-2 leading-relaxed mb-5'>
                      {item.description}
                    </p>
                    <div className='flex items-center justify-between mt-auto'>
                      <span className='text-xl font-extrabold '>
                        {formatVnd(item.price)}
                      </span>

                      {qty === 0 ? (
                        <button
                          onClick={() =>
                            addItem({
                              menuItemId: item.id,
                            })
                          }
                          className='flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
                        >
                          <ShoppingCart className='w-4 h-4' />
                          {t.add}
                        </button>
                      ) : (
                        <div className='flex items-center gap-2 bg-muted/50 rounded-xl border border-border p-1'>
                          <button
                            onClick={() =>
                              addItem({
                                menuItemId: item.id,
                              })
                            }
                            className='w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-90 transition-all'
                          >
                            <Plus className='w-3.5 h-3.5' />
                          </button>
                          <span className='text-sm font-extrabold  w-5 text-center'>
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, qty - 1, true)}
                            className='w-7 h-7 rounded-lg border border-border  flex items-center justify-center hover:bg-accent active:scale-90 transition-all'
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

      {detailId && (
        <MenuItemDetailModal
          itemId={detailId}
          initialImage={detailInitImg}
          cart={cart}
          onAddItem={addItem}
          onUpdateQty={updateQty}
          onClose={() => setDetailId(null)}
          currentUserId={user?.userId ?? null}
          currentUserRole={currentUserRole}
          commentRepliedEvent={commentRepliedEvent}
        />
      )}

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={onOpenCart}
            className='fixed bottom-24 md:bottom-8 right-6 md:right-10 z-20 bg-background text-foreground rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xl hover:bg-card active:scale-95 transition-all'
          >
            <div className='relative'>
              <ShoppingCart className='w-5 h-5' />
              <span className='absolute -top-2.5 -right-2.5 bg-indigo-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background'>
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
