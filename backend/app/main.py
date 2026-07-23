import logging
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.infrastructure.cache.client import close_redis
from app.infrastructure.database.session import dispose_engine

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
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
    async def request_context_middleware(
        request: Request, call_next: Callable[[Request], Any]
    ) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        started_at = perf_counter()

        try:
            response: Response = await call_next(request)
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

        # OWASP Enterprise Cyber Security Headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none';"

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
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
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
