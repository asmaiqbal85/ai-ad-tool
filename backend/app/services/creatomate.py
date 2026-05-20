import asyncio
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CREATOMATE_API_KEY = os.getenv("CREATOMATE_API_KEY", "")
CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders"

POLL_INTERVAL_SECONDS = 3
POLL_TIMEOUT_SECONDS = 60

DARK_BG_FALLBACK = "#1a1a2e"
PLACEHOLD_URL_TEMPLATE = "https://placehold.co/1920x1080/{hex}/{hex}.png"
VALID_LOGO_EXTENSIONS = (".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico")


def _is_dark(hex_color: str) -> bool:
    """True if the hex color is dark enough to need white text (WCAG luminance)."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return True
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except ValueError:
        return True
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5


def _pick_bg_color(colors: list[str]) -> str:
    """First dark scraped brand color, else the dark-navy fallback."""
    for c in colors or []:
        if isinstance(c, str) and c.startswith("#") and _is_dark(c):
            return c
    return DARK_BG_FALLBACK


def _solid_color_bg_url(hex_color: str) -> str:
    """placehold.co URL serving a solid-color PNG at video resolution."""
    return PLACEHOLD_URL_TEMPLATE.format(hex=hex_color.lstrip("#"))


def _safe_logo_url(logo: str) -> str:
    """Return logo only if it looks like a reachable HTTPS image URL, else ''."""
    if not logo or not isinstance(logo, str):
        return ""
    if not logo.startswith("https://"):
        return ""
    lower = logo.lower().split("?")[0]
    last_segment = lower.rsplit("/", 1)[-1]
    if "." in last_segment:
        return logo if lower.endswith(VALID_LOGO_EXTENSIONS) else ""
    return logo


async def create_video_ad(
    headline: str,
    ad_copy: str,
    logo: str,
    colors: list[str],
    images: list[str],
    voiceover_url: str | None = None,
) -> str:
    """Call Creatomate API to render a video ad. Returns the video URL.

    `voiceover_url` is an optional MP3 URL — when provided, it overrides
    the template's `Voiceover` audio element. If the template does not
    expose that element, Creatomate silently ignores it and renders silent
    video, so this is safe to pass even before the template is updated.
    """
    # Background: real scraped image if available; otherwise a solid dark color
    # delivered as a placehold.co PNG (Creatomate's Background element expects
    # an image URL, so we can't send a hex code directly).
    if images:
        background_url = images[0]
        # With a real image we can't measure luminance — default to white text,
        # which works for the typical dark/overlay ad background.
        title_color = "#ffffff"
        text_color = "#ffffff"
    else:
        bg_color = _pick_bg_color(colors)
        background_url = _solid_color_bg_url(bg_color)
        title_color = "#ffffff" if _is_dark(bg_color) else "#1a1a2e"
        text_color = title_color

    # Element names must match EXACTLY the layer names in the template.
    # Dotted keys like `Title.fill_color` target element properties; silently
    # ignored by Creatomate if the template doesn't expose that override.
    modifications = {
        "Title": headline,
        "Text-1": ad_copy,
        "Text-2": "",
        "Logo": _safe_logo_url(logo),
        "Background": background_url,
        "Title.fill_color": title_color,
        "Text-1.fill_color": text_color,
    }

    if voiceover_url:
        modifications["Voiceover"] = voiceover_url

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
