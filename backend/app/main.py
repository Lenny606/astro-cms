import os
import shutil
from pathlib import Path
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId

app = FastAPI(title="Mini CMS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup uploads directory
UPLOAD_DIR = Path("folder")
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve static files
app.mount("/folder", StaticFiles(directory=UPLOAD_DIR), name="folder")

# Pydantic models for Gallery
class GalleryItem(BaseModel):
    url: str
    filename: str

class Gallery(BaseModel):
    id: Optional[str] = None
    title: str
    images: List[GalleryItem] = []

class GalleryCreate(BaseModel):
    title: str

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    images: Optional[List[GalleryItem]] = None

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

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file.filename, "url": f"/folder/{file.filename}"}

@app.get("/posts")
async def get_posts(db: AsyncIOMotorDatabase = Depends(get_database)):
    posts = await db.posts.find().to_list(10)
    # Simple serialization for demo
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts

@app.get("/api/settings")
async def get_settings(db: AsyncIOMotorDatabase = Depends(get_database)):
    settings = await db.settings.find_one({"type": "general"})
    if not settings:
        return {
            "headline_cz": "Alex Carter",
            "headline_en": "Alex Carter"
        }
    return {
        "headline_cz": settings.get("headline_cz", settings.get("headline", "Alex Carter")),
        "headline_en": settings.get("headline_en", settings.get("headline", "Alex Carter"))
    }

@app.post("/api/settings")
async def update_settings(data: dict, db: AsyncIOMotorDatabase = Depends(get_database)):
    await db.settings.update_one(
        {"type": "general"},
        {"$set": {
            "headline_cz": data.get("headline_cz"),
            "headline_en": data.get("headline_en")
        }},
        upsert=True
    )
    return {"status": "success"}

# Gallery API
@app.get("/api/galleries")
async def get_galleries(db: AsyncIOMotorDatabase = Depends(get_database)):
    cursor = db.galleries.find()
    galleries = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        galleries.append(doc)
    return galleries

@app.post("/api/galleries")
async def create_gallery(gallery: GalleryCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    new_gallery = {
        "title": gallery.title,
        "images": []
    }
    result = await db.galleries.insert_one(new_gallery)
    return {"id": str(result.inserted_id), "title": gallery.title, "images": []}

@app.put("/api/galleries/{gallery_id}")
async def update_gallery(gallery_id: str, gallery: GalleryUpdate, db: AsyncIOMotorDatabase = Depends(get_database)):
    update_data = {}
    if gallery.title is not None:
        update_data["title"] = gallery.title
    if gallery.images is not None:
        update_data["images"] = [img.dict() for img in gallery.images]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
        
    result = await db.galleries.update_one(
        {"_id": ObjectId(gallery_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found")
        
    return {"status": "success"}

@app.delete("/api/galleries/{gallery_id}")
async def delete_gallery(gallery_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    result = await db.galleries.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found")
    return {"status": "success"}
