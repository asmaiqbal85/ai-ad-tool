import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CREATOMATE_API_KEY = os.getenv("CREATOMATE_API_KEY", "")
CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders"


async def create_video_ad(
    headline: str,
    ad_copy: str,
    logo: str,
    colors: list[str],
    images: list[str],
) -> str:
    """Call Creatomate API to render a video ad. Returns the video URL."""
    primary_color = colors[0] if colors else "#1a73e8"
    background_image = images[0] if images else ""

    # Build modifications for a Creatomate template.
    # Uses dynamic element names that map to a template you configure
    # in the Creatomate dashboard.
    modifications = {
        "Headline": headline,
        "Body-Text": ad_copy,
        "Background-Color": primary_color,
    }
    if logo:
        modifications["Logo"] = logo
    if background_image:
        modifications["Background-Image"] = background_image

    payload = {
        "template_id": os.getenv("CREATOMATE_TEMPLATE_ID", ""),
        "modifications": modifications,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            CREATOMATE_API_URL,
            headers={
                "Authorization": f"Bearer {CREATOMATE_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()

    result = resp.json()
    # Creatomate returns a list of renders
    return result[0]["url"]
