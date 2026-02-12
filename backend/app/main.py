from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_database
from .config import UPLOAD_DIR
from .routers import uploads, settings, galleries, posts

app = FastAPI(title="Mini CMS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/folder", StaticFiles(directory=UPLOAD_DIR), name="folder")

# Include Routers
app.include_router(uploads.router)
app.include_router(settings.router)
app.include_router(galleries.router)
app.include_router(posts.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Mini CMS API"}

@app.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Check if we can list collections
        await db.list_collection_names()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
