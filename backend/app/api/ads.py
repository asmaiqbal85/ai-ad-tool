from fastapi import APIRouter, Depends, HTTPException

from app.schemas.ad import AdCreate, AdUpdate, AdRerenderRequest, AdResponse
from app.services.auth import get_current_user
from app.services.creatomate import create_video_ad
from app.services.supabase import get_supabase

router = APIRouter()


@router.post("", response_model=AdResponse)
async def create_ad(payload: AdCreate, user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("ads")
        .insert({
            "url": str(payload.url),
            "headline": payload.headline,
            "ad_copy": payload.ad_copy,
            "video_url": payload.video_url,
            "user_id": user.id,
        })
        .execute()
    )
    return result.data[0]


@router.get("")
async def list_ads(user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{ad_id}", response_model=AdResponse)
async def get_ad(ad_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("ads")
        .select("*")
        .eq("id", ad_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Ad not found")
    return result.data[0]


@router.put("/{ad_id}", response_model=AdResponse)
async def update_ad(ad_id: str, payload: AdUpdate, user=Depends(get_current_user)):
    db = get_supabase()
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("ads")
        .update(update_data)
        .eq("id", ad_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Ad not found")
    return result.data[0]


@router.post("/{ad_id}/rerender", response_model=AdResponse)
async def rerender_ad(
    ad_id: str,
    payload: AdRerenderRequest,
    user=Depends(get_current_user),
):
    db = get_supabase()

    # Ensure the ad exists AND belongs to the caller before spending a render.
    existing = (
        db.table("ads")
        .select("*")
        .eq("id", ad_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Ad not found")

    try:
        video_url = await create_video_ad(
            headline=payload.headline,
            ad_copy=payload.ad_copy,
            logo=payload.logo,
            colors=payload.colors,
            images=payload.images,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Video re-rendering failed: {e}")

    try:
        result = (
            db.table("ads")
            .update({
                "headline": payload.headline,
                "ad_copy": payload.ad_copy,
                "video_url": video_url,
                "colors": payload.colors,
                "logo": payload.logo,
                "images": payload.images,
            })
            .eq("id", ad_id)
            .eq("user_id", user.id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to save ad: {e}")

    if not result.data:
        raise HTTPException(status_code=404, detail="Ad not found")
    return result.data[0]
