from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()

redis_client = Redis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
    socket_connect_timeout=settings.redis_socket_timeout,
    socket_timeout=settings.redis_socket_timeout,
    health_check_interval=30,
)


async def check_redis() -> None:
    pong = await redis_client.ping()
    if pong is not True:
        raise RuntimeError("Redis tidak mengembalikan PONG.")


async def close_redis() -> None:
    await redis_client.aclose()
