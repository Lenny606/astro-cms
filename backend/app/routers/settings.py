from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..database import get_database

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
async def get_settings(db: AsyncIOMotorDatabase = Depends(get_database)):
    settings = await db.settings.find_one({"type": "general"})
    if not settings:
        return {
            "headline_cz": "Alex Carter",
            "headline_en": "Alex Carter",
            "hero_desc_cz": "",
            "hero_desc_en": "",
            "statement_cz": "",
            "statement_en": ""
        }
    return {
        "headline_cz": settings.get("headline_cz", settings.get("headline", "Alex Carter")),
        "headline_en": settings.get("headline_en", settings.get("headline", "Alex Carter")),
        "hero_desc_cz": settings.get("hero_desc_cz", ""),
        "hero_desc_en": settings.get("hero_desc_en", ""),
        "statement_cz": settings.get("statement_cz", ""),
        "statement_en": settings.get("statement_en", "")
    }

@router.post("")
async def update_settings(data: dict, db: AsyncIOMotorDatabase = Depends(get_database)):
    update_data = {
        "headline_cz": data.get("headline_cz"),
        "headline_en": data.get("headline_en"),
        "hero_desc_cz": data.get("hero_desc_cz"),
        "hero_desc_en": data.get("hero_desc_en"),
        "statement_cz": data.get("statement_cz"),
        "statement_en": data.get("statement_en")
    }
    await db.settings.update_one(
        {"type": "general"},
        {"$set": update_data},
        upsert=True
    )
    return {"status": "success"}
