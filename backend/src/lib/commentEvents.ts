import type { Response } from 'express';

/**
 * Targeted SSE delivery registry.
 *
 * Maps userId → Set<Response> so we can push events to specific users
 * (e.g. notify only the customer who owns a comment, or only staff/admin).
 *
 * One user can have multiple tabs open → Set of responses per userId.
 */
const clientMap = new Map<string, Set<Response>>();

export function registerSSEClient(userId: string, res: Response): void {
  if (!clientMap.has(userId)) clientMap.set(userId, new Set());
  clientMap.get(userId)!.add(res);
}

export function unregisterSSEClient(userId: string, res: Response): void {
  const set = clientMap.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clientMap.delete(userId);
}

/** Send a JSON event payload to a single user (all their open tabs). */
export function sendSSEToUser(userId: string, event: object): void {
  const clients = clientMap.get(userId);
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      // Connection already closed; will be cleaned up on 'close' event
    }
  }
}

/** Broadcast a JSON event payload to multiple users at once. */
export function sendSSEToUsers(userIds: string[], event: object): void {
  if (userIds.length === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const userId of userIds) {
    const clients = clientMap.get(userId);
    if (!clients) continue;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        // ignore
      }
    }
  }
}

// ─── Event type interfaces ──────────────────────────────────────────────────

export interface CommentCreatedEvent {
  eventType: 'comment.created';
  comment: {
    id: string;
    menuItemId: string;
    menuItemName: string;
    customerName: string | null;
    content: string;
    rating: number | null;
    createdAt: string;
  };
}

export interface CommentRepliedEvent {
  eventType: 'comment.replied';
  commentId: string;
  reply: {
    id: string;
    content: string;
    staffName: string | null;
    createdAt: string;
  };
}

export interface NotificationCreatedEvent {
  eventType: 'notification.created';
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    refId: string | null;
    createdAt: string;
  };
}

export type CommentRealtimeEvent =
  | CommentCreatedEvent
  | CommentRepliedEvent
  | NotificationCreatedEvent;
