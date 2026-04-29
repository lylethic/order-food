import { useState, useEffect } from 'react';

export interface StatusEvent {
  orderId: string;
  status: string;
}

/**
 * Connects to the SSE order-events endpoint using fetch + ReadableStream so
 * the Authorization header can be sent (EventSource doesn't support headers).
 * Automatically reconnects on connection loss.
 */
export function useSSE(token: string | null): StatusEvent | null {
  const [lastEvent, setLastEvent] = useState<StatusEvent | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const controller = new AbortController();

    async function connect() {
      try {
        console.log('[SSE] Connecting to /api/v1/orders/events...');
        const response = await fetch('/api/v1/orders/events', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          console.error(
            '[SSE] Response not ok or no body:',
            response.status,
            response.statusText,
          );
          return;
        }

        console.log('[SSE] Connected! Listening for events...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const event: StatusEvent = JSON.parse(line.slice(6));
                console.log('[SSE] Received event:', event);
                setLastEvent(event);
              } catch (err) {
                // ignore malformed lines (e.g. heartbeat comments)
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[SSE] Connection closed');
        } else {
          console.error('[SSE] Connection error:', err);
          // AbortError on cleanup is expected; reconnect on other failures
          if (!cancelled) {
            console.log('[SSE] Reconnecting in 5s...');
            setTimeout(connect, 5_000);
          }
        }
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
