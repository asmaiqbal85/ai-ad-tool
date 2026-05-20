import os
import secrets

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.generate import GenerateAdRequest, GenerateAdResponse
from app.services.auth import get_current_user
from app.services.copywriter import generate_ad_copy
from app.services.creatomate import create_video_ad
from app.services.quota import assert_can_create_ad
from app.services.storage import upload_voiceover
from app.services.supabase import get_supabase
from app.services.tts import synthesize

router = APIRouter()


@router.post("", response_model=GenerateAdResponse)
async def generate_ad(payload: GenerateAdRequest, user=Depends(get_current_user)):
    # Gate first so we don't burn OpenAI + Creatomate credits on a request
    # that's going to be paywalled at the end anyway.
    await assert_can_create_ad(user)

    # Step 1: Generate headline + ad copy via OpenAI
    try:
        copy = await generate_ad_copy(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    headline = copy["headline"]
    ad_copy = copy["ad_copy"]

    # Step 2: Generate voiceover MP3 and upload to Supabase Storage. The ad
    # row does not exist yet, so we use a random key under "new/"; the URL
    # is what gets persisted on the ad, not the storage key.
    try:
        mp3 = await synthesize(ad_copy, payload.voice)
        voiceover_url = await upload_voiceover(f"new-{secrets.token_hex(8)}", mp3)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Voiceover generation failed: {e}")

    # Step 3: Create video ad via Creatomate (voiceover baked in as audio track)
    try:
        video_url = await create_video_ad(
            headline=headline,
            ad_copy=ad_copy,
            logo=payload.logo,
            colors=payload.colors,
            images=payload.images,
            voiceover_url=voiceover_url,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Video rendering failed: {e}")

    # Step 4: Auto-save to Supabase, stamping the owner + template + voiceover.
    template_id = os.getenv("CREATOMATE_TEMPLATE_ID", "")
    try:
        db = get_supabase()
        result = (
            db.table("ads")
            .insert({
                "url": payload.url,
                "headline": headline,
                "ad_copy": ad_copy,
                "video_url": video_url,
                "colors": payload.colors,
                "logo": payload.logo,
                "images": payload.images,
                "user_id": user.id,
                "template_id": template_id,
                "voiceover_url": voiceover_url,
            })
            .execute()
        )
        saved = result.data[0]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to save ad: {e}")

    return saved
