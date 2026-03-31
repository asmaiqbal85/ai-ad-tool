from fastapi import APIRouter, HTTPException

from app.schemas.generate import GenerateAdRequest, GenerateAdResponse
from app.services.copywriter import generate_ad_copy
from app.services.creatomate import create_video_ad
from app.services.supabase import get_supabase

router = APIRouter()


@router.post("", response_model=GenerateAdResponse)
async def generate_ad(payload: GenerateAdRequest):
    # Step 1: Generate headline + ad copy via OpenAI
    try:
        copy = await generate_ad_copy(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    headline = copy["headline"]
    ad_copy = copy["ad_copy"]

    # Step 2: Create video ad via Creatomate
    try:
        video_url = await create_video_ad(
            headline=headline,
            ad_copy=ad_copy,
            logo=payload.logo,
            colors=payload.colors,
            images=payload.images,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Video rendering failed: {e}")

    # Step 3: Auto-save to Supabase
    try:
        db = get_supabase()
        result = (
            db.table("ads")
            .insert({
                "url": payload.url,
                "headline": headline,
                "ad_copy": ad_copy,
                "video_url": video_url,
            })
            .execute()
        )
        saved = result.data[0]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to save ad: {e}")

    return saved
