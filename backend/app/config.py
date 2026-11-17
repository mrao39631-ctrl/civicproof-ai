import os
from pathlib import Path

# Load .env file natively without requiring external python-dotenv package
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
env_file = BASE_DIR / ".env"

if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip("\"'")
            if k and k not in os.environ:
                os.environ[k] = v

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
IS_DEMO_AI = not bool(GEMINI_API_KEY)

JWT_SECRET = os.getenv("JWT_SECRET", "civicproof-hackathon-secure-secret-2026")
DATABASE_PATH = BASE_DIR / "civicproof.db"

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_IMAGES_DIR = ROOT_DIR / "sample_images"
SAMPLE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
