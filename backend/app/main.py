"""FastAPI main entry point for the LexScan package screening system."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .api.inspection import router as inspection_router

app = FastAPI(
    title="LexScan Quality Assurance API",
    description="Automated label declaration extraction & deterministic compliance evaluation.",
    version="1.1.0",
)

# CORS Configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(inspection_router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint for system monitoring."""
    return {
        "status": "healthy",
        "service": "LexScan Quality Assurance Engine",
        "version": "1.1.0",
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to LexScan Quality Assurance System",
        "docs": "/docs",
        "health": "/api/health",
    }
