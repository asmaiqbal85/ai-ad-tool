import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api.ads import router as ads_router
from app.api.scrape import router as scrape_router
from app.api.generate import router as generate_router

app = FastAPI(title="AI Ad Tool API")

_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ads_router, prefix="/api/ads", tags=["ads"])
app.include_router(scrape_router, prefix="/api/scrape", tags=["scrape"])
app.include_router(generate_router, prefix="/api/generate-ad", tags=["generate"])


@app.get("/health")
async def health():
    return {"status": "ok"}
