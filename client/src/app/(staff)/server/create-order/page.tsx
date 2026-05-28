'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  Coffee,
  ShoppingBag,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import categoryApiRequest from '@/apiRequests/category';
import menuItemApiRequest from '@/apiRequests/menu-item';
import orderApiRequest from '@/apiRequests/order';
import userApiRequest from '@/apiRequests/user';
import { formatVnd } from '@/lib/money';
import Spinner from '@/components/restaurant/spinner';
import type { CategoryItemType } from '@/schemaValidations/menu.schema';
import type { MenuItemType } from '@/schemaValidations/menu.schema';

interface DraftCartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  modifications: string[];
}

export default function TablesideOrderingPage() {
  const router = useRouter();
  const { t, lang } = useAppContext();

  // Loaders & Alerts
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Lists from DB
  const [categories, setCategories] = useState<CategoryItemType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Pagination states
  const [menuItemNextCursor, setMenuItemNextCursor] = useState<
    string | number | null
  >(null);
  const [menuItemHasMore, setMenuItemHasMore] = useState(false);
  const [loadingMoreItems, setLoadingMoreItems] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [customerNextCursor, setCustomerNextCursor] = useState<
    string | number | null
  >(null);
  const [customerHasMore, setCustomerHasMore] = useState(false);
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);

  // Selection states
  const [selectedTable, setSelectedTable] = useState('1');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<DraftCartItem[]>([]);

  // Item modification input state
  const [activeModItemIndex, setActiveModItemIndex] = useState<number | null>(
    null,
  );
  const [modText, setModText] = useState('');

  // ── Fetch Initial Data (Categories & Initial Customers Page) ────────────────
  useEffect(() => {
    (async () => {
      try {
        const [catRes, userRes] = await Promise.all([
          categoryApiRequest.list(),
          userApiRequest.restaurantList({ limit: 15 }),
        ]);

        // Categories
        const catData = catRes.payload.data;
        const catList = Array.isArray(catData)
          ? catData
          : ((catData as any)?.data ?? []);
        setCategories(catList);

        // Customers list (First page)
        const userData = userRes.payload.data;
        let userList: any[] = [];
        let hasMore = false;
        let nextCursor = null;

        if (Array.isArray(userData)) {
          userList = userData;
        } else if (userData) {
          userList = Array.isArray(userData.data) ? userData.data : [];
          hasMore = userData.hasNextPage ?? false;
          nextCursor = userData.nextCursor ?? null;
        }

        const filteredCustomers = userList.filter((u: any) => {
          const roles = Array.isArray(u.role) ? u.role : [u.role];
          return roles.some((r: any) => String(r).toUpperCase() === 'CUSTOMER');
        });

        setCustomers(filteredCustomers);
        setCustomerNextCursor(nextCursor);
        setCustomerHasMore(hasMore);
      } catch (err) {
        console.error('Failed to load initial categories/customers data:', err);
        showToast(
          'error',
          'Không thể tải cấu hình danh mục hoặc danh sách khách hàng.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Reload Menu Items when filters change ────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingItems(true);
      try {
        const itemRes = await menuItemApiRequest.list({
          limit: 12,
          categoryId: activeCategory === 'all' ? undefined : activeCategory,
          search: searchQuery || undefined,
        });

        const itemData = itemRes.payload.data;
        if (Array.isArray(itemData)) {
          setMenuItems(itemData as any);
          setMenuItemNextCursor(null);
          setMenuItemHasMore(false);
        } else if (itemData) {
          const list = Array.isArray(itemData.data) ? itemData.data : [];
          setMenuItems(list as any);
          setMenuItemNextCursor(itemData.nextCursor ?? null);
          setMenuItemHasMore(itemData.hasNextPage ?? false);
        }
      } catch (err) {
        console.error('Failed to load menu items:', err);
        showToast('error', 'Không thể tải món ăn từ thực đơn.');
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [activeCategory, searchQuery]);

  // ── Helper: Alert Toast ─────────────────────────────────────────────────────
  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Load More Handlers ──────────────────────────────────────────────────────
  async function handleLoadMoreItems() {
    if (!menuItemHasMore || loadingMoreItems) return;
    setLoadingMoreItems(true);
    try {
      const itemRes = await menuItemApiRequest.list({
        limit: 12,
        cursor: menuItemNextCursor ?? undefined,
        categoryId: activeCategory === 'all' ? undefined : activeCategory,
        search: searchQuery || undefined,
      });

      const itemData = itemRes.payload.data;
      if (Array.isArray(itemData)) {
        setMenuItems((prev) => [...prev, ...(itemData as any)]);
        setMenuItemNextCursor(null);
        setMenuItemHasMore(false);
      } else if (itemData) {
        const list = Array.isArray(itemData.data) ? itemData.data : [];
        setMenuItems((prev) => [...prev, ...(list as any)]);
        setMenuItemNextCursor(itemData.nextCursor ?? null);
        setMenuItemHasMore(itemData.hasNextPage ?? false);
      }
    } catch (err) {
      console.error('Failed to load more items:', err);
      showToast('error', 'Không thể tải thêm món ăn.');
    } finally {
      setLoadingMoreItems(false);
    }
  }

  async function handleLoadMoreCustomers() {
    if (!customerHasMore || loadingMoreCustomers) return;
    setLoadingMoreCustomers(true);
    try {
      const userRes = await userApiRequest.restaurantList({
        limit: 15,
        cursor: customerNextCursor ?? undefined,
      });

      const userData = userRes.payload.data;
      let nextCustomers: any[] = [];
      let hasMore = false;
      let nextCursor = null;

      if (Array.isArray(userData)) {
        nextCustomers = userData;
      } else if (userData) {
        nextCustomers = Array.isArray(userData.data) ? userData.data : [];
        hasMore = userData.hasNextPage ?? false;
        nextCursor = userData.nextCursor ?? null;
      }

      const filteredCustomers = nextCustomers.filter((u: any) => {
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.some((r: any) => String(r).toUpperCase() === 'CUSTOMER');
      });

      setCustomers((prev) => [...prev, ...filteredCustomers]);
      setCustomerNextCursor(nextCursor);
      setCustomerHasMore(hasMore);

      showToast('success', 'Tải thêm khách hàng thành công!');
    } catch (err) {
      console.error('Failed to load more customers:', err);
      showToast('error', 'Không thể tải thêm khách hàng.');
    } finally {
      setLoadingMoreCustomers(false);
    }
  }

  // ── Cart Handlers ───────────────────────────────────────────────────────────
  function handleAddToDraft(item: MenuItemType) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      } else {
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            qty: 1,
            image: item.image,
            modifications: [],
          },
        ];
      }
    });
    showToast('success', `Đã thêm ${item.name} vào đơn.`);
  }

  function handleUpdateQty(menuItemId: string, change: number) {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const nextQty = i.qty + change;
            return { ...i, qty: nextQty };
          }
          return i;
        })
        .filter((i) => i.qty > 0);
    });
  }

  function handleRemoveItem(menuItemId: string) {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }

  function handleSaveModification(index: number) {
    if (modText.trim()) {
      setCart((prev) => {
        const next = [...prev];
        next[index].modifications = [modText.trim()];
        return next;
      });
    } else {
      setCart((prev) => {
        const next = [...prev];
        next[index].modifications = [];
        return next;
      });
    }
    setActiveModItemIndex(null);
    setModText('');
  }

  // Calculate Subtotal
  const orderTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // ── Order Submit ────────────────────────────────────────────────────────────
  async function handleSubmitOrder() {
    if (cart.length === 0) {
      showToast('error', 'Đơn hàng trống. Vui lòng thêm ít nhất một món ăn.');
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        menuItemId: i.menuItemId,
        qty: i.qty,
        modifications: i.modifications,
      }));

      const payload: any = {
        tableNumber: selectedTable,
        items: itemsPayload,
      };

      if (selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      }

      await orderApiRequest.create(payload);
      showToast('success', 'Tạo đơn hàng thành công! Đang chuyển hướng...');

      setTimeout(() => {
        router.push('/server');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(
        'error',
        err?.payload?.message || 'Gửi đơn hàng thất bại. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='pt-6 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-6'>
      {/* Floating alert */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-lg backdrop-blur-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            {toast.type === 'success' ? (
              <CheckCircle2 className='w-4 h-4 shrink-0' />
            ) : (
              <AlertCircle className='w-4 h-4 shrink-0' />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className='flex items-center justify-between pb-4 border-b'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => router.push('/server')}
            className='p-2.5 rounded-xl border hover:bg-accent text-foreground transition-colors shrink-0'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-2xl font-extrabold flex items-center gap-2'>
              <span>
                {lang === 'vi' ? 'Tạo Đơn Tại Bàn' : 'Tableside Ordering'}
              </span>
              <span className='px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-black'>
                {lang === 'vi' ? 'NHÂN VIÊN' : 'STAFF'}
              </span>
            </h1>
            <p className='text-sm text-muted-foreground'>
              {lang === 'vi'
                ? 'Đặt đơn trực tiếp cho khách hàng tại nhà hàng'
                : 'Place order directly for customers inside the restaurant'}
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* LEFT COLUMN: Menu Browser */}
        <section className='lg:col-span-7 space-y-6'>
          {/* Search and Categories controls */}
          <div className='space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <input
                type='text'
                placeholder={
                  lang === 'vi'
                    ? 'Tìm kiếm món ăn, tag...'
                    : 'Search items, tags...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Category horizontal bar */}
            <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0'>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none'
                    : 'bg-card border-border hover:bg-accent text-foreground'
                }`}
              >
                {lang === 'vi' ? 'Tất cả món' : 'All Items'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none'
                      : 'bg-card border-border hover:bg-accent text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items list or Loading status */}
          {loadingItems ? (
            <div className='flex justify-center py-20'>
              <Spinner size='lg' />
            </div>
          ) : menuItems.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl p-6 bg-card text-muted-foreground gap-2'>
              <Coffee className='w-10 h-10' />
              <p className='font-bold text-sm'>
                Không tìm thấy món ăn nào phù hợp
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-2xl border bg-card p-4 flex gap-4 hover:shadow-md transition-shadow relative overflow-hidden group'
                  >
                    <div className='w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-accent relative'>
                      {item.image ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${item.image}`}
                          alt={item.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                          <Coffee className='w-6 h-6' />
                        </div>
                      )}
                    </div>

                    <div className='flex-1 flex flex-col justify-between min-w-0'>
                      <div>
                        <div className='flex items-start justify-between gap-1'>
                          <h3 className='font-extrabold text-sm text-foreground truncate'>
                            {item.name}
                          </h3>
                          {item.tag && (
                            <span className='flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-full shrink-0'>
                              <Sparkles className='w-2.5 h-2.5' />
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground line-clamp-1 mt-0.5'>
                          {item.description || 'Không có mô tả'}
                        </p>
                      </div>

                      <div className='flex items-center justify-between mt-2 pt-2 border-t border-dashed'>
                        <span className='font-black text-indigo-600 dark:text-indigo-400 text-sm'>
                          {formatVnd(item.price)}
                        </span>
                        <button
                          type='button'
                          onClick={() => handleAddToDraft(item)}
                          className='flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-600 hover:text-white transition-colors'
                        >
                          <Plus className='w-3 h-3' />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Menu Items Button */}
              {menuItemHasMore && (
                <div className='flex justify-center pt-4'>
                  <button
                    type='button'
                    onClick={handleLoadMoreItems}
                    disabled={loadingMoreItems}
                    className='flex items-center gap-2 px-6 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-850 dark:text-indigo-400 dark:hover:bg-indigo-950/20 text-xs font-bold transition-all disabled:opacity-50'
                  >
                    {loadingMoreItems ? (
                      <Spinner size='sm' />
                    ) : (
                      <Plus className='w-3.5 h-3.5' />
                    )}
                    <span>
                      {loadingMoreItems ? 'Đang tải…' : 'Xem thêm món ăn'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Cart Summary Panel */}
        <section className='lg:col-span-5 border bg-card rounded-3xl p-6 shadow-sm space-y-6 self-start'>
          <div className='flex items-center gap-2 border-b pb-3.5'>
            <ShoppingBag className='w-5 h-5 text-indigo-600' />
            <h2 className='text-lg font-extrabold'>
              {lang === 'vi' ? 'Thông Tin Đơn Hàng' : 'Order Information'}
            </h2>
          </div>

          {/* Table Selector & Customer Linkage */}
          <div className='space-y-4'>
            {/* Table input */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-bold uppercase tracking-widest text-muted-foreground'
                htmlFor='table-number'
              >
                🛎️ Chọn Số Bàn
              </label>
              <div className='grid grid-cols-5 gap-2'>
                {['1', '2', '3', '4', '5'].map((tNum) => (
                  <button
                    key={tNum}
                    type='button'
                    onClick={() => setSelectedTable(tNum)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${
                      selectedTable === tNum
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-background hover:bg-accent text-foreground'
                    }`}
                  >
                    Bàn {tNum}
                  </button>
                ))}
              </div>
              <input
                id='table-number'
                type='text'
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                placeholder='Nhập số bàn khác (ví dụ: 12)'
                className='w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2'
              />
            </div>

            {/* Customer Dropdown (Optional) with Paginated Tải thêm button */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-bold uppercase tracking-widest text-muted-foreground'
                htmlFor='customer-selector'
              >
                👤 Gán Khách Hàng (Tùy chọn)
              </label>
              <div className='flex gap-2'>
                <select
                  id='customer-selector'
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className='flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value=''>
                    --{' '}
                    {lang === 'vi'
                      ? 'Khách vãng lai / Khách lẻ'
                      : 'Walk-in Guest'}{' '}
                    --
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.phone || 'Không email'})
                    </option>
                  ))}
                </select>

                {customerHasMore && (
                  <button
                    type='button'
                    onClick={handleLoadMoreCustomers}
                    disabled={loadingMoreCustomers}
                    className='px-3 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/20 text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-1'
                    title='Tải thêm khách hàng'
                  >
                    {loadingMoreCustomers ? (
                      <Spinner size='sm' />
                    ) : (
                      <Plus className='w-3.5 h-3.5' />
                    )}
                    <span>{lang === 'vi' ? 'Tải thêm' : 'More'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cart items listing */}
          <div className='space-y-3.5'>
            <h3 className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
              📦 Danh Sách Món Chọn ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl bg-background/50 text-muted-foreground text-center gap-1.5'>
                <ClipboardList className='w-8 h-8' />
                <p className='font-bold text-xs'>Chưa chọn món ăn nào</p>
                <p className='text-[10px]'>
                  Ấn "+ Thêm" ở danh sách món bên trái
                </p>
              </div>
            ) : (
              <div className='space-y-3 max-h-[350px] overflow-y-auto pr-1'>
                {cart.map((item, index) => (
                  <div
                    key={item.menuItemId}
                    className='flex flex-col gap-2 p-3 bg-background border rounded-2xl'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <h4 className='font-extrabold text-sm'>{item.name}</h4>
                        <p className='text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5'>
                          {formatVnd(item.price)}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => handleUpdateQty(item.menuItemId, -1)}
                          className='p-1 rounded-lg border hover:bg-accent transition-colors'
                        >
                          <Minus className='w-3.5 h-3.5' />
                        </button>
                        <span className='text-sm font-black w-6 text-center'>
                          {item.qty}
                        </span>
                        <button
                          type='button'
                          onClick={() => handleUpdateQty(item.menuItemId, 1)}
                          className='p-1 rounded-lg border hover:bg-accent transition-colors'
                        >
                          <Plus className='w-3.5 h-3.5' />
                        </button>

                        <button
                          type='button'
                          onClick={() => handleRemoveItem(item.menuItemId)}
                          className='p-1 rounded-lg border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ml-1.5'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>

                    {/* Modifications input */}
                    <div className='pt-1.5 border-t border-dashed'>
                      {activeModItemIndex === index ? (
                        <div className='flex gap-2 items-center'>
                          <input
                            type='text'
                            placeholder='Không hành, ít cay...'
                            value={modText}
                            onChange={(e) => setModText(e.target.value)}
                            className='flex-1 rounded-lg border bg-background px-3 py-1.5 text-xs focus:outline-none'
                          />
                          <button
                            type='button'
                            onClick={() => handleSaveModification(index)}
                            className='px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors'
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>
                            {item.modifications[0] ? (
                              <span className='italic font-medium text-amber-600'>
                                💬 Ghi chú: {item.modifications[0]}
                              </span>
                            ) : (
                              'Chưa có ghi chú'
                            )}
                          </span>
                          <button
                            type='button'
                            onClick={() => {
                              setActiveModItemIndex(index);
                              setModText(item.modifications[0] || '');
                            }}
                            className='text-indigo-600 hover:underline text-[10px] font-extrabold uppercase shrink-0'
                          >
                            Thay đổi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing calculations */}
          <div className='border-t pt-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Tổng số món</span>
              <span className='font-bold'>
                {cart.reduce((sum, item) => sum + item.qty, 0)} món
              </span>
            </div>
            <div className='flex justify-between items-center text-base border-t border-dashed pt-3 mt-2'>
              <span className='font-extrabold text-foreground'>Tổng Cộng</span>
              <span className='text-lg font-black text-indigo-600 dark:text-indigo-400'>
                {formatVnd(orderTotal)}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type='button'
            disabled={submitting || cart.length === 0}
            onClick={handleSubmitOrder}
            id='btn-submit-order'
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-sm transition-colors shadow-md disabled:opacity-50'
          >
            {submitting ? (
              <Spinner size='sm' />
            ) : (
              <CheckCircle2 className='w-4 h-4' />
            )}
            <span>{submitting ? 'Đang gửi đơn…' : 'Gửi Đơn Đặt Món'}</span>
          </button>
        </section>
      </div>
    </div>
  );
}
