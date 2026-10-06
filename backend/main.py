from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from database import init_db
from routes.predict import router as predict_router
from routes.history import router as history_router
from routes.model_info import router as model_info_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database on startup
    init_db()
    print(f"[{settings.PROJECT_NAME}] Database initialized at {settings.DB_PATH}")
    yield

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    version=settings.VERSION,
    description="Industrial Predictive Maintenance AI Service (AI4I 2020 Dataset - AD5305 Machine Learning)",
    lifespan=lifespan
)

# Enable CORS for local Vite development and any local network dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints
app.include_router(predict_router)
app.include_router(history_router)
app.include_router(model_info_router)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "predict": "POST /predict",
            "history": "GET /history",
            "health": "GET /health",
            "model_info": "GET /model-info"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
