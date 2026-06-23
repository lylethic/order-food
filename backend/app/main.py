import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from app.config import settings

from app.routers.api import register_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    print(f"🚀 FastAPI server started on port {settings.PORT}")
    print(f"📖 Swagger UI: {settings.API_PUBLIC_URL}/docs")
    yield
    print("Server shutting down...")


app = FastAPI(
    title="Ordering Food API",
    description="Restaurant Ordering Management System - FastAPI backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://172.23.55.205:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ─── Static Files ─────────────────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ─── Global Error Handlers ───────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = (
            ".".join(str(loc) for loc in error["loc"][1:])
            if len(error["loc"]) > 1
            else "unknown"
        )
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "status_code": 422,
            "message": "Validation failed",
            "message_en": "Validation failed",
            "data": None,
            "errors": errors,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "status_code": exc.status_code,
            "message": exc.detail,
            "message_en": exc.detail,
            "data": None,
            "errors": [],
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "status_code": 500,
            "message": "Internal server error",
            "message_en": "Internal server error",
            "data": None,
            "errors": [],
        },
    )


# ─── Register Routes ─────────────────────────────────────────────────────────
register_routers(app)
