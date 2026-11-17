import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import UPLOADS_DIR, GEMINI_API_KEY, IS_DEMO_AI, ROOT_DIR
from backend.app.database import init_db
from backend.app.seed_data import seed_demo_data
from backend.app.routes import auth_routes, complaint_routes, evidence_routes, verification_routes, admin_routes

app = FastAPI(
    title="CivicProof AI API",
    description="AI-powered independent verification of civic complaints",
    version="1.0.0"
)

# 1. Enable CORS for all origins (required for web clients and cross-origin access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Ensure uploads directory is automatically created and mounted at /uploads
os.makedirs("uploads", exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# 3. Mount Backend API Routers
app.include_router(auth_routes.router)
app.include_router(complaint_routes.router)
app.include_router(evidence_routes.router)
app.include_router(verification_routes.router)
app.include_router(admin_routes.router)

# 4. Frontend SPA Assets Mounting for Render Single-Service Deployment
DIST_DIR = ROOT_DIR / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="frontend-assets")
# pyrefly: ignore[deprecated]
@app.on_event("startup")
def on_startup():
    """Initializes SQLite database tables and seeds 3 demo reports if DB is empty."""
    os.makedirs("uploads", exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    init_db()
    seed_demo_data()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CivicProof AI Backend",
        "ai_engine": "Gemini 2.5 Flash" if not IS_DEMO_AI else "DEMO MODE (Simulated Multimodal Engine)",
        "has_gemini_key": bool(GEMINI_API_KEY),
        "database": "SQLite (WAL Mode)",
        "version": "1.0.0"
    }

# 5. Catch-all GET route to serve frontend/dist/index.html for React SPA client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Pass through to API or uploads if reached here
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        return {"error": "Not Found"}
    
    # Check if a specific file exists in frontend/dist (e.g. favicon, logo)
    file_path = DIST_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    
    # Otherwise return index.html so React Router handles the route
    index_path = DIST_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return {
        "status": "online",
        "service": "CivicProof AI API",
        "message": "Frontend distribution not built yet. Run 'npm run build' inside frontend directory.",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
