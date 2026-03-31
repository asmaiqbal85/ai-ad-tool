from fastapi import APIRouter, HTTPException

from app.schemas.ad import AdCreate, AdUpdate, AdResponse
from app.services.supabase import get_supabase

router = APIRouter()


@router.post("", response_model=AdResponse)
async def create_ad(payload: AdCreate):
    db = get_supabase()
    result = (
        db.table("ads")
        .insert({
            "url": str(payload.url),
            "headline": payload.headline,
            "ad_copy": payload.ad_copy,
            "video_url": payload.video_url,
        })
        .execute()
    )
    return result.data[0]


@router.get("")
async def list_ads():
    db = get_supabase()
    result = db.table("ads").select("*").order("created_at", desc=True).execute()
    return result.data


@router.get("/{ad_id}", response_model=AdResponse)
async def get_ad(ad_id: str):
    db = get_supabase()
    result = db.table("ads").select("*").eq("id", ad_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ad not found")
    return result.data[0]


@router.put("/{ad_id}", response_model=AdResponse)
async def update_ad(ad_id: str, payload: AdUpdate):
    db = get_supabase()
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("ads").update(update_data).eq("id", ad_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ad not found")
    return result.data[0]
