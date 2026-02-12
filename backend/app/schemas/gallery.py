from pydantic import BaseModel
from typing import List, Optional

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
