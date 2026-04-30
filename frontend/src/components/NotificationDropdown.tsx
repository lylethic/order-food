import { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, MessageSquareReply, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import type { Notification } from '../types';
import type { NotificationCreatedEvent } from '../hooks/useSSE';

interface Props {
  /** SSE notification.created event forwarded from parent layout */
  notificationEvent?: NotificationCreatedEvent | null;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'STAFF_REPLY_COMMENT') {
    return <MessageSquareReply className='w-4 h-4 text-indigo-500' />;
  }
  return <MessageCircle className='w-4 h-4 text-emerald-500' />;
}

export function NotificationDropdown({ notificationEvent }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notifications on mount
  useEffect(() => {
    setLoading(true);
    api
      .getNotifications()
      .then((data) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Prepend new SSE notification to the list
  useEffect(() => {
    if (!notificationEvent) return;
    setNotifications((prev) => {
      // Avoid duplicates
      const exists = prev.some((n) => n.id === notificationEvent.notification.id);
      if (exists) return prev;
      return [notificationEvent.notification, ...prev];
    });
  }, [notificationEvent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.isRead) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
    );
    try {
      await api.markNotificationRead(id);
    } catch {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: null } : n)),
      );
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
    );
    try {
      await Promise.all(unread.map((n) => api.markNotificationRead(n.id)));
    } catch {
      // If any fail, refresh from server
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className='relative p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all'
        aria-label='Thông báo'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className='absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
            <h3 className='text-sm font-bold text-slate-800'>
              Thông báo
              {unreadCount > 0 && (
                <span className='ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full'>
                  {unreadCount} mới
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className='flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors'
              >
                <CheckCheck className='w-3.5 h-3.5' />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className='max-h-80 overflow-y-auto'>
            {loading ? (
              <div className='py-6 text-center text-sm text-slate-400'>Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className='py-8 text-center'>
                <Bell className='w-8 h-8 text-slate-200 mx-auto mb-2' />
                <p className='text-sm text-slate-400'>Không có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50 ${
                    !n.isRead ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className='mt-0.5 shrink-0 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm'>
                    <NotificationIcon type={n.type} />
                  </div>

                  {/* Text */}
                  <div className='flex-1 min-w-0'>
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {n.title}
                    </p>
                    <p className='text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed'>
                      {n.body}
                    </p>
                    <p className='text-[11px] text-slate-400 mt-1'>
                      {new Date(n.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className='w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0' />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
