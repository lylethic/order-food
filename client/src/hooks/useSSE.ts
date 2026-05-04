'use client';

import { useState, useEffect } from 'react';
import envConfig from '@/config';
import type { CommentItemType, CommentReplyType } from '@/schemaValidations/comment.schema';
import type { NotificationItemType } from '@/schemaValidations/notification.schema';

export interface StatusEvent {
  eventType?: 'status' | 'payment';
  orderId: string;
  status: string;
  isPaid?: boolean;
  paymentMethod?: string;
  paidAt?: string;
}

export interface CommentCreatedEvent {
  eventType: 'comment.created';
  comment: Pick<
    CommentItemType,
    'id' | 'menuItemId' | 'customerName' | 'content' | 'rating' | 'createdAt'
  > & { menuItemName: string };
}

export interface CommentRepliedEvent {
  eventType: 'comment.replied';
  commentId: string;
  reply: CommentReplyType;
}

export interface NotificationCreatedEvent {
  eventType: 'notification.created';
  notification: NotificationItemType;
}

export type SSEEvent =
  | StatusEvent
  | CommentCreatedEvent
  | CommentRepliedEvent
  | NotificationCreatedEvent;

/**
 * Connects to the SSE endpoint using fetch + ReadableStream so the
 * Authorization header can be forwarded (EventSource doesn't support headers).
 * Auto-reconnects on connection loss.
 */
export function useSSE(token: string | null): SSEEvent | null {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const controller = new AbortController();

    async function connect() {
      try {
        const response = await fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/v1/orders/events`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const event: SSEEvent = JSON.parse(line.slice(6));
                setLastEvent(event);
              } catch {
                // ignore malformed lines / heartbeat comments
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (!cancelled) setTimeout(connect, 5_000);
      }
    }

    connect();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token]);

  return lastEvent;
}
