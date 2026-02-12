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

@app.get("/api/settings")
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

@app.post("/api/settings")
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

@app.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Check if we can list collections
        await db.list_collection_names()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
