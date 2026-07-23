from functools import lru_cache
from typing import Literal
from urllib.parse import quote_plus

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfigurasi aplikasi yang dibaca dan divalidasi dari environment."""

    app_name: str = "MNOP API"
    app_version: str = "0.1.0"
    app_env: Literal["development", "testing", "staging", "production"] = "development"
    app_debug: bool = False
    api_v1_prefix: str = "/api/v1"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    postgres_host: str = "mnop-postgres"
    postgres_port: int = 5432
    postgres_db: str = "mnop_db"
    postgres_user: str = "mnop_user"
    postgres_password: SecretStr = SecretStr("mnop_dev_password")

    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30
    database_pool_recycle: int = 1800

    redis_host: str = "mnop-redis"
    redis_port: int = 6379
    redis_database: int = 0
    redis_password: SecretStr = SecretStr("mnop_dev_redis_password")
    redis_socket_timeout: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    @field_validator("api_v1_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.startswith("/"):
            normalized = f"/{normalized}"
        return normalized.rstrip("/")

    @property
    def database_url(self) -> str:
        password = quote_plus(self.postgres_password.get_secret_value())
        username = quote_plus(self.postgres_user)
        database = quote_plus(self.postgres_db)
        return (
            f"postgresql+asyncpg://{username}:{password}"
            f"@{self.postgres_host}:{self.postgres_port}/{database}"
        )

    @property
    def redis_url(self) -> str:
        password = quote_plus(self.redis_password.get_secret_value())
        return f"redis://:{password}@{self.redis_host}:{self.redis_port}/{self.redis_database}"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
