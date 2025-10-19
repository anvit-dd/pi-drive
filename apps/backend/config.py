import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_PATH = Path(os.environ.get("BASE_PATH", "."))
JWT_SECRET = os.getenv("JWT_SECRET")
API_KEY = os.getenv("API_KEY")
FILES_MASTER_KEY = os.getenv("FILES_MASTER_KEY")

ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

VIDEO_FORMATS = [
    ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".mpeg", ".mpg",
    ".m4v", ".3gp", ".3g2", ".mts", ".m2ts", ".vob", ".ogv", ".rm", ".rmvb"
]

IMAGE_FORMATS = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico", ".tiff"
]

DOCUMENT_FORMATS = [
    ".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"
]

APP_TITLE = "PiDrive File Handler and Storage"
APP_VERSION = "0.0.0"
APP_DESCRIPTION = "RESTful API for file and directory management with encryption support"
