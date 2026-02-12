from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..database import get_database

router = APIRouter(tags=["posts"])

@router.get("/posts")
async def get_posts(db: AsyncIOMotorDatabase = Depends(get_database)):
    posts = await db.posts.find().to_list(10)
    # Simple serialization for demo
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts
