'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MessageCircle,
  MessageSquareReply,
  CheckCheck,
} from 'lucide-react';
import notificationApiRequest from '@/apiRequests/notification';
import type { NotificationItemType } from '@/schemaValidations/notification.schema';
import type { NotificationCreatedEvent } from '@/hooks/useSSE';

interface Props {
  notificationEvent?: NotificationCreatedEvent | null;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'STAFF_REPLY_COMMENT') {
    return <MessageSquareReply className='w-4 h-4 text-indigo-500' />;
  }
  return <MessageCircle className='w-4 h-4 text-emerald-500' />;
}

function normalizeNotification(raw: unknown): NotificationItemType {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    type: String(r.type ?? ''),
    title: String(r.title ?? ''),
    body: String(r.body ?? ''),
    isRead: Boolean(r.isRead ?? r.is_read ?? false),
    readAt: r.readAt != null ? String(r.readAt) : null,
    refId: r.refId != null ? String(r.refId) : null,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  };
}

export default function NotificationDropdown({ notificationEvent }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemType[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setLoading(true);
    notificationApiRequest
      .list()
      .then((res) => {
        const data = res.payload.data;
        const raw = Array.isArray(data) ? data : ((data as any)?.data ?? []);
        setNotifications((raw as unknown[]).map(normalizeNotification));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notificationEvent) return;
    setNotifications((prev) => {
      const exists = prev.some(
        (n) => n.id === notificationEvent.notification.id,
      );
      if (exists) return prev;
      return [notificationEvent.notification, ...prev];
    });
  }, [notificationEvent]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    const n = notifications.find((n) => n.id === id);
    if (!n || n.isRead) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
    );
    try {
      await notificationApiRequest.markRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: false, readAt: null } : n,
        ),
      );
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
    );
    try {
      await Promise.all(
        unread.map((n) => notificationApiRequest.markRead(n.id)),
      );
    } catch {
      notificationApiRequest
        .list()
        .then((res) => {
          const data = res.payload.data;
          const raw = Array.isArray(data) ? data : ((data as any)?.data ?? []);
          setNotifications((raw as unknown[]).map(normalizeNotification));
        })
        .catch(() => {});
    }
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className='relative p-2 hover:bg-accent rounded-xl text-muted-foreground transition-all'
        aria-label='Thông báo'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl border border-border z-50 overflow-hidden'>
          <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
            <h3 className='text-sm font-bold text-foreground'>
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
                className='flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-600 transition-colors'
              >
                <CheckCheck className='w-3.5 h-3.5' />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className='max-h-80 overflow-y-auto'>
            {loading ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className='py-8 text-center'>
                <Bell className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
                <p className='text-sm text-muted-foreground'>Không có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-accent ${
                    !n.isRead ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  <div className='mt-0.5 shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center shadow-sm'>
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p
                      className={`text-sm leading-snug ${
                        !n.isRead
                          ? 'font-semibold text-foreground'
                          : 'font-medium text-muted-foreground'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed'>
                      {n.body}
                    </p>
                    <p className='text-[11px] text-muted-foreground mt-1'>
                      {new Date(n.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
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
