Set-Location D:\Projects\MNOP
$ErrorActionPreference = "Stop"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Content
    )

    $fullPath = Join-Path (Get-Location) $Path
    $parentDirectory = Split-Path -Parent $fullPath

    if ($parentDirectory) {
        New-Item -ItemType Directory -Force -Path $parentDirectory | Out-Null
    }

    [System.IO.File]::WriteAllText(
        $fullPath,
        $Content.TrimStart() + [Environment]::NewLine,
        $utf8NoBom
    )
}

Write-Utf8NoBom -Path "backend\.dockerignore" -Content @'
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
.venv/
venv/
.coverage
htmlcov/
.git/
.gitignore
'@

Write-Utf8NoBom -Path "backend\Dockerfile" -Content @'
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md alembic.ini ./
COPY app ./app
COPY alembic ./alembic
COPY tests ./tests

RUN python -m pip install --upgrade pip \
    && python -m pip install ".[dev]"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
'@

Write-Utf8NoBom -Path "backend\README.md" -Content @'
# MNOP Backend

Backend API untuk Monitoring Network Operations Platform.

## Endpoint awal

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/health/database`
- `GET /api/v1/health/redis`
- `GET /api/v1/health/readiness`
- Swagger UI: `/docs`
'@

Write-Utf8NoBom -Path "backend\alembic.ini" -Content @'
[alembic]
script_location = %(here)s/alembic
prepend_sys_path = .
path_separator = os
sqlalchemy.url = postgresql+asyncpg://placeholder:placeholder@localhost/placeholder

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
'@

Write-Utf8NoBom -Path "backend\alembic\env.py" -Content @'
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.infrastructure.database.base import Base


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option(
    "sqlalchemy.url",
    settings.database_url.replace("%", "%%"),
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
'@

Write-Utf8NoBom -Path "backend\alembic\script.py.mako" -Content @'
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: str | None = ${repr(down_revision)}
branch_labels: str | Sequence[str] | None = ${repr(branch_labels)}
depends_on: str | Sequence[str] | None = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
'@

Write-Utf8NoBom -Path "backend\alembic\versions\20260719_0001_baseline.py" -Content @'
"""Baseline struktur database MNOP.

Revision ID: 20260719_0001
Revises:
Create Date: 2026-07-19
"""

from collections.abc import Sequence


revision: str = "20260719_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Membuat baseline migration tanpa tabel domain."""

    # Tabel domain akan dibuat melalui migration fitur berikutnya.
    pass


def downgrade() -> None:
    """Mengembalikan baseline migration."""

    pass
'@

Write-Utf8NoBom -Path "backend\app\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\api\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\api\v1\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\api\v1\endpoints\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\api\v1\endpoints\health.py" -Content @'
import asyncio
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from time import perf_counter

from fastapi import APIRouter, Response, status

from app.core.config import get_settings
from app.infrastructure.cache.client import check_redis
from app.infrastructure.database.session import check_database
from app.schemas.health import (
    ComponentHealth,
    HealthResponse,
    HealthStatus,
    ReadinessResponse,
)


router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger(__name__)
settings = get_settings()


async def _measure_component(
    component_name: str,
    checker: Callable[[], Awaitable[None]],
) -> ComponentHealth:
    started_at = perf_counter()

    try:
        await checker()
    except Exception:
        latency_ms = round((perf_counter() - started_at) * 1000, 2)
        logger.exception(
            "health_component_down",
            extra={"component": component_name, "latency_ms": latency_ms},
        )
        return ComponentHealth(status="down", latency_ms=latency_ms)

    latency_ms = round((perf_counter() - started_at) * 1000, 2)
    return ComponentHealth(status="up", latency_ms=latency_ms)


@router.get("", response_model=HealthResponse, summary="Liveness backend")
async def liveness() -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        status="up",
        timestamp=datetime.now(UTC),
    )


@router.get(
    "/database",
    response_model=ComponentHealth,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Database down"}},
    summary="Kesehatan PostgreSQL",
)
async def database_health(response: Response) -> ComponentHealth:
    component = await _measure_component("postgresql", check_database)
    if component.status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return component


@router.get(
    "/redis",
    response_model=ComponentHealth,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Redis down"}},
    summary="Kesehatan Redis",
)
async def redis_health(response: Response) -> ComponentHealth:
    component = await _measure_component("redis", check_redis)
    if component.status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return component


@router.get(
    "/readiness",
    response_model=ReadinessResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Dependency down"}},
    summary="Readiness backend",
)
async def readiness(response: Response) -> ReadinessResponse:
    database_result, redis_result = await asyncio.gather(
        _measure_component("postgresql", check_database),
        _measure_component("redis", check_redis),
    )

    components = {
        "postgresql": database_result,
        "redis": redis_result,
    }
    overall_status: HealthStatus = (
        "up"
        if all(component.status == "up" for component in components.values())
        else "down"
    )

    if overall_status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponse(
        service=settings.app_name,
        version=settings.app_version,
        status=overall_status,
        timestamp=datetime.now(UTC),
        components=components,
    )
'@

Write-Utf8NoBom -Path "backend\app\api\v1\router.py" -Content @'
from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router


api_router = APIRouter()
api_router.include_router(health_router)
'@

Write-Utf8NoBom -Path "backend\app\core\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\core\config.py" -Content @'
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
    postgres_password: SecretStr

    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30
    database_pool_recycle: int = 1800

    redis_host: str = "mnop-redis"
    redis_port: int = 6379
    redis_database: int = 0
    redis_password: SecretStr
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
        return (
            f"redis://:{password}@{self.redis_host}:"
            f"{self.redis_port}/{self.redis_database}"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
'@

Write-Utf8NoBom -Path "backend\app\core\logging.py" -Content @'
import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any


_STANDARD_LOG_RECORD_ATTRIBUTES = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
    "taskName",
}


class JsonFormatter(logging.Formatter):
    """Formatter JSON sederhana agar log mudah dibaca oleh Docker dan log collector."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in _STANDARD_LOG_RECORD_ATTRIBUTES and not key.startswith("_"):
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)

    logging.getLogger("uvicorn.access").handlers.clear()
    logging.getLogger("uvicorn.access").propagate = True
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\cache\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\cache\client.py" -Content @'
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
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\database\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\database\base.py" -Content @'
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class seluruh SQLAlchemy ORM model MNOP."""

    pass
'@

Write-Utf8NoBom -Path "backend\app\infrastructure\database\session.py" -Content @'
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


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
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
'@

Write-Utf8NoBom -Path "backend\app\main.py" -Content @'
import logging
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.infrastructure.cache.client import close_redis
from app.infrastructure.database.session import dispose_engine


settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info(
        "application_started",
        extra={
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.app_env,
        },
    )
    try:
        yield
    finally:
        await close_redis()
        await dispose_engine()
        logger.info("application_stopped", extra={"service": settings.app_name})


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.app_debug,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        started_at = perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                },
            )
            raise

        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid4()))
        logger.exception(
            "unhandled_exception",
            exc_info=exc,
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Terjadi kesalahan internal pada server.",
                    "request_id": request_id,
                }
            },
            headers={"X-Request-ID": request_id},
        )

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "documentation": "/docs",
        }

    return application


app = create_application()
'@

Write-Utf8NoBom -Path "backend\app\schemas\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\app\schemas\health.py" -Content @'
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


HealthStatus = Literal["up", "down"]


class ComponentHealth(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: HealthStatus
    latency_ms: float | None = Field(default=None, ge=0)


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service: str
    version: str
    environment: str
    status: Literal["up"]
    timestamp: datetime


class ReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service: str
    version: str
    status: HealthStatus
    timestamp: datetime
    components: dict[str, ComponentHealth]
'@

Write-Utf8NoBom -Path "backend\pyproject.toml" -Content @'
[build-system]
requires = ["setuptools>=75"]
build-backend = "setuptools.build_meta"

[project]
name = "mnop-backend"
version = "0.1.0"
description = "Backend API Monitoring Network Operations Platform"
readme = "README.md"
requires-python = ">=3.13,<3.14"
dependencies = [
    "fastapi>=0.124,<1.0",
    "uvicorn[standard]>=0.34,<1.0",
    "pydantic>=2.12,<3.0",
    "pydantic-settings>=2.10,<3.0",
    "sqlalchemy[asyncio]>=2.0,<3.0",
    "asyncpg>=0.30,<1.0",
    "alembic>=1.18,<2.0",
    "redis>=6.0,<8.0",
]

[project.optional-dependencies]
dev = [
    "httpx>=0.28,<1.0",
    "pytest>=8.3,<10.0",
    "pytest-asyncio>=0.25,<2.0",
    "ruff>=0.11,<1.0",
    "mypy>=1.15,<2.0",
]

[tool.setuptools.packages.find]
where = ["."]
include = ["app*"]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
addopts = "-ra -q"

[tool.ruff]
target-version = "py313"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.mypy]
python_version = "3.13"
strict = true
warn_unused_configs = true
plugins = ["pydantic.mypy"]
'@

Write-Utf8NoBom -Path "backend\tests\__init__.py" -Content @'
'@

Write-Utf8NoBom -Path "backend\tests\test_health.py" -Content @'
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["service"] == "MNOP API"


def test_liveness_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "up"
    assert payload["service"] == "MNOP API"
'@

Write-Host "Fondasi Backend MNOP berhasil dibuat." -ForegroundColor Green

if (-not (Test-Path ".\.env")) {
    throw "File .env tidak ditemukan di D:\Projects\MNOP."
}

function Ensure-EnvSetting {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $lines = [System.IO.File]::ReadAllLines($Path)
    $pattern = "^" + [Regex]::Escape($Name) + "="

    if (-not ($lines | Where-Object { $_ -match $pattern })) {
        [System.IO.File]::AppendAllText(
            $Path,
            "$Name=$Value" + [Environment]::NewLine,
            $utf8NoBom
        )
    }
}

Ensure-EnvSetting -Path ".\.env" -Name "APP_NAME" -Value "MNOP API"
Ensure-EnvSetting -Path ".\.env" -Name "APP_VERSION" -Value "0.1.0"
Ensure-EnvSetting -Path ".\.env" -Name "APP_ENV" -Value "development"
Ensure-EnvSetting -Path ".\.env" -Name "APP_DEBUG" -Value "true"
Ensure-EnvSetting -Path ".\.env" -Name "API_V1_PREFIX" -Value "/api/v1"
Ensure-EnvSetting -Path ".\.env" -Name "LOG_LEVEL" -Value "INFO"
Ensure-EnvSetting -Path ".\.env" -Name "BACKEND_PORT" -Value "8000"

if (Test-Path ".\.env.example") {
    Ensure-EnvSetting -Path ".\.env.example" -Name "APP_NAME" -Value "MNOP API"
    Ensure-EnvSetting -Path ".\.env.example" -Name "APP_VERSION" -Value "0.1.0"
    Ensure-EnvSetting -Path ".\.env.example" -Name "APP_ENV" -Value "development"
    Ensure-EnvSetting -Path ".\.env.example" -Name "APP_DEBUG" -Value "true"
    Ensure-EnvSetting -Path ".\.env.example" -Name "API_V1_PREFIX" -Value "/api/v1"
    Ensure-EnvSetting -Path ".\.env.example" -Name "LOG_LEVEL" -Value "INFO"
    Ensure-EnvSetting -Path ".\.env.example" -Name "BACKEND_PORT" -Value "8000"
}

if (Test-Path ".\compose.yaml") {
    Copy-Item ".\compose.yaml" ".\compose.before-backend.yaml" -Force
}

Write-Utf8NoBom -Path "compose.yaml" -Content @'
name: mnop-infra

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  mnop-postgres:
    image: postgres:17
    container_name: mnop_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      TZ: ${TZ}
    expose:
      - "5432"
    volumes:
      - mnop_postgres_data:/var/lib/postgresql/data
    networks:
      - mnop_network
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    logging: *default-logging

  mnop-redis:
    image: redis:7.4-alpine
    container_name: mnop_redis
    restart: unless-stopped
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      TZ: ${TZ}
    command:
      - sh
      - -c
      - exec redis-server --appendonly yes --requirepass "$$REDIS_PASSWORD"
    expose:
      - "6379"
    volumes:
      - mnop_redis_data:/data
    networks:
      - mnop_network
    healthcheck:
      test:
        - CMD-SHELL
        - 'redis-cli --no-auth-warning -a "$$REDIS_PASSWORD" ping | grep -q PONG'
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    logging: *default-logging

  mnop-adminer:
    image: adminer:latest
    container_name: mnop_adminer
    restart: unless-stopped
    environment:
      ADMINER_DEFAULT_SERVER: mnop-postgres
      TZ: ${TZ}
    ports:
      - "127.0.0.1:${ADMINER_PORT:-8080}:8080"
    networks:
      - mnop_network
    depends_on:
      mnop-postgres:
        condition: service_healthy
    logging: *default-logging

  mnop-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mnop_backend
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      APP_NAME: "${APP_NAME:-MNOP API}"
      APP_VERSION: "${APP_VERSION:-0.1.0}"
      APP_ENV: "${APP_ENV:-development}"
      APP_DEBUG: "${APP_DEBUG:-true}"
      API_V1_PREFIX: "${API_V1_PREFIX:-/api/v1}"
      LOG_LEVEL: "${LOG_LEVEL:-INFO}"
      POSTGRES_HOST: mnop-postgres
      POSTGRES_PORT: "5432"
      REDIS_HOST: mnop-redis
      REDIS_PORT: "6379"
    command:
      - uvicorn
      - app.main:app
      - --host
      - 0.0.0.0
      - --port
      - "8000"
      - --reload
    ports:
      - "127.0.0.1:${BACKEND_PORT:-8000}:8000"
    volumes:
      - ./backend:/app
    networks:
      - mnop_network
    depends_on:
      mnop-postgres:
        condition: service_healthy
      mnop-redis:
        condition: service_healthy
    healthcheck:
      test:
        - CMD
        - python
        - -c
        - 'import urllib.request; urllib.request.urlopen("http://127.0.0.1:8000/api/v1/health", timeout=3)'
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    logging: *default-logging

volumes:
  mnop_postgres_data:
  mnop_redis_data:

networks:
  mnop_network:
    driver: bridge
'@

docker compose --env-file .\.env -f .\compose.yaml config --quiet

if ($LASTEXITCODE -ne 0) {
    throw "Validasi compose.yaml gagal. Gunakan backup compose.before-backend.yaml."
}

Write-Host ""
Write-Host "Fondasi Backend MNOP dan compose.yaml berhasil disiapkan." -ForegroundColor Green
Write-Host "File rahasia .env tidak ditampilkan atau diubah passwordnya." -ForegroundColor Green
Write-Host ""
Write-Host "Perintah berikutnya:" -ForegroundColor Cyan
Write-Host "docker compose --env-file .\.env -f .\compose.yaml up -d --build"
Write-Host "docker compose -f .\compose.yaml ps"
Write-Host "docker compose -f .\compose.yaml exec mnop-backend alembic upgrade head"
Write-Host "docker compose -f .\compose.yaml exec mnop-backend pytest"
