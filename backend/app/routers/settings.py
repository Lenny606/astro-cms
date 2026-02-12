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
            "statement_en": "",
            "nav_works_cz": "Díla",
            "nav_philosophy_cz": "Filosofie",
            "nav_exhibitions_cz": "Výstavy",
            "nav_contact_cz": "Kontakt",
            "nav_inquire_cz": "Poptávka",
            "nav_works_en": "Works",
            "nav_philosophy_en": "Philosophy",
            "nav_exhibitions_en": "Exhibitions",
            "nav_contact_en": "Contact",
            "nav_inquire_en": "Inquire",
            "navigation_cz": [],
            "navigation_en": []
        }
    return {
        "headline_cz": settings.get("headline_cz", settings.get("headline", "Alex Carter")),
        "headline_en": settings.get("headline_en", settings.get("headline", "Alex Carter")),
        "hero_desc_cz": settings.get("hero_desc_cz", ""),
        "hero_desc_en": settings.get("hero_desc_en", ""),
        "statement_cz": settings.get("statement_cz", ""),
        "statement_en": settings.get("statement_en", ""),
        "nav_works_cz": settings.get("nav_works_cz", "Díla"),
        "nav_philosophy_cz": settings.get("nav_philosophy_cz", "Filosofie"),
        "nav_exhibitions_cz": settings.get("nav_exhibitions_cz", "Výstavy"),
        "nav_contact_cz": settings.get("nav_contact_cz", "Kontakt"),
        "nav_inquire_cz": settings.get("nav_inquire_cz", "Poptávka"),
        "nav_works_en": settings.get("nav_works_en", "Works"),
        "nav_philosophy_en": settings.get("nav_philosophy_en", "Philosophy"),
        "nav_exhibitions_en": settings.get("nav_exhibitions_en", "Exhibitions"),
        "nav_contact_en": settings.get("nav_contact_en", "Contact"),
        "nav_inquire_en": settings.get("nav_inquire_en", "Inquire"),
        "navigation_cz": settings.get("navigation_cz", []),
        "navigation_en": settings.get("navigation_en", [])
    }

@router.post("")
async def update_settings(data: dict, db: AsyncIOMotorDatabase = Depends(get_database)):
    update_data = {
        "headline_cz": data.get("headline_cz"),
        "headline_en": data.get("headline_en"),
        "hero_desc_cz": data.get("hero_desc_cz"),
        "hero_desc_en": data.get("hero_desc_en"),
        "statement_cz": data.get("statement_cz"),
        "statement_en": data.get("statement_en"),
        "nav_works_cz": data.get("nav_works_cz"),
        "nav_philosophy_cz": data.get("nav_philosophy_cz"),
        "nav_exhibitions_cz": data.get("nav_exhibitions_cz"),
        "nav_contact_cz": data.get("nav_contact_cz"),
        "nav_inquire_cz": data.get("nav_inquire_cz"),
        "nav_works_en": data.get("nav_works_en"),
        "nav_philosophy_en": data.get("nav_philosophy_en"),
        "nav_exhibitions_en": data.get("nav_exhibitions_en"),
        "nav_contact_en": data.get("nav_contact_en"),
        "nav_inquire_en": data.get("nav_inquire_en"),
        "navigation_cz": data.get("navigation_cz"),
        "navigation_en": data.get("navigation_en")
    }
    await db.settings.update_one(
        {"type": "general"},
        {"$set": update_data},
        upsert=True
    )
    return {"status": "success"}
