import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Camera,
} from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { api } from '../../services/api';
import { Spinner } from '../../components/Spinner';
import type { AdminUser, Role } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleBadgeColor(name: string) {
  const n = name.toUpperCase();
  if (n === 'ADMIN') return 'bg-indigo-100 text-indigo-700';
  if (n === 'CHEF') return 'bg-amber-100 text-amber-700';
  if (n === 'EMPLOYEE') return 'bg-teal-100 text-teal-700';
  return 'bg-slate-100 text-slate-600';
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-sm p-6'
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
            <Trash2 className='w-5 h-5 text-red-600' />
          </div>
          <div>
            <p className='text-sm font-extrabold text-slate-800'>
              {t.delete} "{name}"?
            </p>
            <p className='text-xs text-slate-400 mt-0.5'>{t.confirmDelete}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50'
          >
            {t.cancel}
          </button>
          <button
            onClick={handle}
            disabled={deleting}
            className='flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {deleting ? <Spinner size='sm' /> : <Trash2 className='w-4 h-4' />}
            {t.delete}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── User form modal ──────────────────────────────────────────────────────────

function UserModal({
  initial,
  roles,
  onSave,
  onClose,
  onAvatarUpdated,
}: {
  initial?: AdminUser;
  roles: Role[];
  onSave: (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    active: boolean;
  }) => Promise<void>;
  onClose: () => void;
  onAvatarUpdated?: (imgUrl: string | null) => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState({
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    password: '',
    name: initial?.name ?? '',
    active: initial?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initial?.img ? `/${initial.img}` : null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (files: FileList | null) => {
    if (!files?.[0] || !initial) return;
    setUploadingAvatar(true);
    try {
      const updated = await api.uploadAvatar(initial.id, files[0]);
      const preview = updated.img ? `/${updated.img}` : null;
      setAvatarPreview(preview);
      onAvatarUpdated?.(updated.img ?? null);
    } catch {
      /* ignore */
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || (!initial && !form.email.trim())) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden'
      >
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
          <h2 className='text-base font-extrabold text-slate-800'>
            {initial ? t.edit : t.addNew} {t.adminUsers.slice(0, -1)}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
          {/* Avatar upload — edit mode only */}
          {initial && (
            <div className='flex justify-center'>
              <div
                className='relative w-16 h-16 rounded-full bg-slate-100 cursor-pointer group overflow-hidden ring-2 ring-slate-200 hover:ring-indigo-400 transition-all'
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=''
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <Users className='w-8 h-8 text-slate-400 absolute inset-0 m-auto' />
                )}
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full'>
                  {uploadingAvatar ? (
                    <Spinner size='sm' />
                  ) : (
                    <Camera className='w-4 h-4 text-white' />
                  )}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => handleAvatarChange(e.target.files)}
              />
            </div>
          )}

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.username} *
              </label>
              <input
                autoFocus
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.name}
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
          </div>

          {!initial && (
            <>
              <div>
                <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                  {t.email} *
                </label>
                <input
                  type='email'
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                  {t.password} *
                </label>
                <input
                  type='password'
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
            </>
          )}

          {initial && (
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className='text-sm font-semibold text-slate-700'>
                {form.active ? t.active : t.inactive}
              </span>
            </div>
          )}

          {error && <p className='text-xs text-red-500'>{error}</p>}

          <div className='flex gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50'
            >
              {t.cancel}
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {saving ? <Spinner size='sm' /> : <Check className='w-4 h-4' />}
              {t.save}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Role assign modal ────────────────────────────────────────────────────────

