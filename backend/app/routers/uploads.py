import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..config import UPLOAD_DIR

router = APIRouter(prefix="/api", tags=["uploads"])

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file.filename, "url": f"/folder/{file.filename}"}
