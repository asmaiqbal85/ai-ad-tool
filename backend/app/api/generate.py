import logging
import os
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.schemas.generate import GenerateAdRequest, GenerateAdResponse
from app.services.auth import get_current_user
from app.services.copywriter import generate_ad_copy
from app.services.creatomate import create_video_ad
from app.services.quota import assert_can_create_ad
from app.services.storage import upload_voiceover
from app.services.supabase import get_supabase
from app.services.tts import synthesize

router = APIRouter()
log = logging.getLogger("generate")


@router.post("", response_model=GenerateAdResponse)
async def generate_ad(
    payload: GenerateAdRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Kick off generation in the background and return the ad id immediately.
    The full chain (OpenAI + TTS + Creatomate poll) routinely exceeds
    Cloudflare's ~100s edge timeout, so we never hold the request open.
    Frontend polls GET /api/ads/{id} until status is succeeded or failed."""
    await assert_can_create_ad(user)

    db = get_supabase()
    insert = (
        db.table("ads")
        .insert({
            "url": payload.url,
            "user_id": user.id,
            "colors": payload.colors,
            "logo": payload.logo,
            "images": payload.images,
            "status": "pending",
        })
        .execute()
    )
    if not insert.data:
        raise HTTPException(status_code=500, detail="Failed to create ad placeholder")
    ad_id = insert.data[0]["id"]

    background_tasks.add_task(
        _run_generation,
        ad_id=ad_id,
        payload=payload.model_dump(),
    )

    return {"id": ad_id, "status": "pending"}


async def _run_generation(ad_id: str, payload: dict) -> None:
    """Runs after the HTTP response is sent. The original client connection
    is already closed, so any error must be persisted to the ads row
    (status=failed, error=msg) — that's where the frontend will see it."""
    db = get_supabase()
    _set_status(db, ad_id, "processing")

    try:
        copy = await generate_ad_copy(payload)
        headline = copy["headline"]
        ad_copy = copy["ad_copy"]
    except Exception as e:
        log.exception("generate-ad copy failed for ad %s", ad_id)
        _set_failed(db, ad_id, f"AI generation failed: {e}")
        return

    try:
        mp3 = await synthesize(ad_copy, payload.get("voice", "alloy"))
        voiceover_url = await upload_voiceover(f"new-{secrets.token_hex(8)}", mp3)
    except Exception as e:
        log.exception("generate-ad voiceover failed for ad %s", ad_id)
        _set_failed(db, ad_id, f"Voiceover generation failed: {e}")
        return

    try:
        video_url = await create_video_ad(
            headline=headline,
            ad_copy=ad_copy,
            logo=payload.get("logo", ""),
            colors=payload.get("colors", []),
            images=payload.get("images", []),
            voiceover_url=voiceover_url,
        )
    except Exception as e:
        log.exception("generate-ad video render failed for ad %s", ad_id)
        _set_failed(db, ad_id, f"Video rendering failed: {e}")
        return

    template_id = os.getenv("CREATOMATE_TEMPLATE_ID", "")
    try:
        db.table("ads").update({
            "headline": headline,
            "ad_copy": ad_copy,
            "video_url": video_url,
            "voiceover_url": voiceover_url,
            "template_id": template_id,
            "status": "succeeded",
            "error": None,
        }).eq("id", ad_id).execute()
    except Exception as e:
        log.exception("generate-ad final save failed for ad %s", ad_id)
        _set_failed(db, ad_id, f"Failed to save ad: {e}")


def _set_status(db, ad_id: str, status: str) -> None:
    try:
        db.table("ads").update({"status": status}).eq("id", ad_id).execute()
    except Exception:
        log.exception("failed to set status=%s on ad %s", status, ad_id)


def _set_failed(db, ad_id: str, error: str) -> None:
    try:
        db.table("ads").update(
            {"status": "failed", "error": error}
        ).eq("id", ad_id).execute()
    except Exception:
        log.exception("failed to mark ad %s as failed", ad_id)