function RoleModal({
  user,
  roles,
  onClose,
}: {
  user: AdminUser;
  roles: Role[];
  onClose: () => void;
}) {
  const { t } = useLang();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(
    () => new Set(user.roles.map((r) => r.id)),
  );
  const [error, setError] = useState('');

  const toggle = async (role: Role) => {
    setLoadingId(role.id);
    setError('');
    try {
      if (assignedIds.has(role.id)) {
        await api.adminRemoveRole(user.id, role.id);
        setAssignedIds((prev) => {
          const s = new Set(prev);
          s.delete(role.id);
          return s;
        });
      } else {
        await api.adminAssignRole(user.id, role.id);
        setAssignedIds((prev) => new Set(prev).add(role.id));
      }
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-sm p-6'
      >
        <div className='flex items-center justify-between mb-1'>
          <h2 className='text-base font-extrabold text-slate-800'>
            {t.adminRoles}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
        <p className='text-xs text-slate-400 mb-4'>
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
                className='flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50'
              >
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadgeColor(role.name)}`}
                >
                  {role.name}
                </span>
                <span className='flex-1 text-xs text-slate-400'>
                  #{role.id}
                </span>
                <div className='flex gap-1.5'>
                  <button
                    onClick={() => toggle(role)}
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
                    onClick={() => toggle(role)}
                    disabled={loading}
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
          className='w-full mt-4 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50'
        >
          {t.cancel}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { t } = useLang();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<AdminUser | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    Promise.all([api.adminGetUsers(), api.getRoles()])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          (u.name ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const handleSave = async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    active: boolean;
  }) => {
    if (editTarget === 'new') {
      const created = await api.adminCreateUser({
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name || undefined,
      });
      setUsers((prev) => [created, ...prev]);
    } else if (editTarget) {
      const updated = await api.adminUpdateUser(editTarget.id, {
        username: data.username,
        name: data.name || undefined,
        active: data.active,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? updated : u)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.adminDeleteUser(deleteTarget.id);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
  };

  const handleAvatarUpdated = (imgUrl: string | null) => {
    if (!editTarget || editTarget === 'new') return;
    const id = (editTarget as AdminUser).id;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, img: imgUrl } : u)));
  };

  return (
    <div className='px-6 py-8 max-w-5xl mt-10 mx-auto w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center'>
            <Users className='w-5 h-5 text-teal-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-slate-800'>
              {t.adminUsers}
            </h1>
            <p className='text-xs text-slate-400'>
              {filtered.length} {t.items}
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

      {/* Search */}
      <div className='mb-5'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t.search}…`}
          className='w-full sm:max-w-xs border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        />
      </div>

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-20 text-slate-400 text-sm'>
          {t.noData}
        </div>
      ) : (
        <div className='space-y-2'>
          <AnimatePresence initial={false}>
            {filtered.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className='bg-white border border-slate-100 rounded-2xl px-4 py-3.5 flex items-center gap-4 shadow-sm'
              >
                {/* Avatar */}
                <div className='w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden'>
                  {user.img ? (
                    <img
                      src={`/${user.img}`}
                      alt=''
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <Users className='w-5 h-5 text-slate-400' />
                  )}
                </div>

                {/* Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm font-bold text-slate-800 truncate'>
                      {user.name ?? user.username}
                    </p>
                    {!user.active && (
                      <span className='text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full shrink-0'>
                        {t.inactive}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
                    <p className='text-xs text-slate-400 truncate'>
                      {user.email}
                    </p>
                    {user.roles.map((r) => (
                      <span
                        key={r.id}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColor(r.name)}`}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Username */}
                <span className='text-xs text-slate-400 font-mono hidden sm:block shrink-0'>
                  @{user.username}
                </span>

                {/* Actions */}
                <div className='flex items-center gap-1 shrink-0'>
                  <button
                    onClick={() => setRoleTarget(user)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                    title={t.adminRoles}
                  >
                    <ShieldCheck className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setEditTarget(user)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editTarget !== null && (
          <UserModal
            key='edit-modal'
            initial={editTarget === 'new' ? undefined : editTarget}
            roles={roles}
            onSave={handleSave}
            onClose={() => setEditTarget(null)}
            onAvatarUpdated={handleAvatarUpdated}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            key='delete-modal'
            name={deleteTarget.name ?? deleteTarget.username}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
        {roleTarget && (
          <RoleModal
            key='role-modal'
            user={roleTarget}
            roles={roles}
            onClose={() => setRoleTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
