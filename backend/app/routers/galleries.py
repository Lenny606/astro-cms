from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from ..database import get_database
from ..schemas.gallery import GalleryCreate, GalleryUpdate

router = APIRouter(prefix="/api/galleries", tags=["galleries"])

@router.get("")
async def get_galleries(db: AsyncIOMotorDatabase = Depends(get_database)):
    cursor = db.galleries.find()
    galleries = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        galleries.append(doc)
    return galleries

@router.post("")
async def create_gallery(gallery: GalleryCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    new_gallery = {
        "title": gallery.title,
        "images": []
    }
    result = await db.galleries.insert_one(new_gallery)
    return {"id": str(result.inserted_id), "title": gallery.title, "images": []}

@router.put("/{gallery_id}")
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

@router.delete("/{gallery_id}")
async def delete_gallery(gallery_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    result = await db.galleries.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found")
    return {"status": "success"}
