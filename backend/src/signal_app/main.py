import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from signal_app.domain.exceptions import DomainError
from signal_app.infrastructure.config import CORS_ORIGINS, DATABASE_URL, DEMO_MODE
from signal_app.infrastructure.database.repository import make_uow
from signal_app.interfaces.api.routes import router


def create_app(uow_factory=None, *, demo_mode=DEMO_MODE):
    app = FastAPI(
        title="SIGNAL API", version="1.0.0", description="From risk to resolution. Demo identity only."
    )
    engine, default_uow = make_uow(DATABASE_URL)
    app.state.engine = engine
    app.state.uow = uow_factory or default_uow
    app.state.demo_mode = demo_mode
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type", "X-Demo-User"],
    )
    app.include_router(router)

    @app.get("/health")
    def health():
        try:
            with app.state.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except SQLAlchemyError:
            return JSONResponse(
                status_code=503, content={"status": "unavailable", "database": "disconnected"}
            )

    @app.exception_handler(DomainError)
    async def domain_error(request: Request, exc: DomainError):
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": str(exc)})

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        errors = [{"field": ".".join(str(x) for x in e["loc"]), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder(
                {
                    "code": "validation_error",
                    "message": "; ".join(e["message"] for e in errors),
                    "errors": errors,
                }
            ),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error(request: Request, exc: IntegrityError):
        return JSONResponse(
            status_code=409,
            content={
                "code": "conflict",
                "message": "The change conflicts with existing data. Refresh and try again.",
            },
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception):
        logging.getLogger("signal").exception("Unhandled request error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"code": "internal_error", "message": "An unexpected error occurred. Please try again."},
        )

    return app


app = create_app()
