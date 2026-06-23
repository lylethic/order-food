from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from typing import AsyncGenerator

from urllib.parse import urlparse, urlunparse, parse_qs, urlencode, quote_plus, unquote_plus

def get_async_url(url: str) -> str:
    """Convert postgresql:// to postgresql+asyncpg://, encode password, and remove Prisma parameters"""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    parsed = urlparse(url)
    
    # Properly encode special characters (like @) in the password
    netloc = parsed.netloc
    if "@" in netloc:
        auth, host_port = netloc.rsplit("@", 1)
        if ":" in auth:
            user, password = auth.split(":", 1)
            password = quote_plus(unquote_plus(password))
            netloc = f"{user}:{password}@{host_port}"
            
    if parsed.scheme == "postgresql":
        parsed = parsed._replace(scheme="postgresql+asyncpg")
        
    parsed = parsed._replace(netloc=netloc)
        
    query_params = parse_qs(parsed.query)
    query_params.pop("pgbouncer", None)
    query_params.pop("connection_limit", None)
    
    parsed = parsed._replace(query=urlencode(query_params, doseq=True))
    return urlunparse(parsed)

engine = create_async_engine(
    get_async_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
