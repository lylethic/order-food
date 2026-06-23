'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Users, ShieldCheck } from 'lucide-react';
import LoadMoreButton from '@/components/restaurant/load-more-button';
import { useAppContext } from '@/app/app-provider';
import userApiRequest from '@/apiRequests/user';
import roleApiRequest from '@/apiRequests/role';
import Spinner from '@/components/restaurant/spinner';
import UserModal from './_components/user-modal';
import RoleModal from './_components/role-modal';
import ConfirmDeleteModal from './_components/confirm-delete-modal';
import type { AdminUserType } from '@/schemaValidations/user.schema';
import type { RestaurantRoleType } from '@/schemaValidations/role.schema';
import Image from 'next/image';
import envConfig from '@/config';

function roleBadgeColor(name?: string | null) {
  if (!name) return 'bg-muted text-muted-foreground';
  const n = name.toUpperCase();
  if (n === 'ADMIN') return 'bg-indigo-100 text-indigo-700';
  if (n === 'CHEF') return 'bg-amber-100 text-amber-700';
  if (n === 'EMPLOYEE') return 'bg-teal-100 text-teal-700';
  return 'bg-muted text-muted-foreground';
}

export default function AdminUsersPage() {
  const { t } = useAppContext();
  const [users, setUsers] = useState<AdminUserType[]>([]);
  const [roles, setRoles] = useState<RestaurantRoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<AdminUserType | null | 'new'>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminUserType | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUserType | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (searchVal: string, cursor?: string | number | null) => {
    if (!cursor) setLoading(true);
    try {
      const params: Parameters<typeof userApiRequest.restaurantList>[0] = { limit: 20 };
      if (searchVal.trim()) params.search = searchVal.trim();
      if (cursor) params.cursor = cursor;
      const uRes = await userApiRequest.restaurantList(params);
      const uData = uRes.payload.data as any;
      const list: AdminUserType[] = Array.isArray(uData) ? uData : (uData?.data ?? []);
      if (cursor) {
        setUsers((prev) => [...prev, ...list]);
      } else {
        setUsers(list);
      }
      setHasNextPage(uData?.hasNextPage ?? false);
      setNextCursor(uData?.hasNextPage ? uData?.nextCursor : null);
    } catch {
      if (!cursor) setUsers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load + roles
  useEffect(() => {
    roleApiRequest.restaurantList()
      .then((rRes) => {
        const rData = rRes.payload.data;
        setRoles(Array.isArray(rData) ? rData : ((rData as any)?.data ?? []));
      })
      .catch(() => {});
    fetchUsers('');
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setNextCursor(null);
      setHasNextPage(false);
      fetchUsers(search);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, fetchUsers]);

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchUsers(search, nextCursor);
  };

  const handleSave = async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    active: boolean;
  }) => {
    if (editTarget === 'new') {
      const res = await userApiRequest.restaurantCreate({
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        name: data.name || undefined,
      });
      const created = res.payload.data as AdminUserType;
      setUsers((prev) => [created, ...prev]);
    } else if (editTarget) {
      const res = await userApiRequest.restaurantUpdate(editTarget.id, {
        username: data.username,
        name: data.name || undefined,
        active: data.active,
      });
      const updated = res.payload.data as AdminUserType;
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? updated : u)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await userApiRequest.restaurantDelete(deleteTarget.id);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
  };

  const handleAvatarUpdated = (imgUrl: string | null) => {
    if (!editTarget || editTarget === 'new') return;
    const id = (editTarget as AdminUserType).id;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, img: imgUrl } : u)),
    );
  };

  return (
    <div className='px-6 py-8 max-w-5xl mt-10 mx-auto w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center'>
            <Users className='w-5 h-5 text-teal-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-foreground'>
              {t.adminUsers}
            </h1>
            <p className='text-xs text-muted-foreground'>
              {users.length} {t.items}
              {hasNextPage && '+'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditTarget('new')}
          className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
        >
          <Plus className='w-4 h-4' />
          {t.addNew}
        </button>
      </div>

      <div className='mb-5'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t.search}…`}
          className='w-full sm:max-w-xs border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        />
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : users.length === 0 ? (
        <div className='text-center py-20 text-muted-foreground text-sm'>
          {t.noData}
        </div>
      ) : (
        <div className='space-y-2'>
          {users.map((user) => (
            <div
              key={user.id}
              className='border border-border rounded-2xl px-4 py-3.5 flex items-center gap-4 shadow-sm'
            >
              <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden'>
                {user.img ? (
                  <Image
                    src={`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${user.img}`}
                    alt=''
                    width={24}
                    height={24}
                    className='w-full h-full object-cover shrink-0'
                    loading='lazy'
                  />
                ) : (
                  <Users className='w-5 h-5 text-muted-foreground' />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-bold text-foreground truncate'>
                    {user.name ?? user.username}
                  </p>
                  {!user.active && (
                    <span className='text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0'>
                      {t.inactive}
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
                  <p className='text-xs text-muted-foreground truncate'>
                    {user.email}
                  </p>
                  {user.roles.map((r, index) => (
                    <span
                      key={r.id || index}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColor(r.name)}`}
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
              <span className='text-xs text-muted-foreground font-mono hidden sm:block shrink-0'>
                @{user.username}
              </span>
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  onClick={() => setRoleTarget(user)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                  title={t.adminRoles}
                >
                  <ShieldCheck className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setEditTarget(user)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors'
                >
                  <Pencil className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setDeleteTarget(user)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>
          ))}

          {hasNextPage && (
            <LoadMoreButton onClick={loadMore} loading={loadingMore} />
          )}
        </div>
      )}

      {editTarget !== null && (
        <UserModal
          initial={editTarget === 'new' ? undefined : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          onAvatarUpdated={handleAvatarUpdated}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name ?? deleteTarget.username}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {roleTarget && (
        <RoleModal
          user={roleTarget}
          roles={roles}
          onClose={() => setRoleTarget(null)}
        />
      )}
    </div>
  );
}
