from fastapi import APIRouter, HTTPException

from app.schemas.scrape import ScrapeRequest, ScrapeResponse
from app.services.browser import render_page, extract_business_data

router = APIRouter()


@router.post("", response_model=ScrapeResponse)
async def scrape(payload: ScrapeRequest):
    url = str(payload.url)
    try:
        html = await render_page(url)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=502, detail=f"Failed to render page: {type(e).__name__}: {e}\n{traceback.format_exc()}")

    data = extract_business_data(html, url)
    return data
