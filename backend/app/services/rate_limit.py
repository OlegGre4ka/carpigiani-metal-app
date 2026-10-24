"""Simple limit on attempts (login, forgot password) to stop password guessing.

Kept in memory: enough for one backend process. Counters reset when the backend restarts.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

_attempts: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def client_ip(request: Request) -> str:
    # Next.js server passes the visitor's address; fall back to the direct connection
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Allow `limit` attempts per `window_seconds` for this key, then answer 429."""
    now = time.monotonic()
    with _lock:
        hits = _attempts[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again later.",
            )
        hits.append(now)


def reset_rate_limit(key: str) -> None:
    with _lock:
        _attempts.pop(key, None)
