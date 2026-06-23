import asyncio
import json
from typing import Any

class EventBus:
    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def publish(self, event: dict[str, Any]):
        dead = []
        for q in list(self._subscribers):
            try:
                await q.put(event)
            except Exception:
                dead.append(q)
        for q in dead:
            self.unsubscribe(q)

order_event_bus = EventBus()
