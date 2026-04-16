import asyncio
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CREATOMATE_API_KEY = os.getenv("CREATOMATE_API_KEY", "")
CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders"

POLL_INTERVAL_SECONDS = 3
POLL_TIMEOUT_SECONDS = 60


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

    # Build modifications for the Creatomate template.
    # Element names must match EXACTLY the layer names in the template.
    modifications = {
        "Title": headline,
        "Text-1": ad_copy,
        "Text-2": "",
        "Logo": logo or "",
        "Background": background_image,
    }

    payload = {
        "template_id": os.getenv(
            "CREATOMATE_TEMPLATE_ID",
            "5b1a4554-c334-4c23-bd03-26c7b5971543",
        ),
        "modifications": modifications,
    }

    headers = {
        "Authorization": f"Bearer {CREATOMATE_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            CREATOMATE_API_URL,
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        result = resp.json()

        # Creatomate returns a list of renders
        render = result[0]
        render_id = render["id"]

        # Poll until render is finished. The URL in the initial response
        # points to a file that does not exist yet — we must wait for
        # status === "succeeded" before returning it.
        max_attempts = POLL_TIMEOUT_SECONDS // POLL_INTERVAL_SECONDS
        status_url = f"{CREATOMATE_API_URL}/{render_id}"

        for _ in range(max_attempts):
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

            status_resp = await client.get(status_url, headers=headers)
            status_resp.raise_for_status()
            status_data = status_resp.json()
            status = status_data.get("status")

            if status == "succeeded":
                return status_data["url"]
            if status == "failed":
                raise RuntimeError(
                    f"Creatomate render failed: {render_id}"
                )
            # Otherwise: planned / waiting / transcribing / rendering — keep polling.

        raise TimeoutError(
            f"Creatomate render timed out after {POLL_TIMEOUT_SECONDS}s: {render_id}"
        )
