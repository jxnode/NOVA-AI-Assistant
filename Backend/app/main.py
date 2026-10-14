
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.services.memory_service import initialize_database

import psutil


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the PostgreSQL memories table at startup.
    initialize_database()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/")
def home():
    return {"message": "NOVA Backend Running"}


@app.get("/stats")
def get_stats():
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "cpu": cpu,
        "ram_used_gb": round(ram.used / (1024**3), 1),
        "ram_percent": ram.percent,
        "disk_used_gb": round(disk.used / (1024**3), 1),
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "disk_percent": disk.percent,
    }
