'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck, UserX } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import roleApiRequest from '@/apiRequests/role';
import Spinner from '@/components/restaurant/spinner';
import type { AdminUserType } from '@/schemaValidations/user.schema';
import type { RestaurantRoleType } from '@/schemaValidations/role.schema';

function roleBadgeColor(name: string) {
  if (!name) return 'bg-muted text-muted-foreground';
  const n = name.toUpperCase();
  if (n === 'ADMIN') return 'bg-indigo-100 text-indigo-700';
  if (n === 'CHEF') return 'bg-amber-100 text-amber-700';
  if (n === 'EMPLOYEE') return 'bg-teal-100 text-teal-700';
  return 'bg-muted text-muted-foreground';
}

interface Props {
  user: AdminUserType;
  roles: RestaurantRoleType[];
  onClose: () => void;
}

export default function RoleModal({ user, roles, onClose }: Props) {
  const { t } = useAppContext();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(
    () => new Set(user.roles.map((r) => r.id)),
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggle = async (role: RestaurantRoleType) => {
    setLoadingId(role.id);
    setError('');
    try {
      if (assignedIds.has(role.id)) {
        await roleApiRequest.removeRole(user.id, role.id);
        setAssignedIds((prev) => {
          const s = new Set(prev);
          s.delete(role.id);
          return s;
        });
      } else {
        await roleApiRequest.assignRole(user.id, role.id);
        setAssignedIds((prev) => new Set(prev).add(role.id));
      }
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='rounded-2xl shadow-xl w-full max-w-sm p-6 bg-white'
      >
        <div className='flex items-center justify-between mb-1'>
          <h2 className='text-base font-extrabold text-foreground'>
            {t.adminRoles}
          </h2>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-muted-foreground'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
        <p className='text-xs text-muted-foreground mb-4'>
          {user.name ?? user.username} — {user.email}
        </p>

        {error && <p className='text-xs text-red-500 mb-3'>{error}</p>}

        <div className='space-y-2'>
          {roles.map((role) => {
            const isAssigned = assignedIds.has(role.id);
            const loading = loadingId === role.id;
            return (
              <div
                key={role.id}
                className='flex items-center gap-3 p-3 rounded-xl border border-border'
              >
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadgeColor(role.name)}`}
                >
                  {role.name}
                </span>
                <span className='flex-1 text-xs text-muted-foreground'>
                  #{role.id}
                </span>
                <div className='flex gap-1.5'>
                  <button
                    onClick={() => !isAssigned && toggle(role)}
                    disabled={loading || isAssigned}
                    className='flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg disabled:opacity-40 transition-colors'
                  >
                    {loading && !isAssigned ? (
                      <Spinner size='sm' />
                    ) : (
                      <UserCheck className='w-3.5 h-3.5' />
                    )}
                    {t.assignRole}
                  </button>
                  <button
                    onClick={() => isAssigned && toggle(role)}
                    disabled={loading || !isAssigned}
                    className='flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg disabled:opacity-40 transition-colors'
                  >
                    {loading && isAssigned ? (
                      <Spinner size='sm' />
                    ) : (
                      <UserX className='w-3.5 h-3.5' />
                    )}
                    {t.removeRole}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className='w-full mt-4 border border-border text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-accent'
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
