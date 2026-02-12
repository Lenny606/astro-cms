import os
import io
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import UploadFile
from PIL import Image
import pillow_avif  # Required for AVIF support

class ImageService:
    def __init__(self, upload_dir: str = "folder"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        self.sizes = {
            "thumbnail": (150, 150),
            "400w": (400, 400),
            "800w": (800, 800),
            "1200w": (1200, 1200)
        }
        self.formats = ["webp", "avif"]

    async def process_and_save(self, upload_file: UploadFile) -> Dict:
        """
        Process the uploaded image:
        1. Save original
        2. Create WebP and AVIF versions
        3. Create resized versions (thumbnail, 400w, 800w, 1200w)
        """
        # Read the file content
        content = await upload_file.read()
        img_original = Image.open(io.BytesIO(content))
        
        # Get base filename without extension
        base_filename = Path(upload_file.filename).stem
        # Ensure base_filename is safe or unique
        # For now, let's keep it simple but ideally we'd add a timestamp or UUID
        target_dir = self.upload_dir / base_filename
        target_dir.mkdir(exist_ok=True)

        # Save original (as-is)
        original_ext = Path(upload_file.filename).suffix.lower()
        original_path = target_dir / f"original{original_ext}"
        with open(original_path, "wb") as f:
            f.write(content)

        results = {
            "original": f"/{self.upload_dir}/{base_filename}/original{original_ext}",
            "versions": {}
        }

        # Generate versions
        for fmt in self.formats:
            fmt_dir = target_dir / fmt
            fmt_dir.mkdir(exist_ok=True)
            
            results["versions"][fmt] = {}
            
            # Full size in this format
            full_path = fmt_dir / f"full.{fmt}"
            img_original.save(full_path, format=fmt.upper())
            results["versions"][fmt]["full"] = f"/{self.upload_dir}/{base_filename}/{fmt}/full.{fmt}"

            # Resized versions
            for size_name, size_dims in self.sizes.items():
                resized_img = img_original.copy()
                # Maintain aspect ratio
                resized_img.thumbnail(size_dims, Image.Resampling.LANCZOS)
                
                size_path = fmt_dir / f"{size_name}.{fmt}"
                resized_img.save(size_path, format=fmt.upper())
                results["versions"][fmt][size_name] = f"/{self.upload_dir}/{base_filename}/{fmt}/{size_name}.{fmt}"

        return results

image_service = ImageService()
