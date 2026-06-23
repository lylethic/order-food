import asyncio
import json
from typing import Any

class CommentEventBus:
    """SSE event bus for comment/notification events targeted to specific users."""

    def __init__(self):
        # Map user_id -> list of Queues
        self._clients: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, user_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        if user_id not in self._clients:
            self._clients[user_id] = []
        self._clients[user_id].append(q)
        return q

    def unsubscribe(self, user_id: str, q: asyncio.Queue):
        if user_id in self._clients:
            try:
                self._clients[user_id].remove(q)
            except ValueError:
                pass
            if not self._clients[user_id]:
                del self._clients[user_id]

    async def publish_to_user(self, user_id: str, event: dict[str, Any]):
        if user_id in self._clients:
            for q in list(self._clients[user_id]):
                try:
                    await q.put(event)
                except Exception:
                    self.unsubscribe(user_id, q)


comment_event_bus = CommentEventBus()
