import logging
import os
import sys
from contextlib import asynccontextmanager

# Ensure backend root is on sys.path for direct script and IDE resolution
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.api.v1.api_router import api_router
from app.core.compliance import ComplianceViolationException
from app.core.config import settings
from app.core.database import Base, engine
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("alcodelivery")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup for immediate local portability
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info(
        f"Alco Telangana Marketplace initialized. "
        f"Alcohol Transactions Enabled: {settings.ALCOHOL_TRANSACTIONS_ENABLED} (FAIL-CLOSED)."
    )
    # Auto-seed initial demo dataset (users, products, licensed retailers)
    try:
        from seed_data import seed_database
        seed_database()
        logger.info("Demo database verified/seeded successfully.")
    except Exception as e:
        logger.warning(f"Auto-seed notification: {e}")

    yield
    logger.info("Application shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AlcoRez: Reserve. Verify. Collect. Production-minded Telangana Alcoholic Beverage Discovery & Licensed Retailer Reservation API.\n\n"
        "**CRITICAL STATUTORY NOTICE:** Commercial alcohol sales and home delivery are strictly regulated activities "
        "under the Telangana Excise Act, 1968. Live payment processing and actual delivery dispatch are permanently "
        "disabled by default (`ALCOHOL_TRANSACTIONS_ENABLED=false`). This platform operates exclusively in a simulated "
        "demonstration mode for product discovery and verified retailer listing."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - explicitly supports Vercel frontend deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_origin_regex=r"^(https:\/\/.*\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for fast payload transfers (>500 bytes compressed)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Exception handlers
@app.exception_handler(ComplianceViolationException)
async def compliance_violation_handler(request: Request, exc: ComplianceViolationException):
    logger.warning(f"Compliance violation intercepted at {request.url.path}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content=exc.detail)

# Include v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "mode": "DEMO_SIMULATION",
        "jurisdiction": "Telangana State, India",
        "documentation": "/docs",
        "compliance_status": f"{settings.API_V1_STR}/compliance-status"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "jurisdiction": "Telangana State, India",
        "alcohol_transactions_enabled": settings.ALCOHOL_TRANSACTIONS_ENABLED
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=settings.DEBUG)
