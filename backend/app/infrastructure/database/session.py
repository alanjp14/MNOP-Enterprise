from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    pool_recycle=settings.database_pool_recycle,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession]:
    """Menyediakan satu AsyncSession untuk satu request/use case."""

    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def check_database() -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


async def dispose_engine() -> None:
    await engine.dispose()
