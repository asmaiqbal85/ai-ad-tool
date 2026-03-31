import os
import json
import re

import httpx
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

CF_API_URL = "https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/content"
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID", "")
CF_API_TOKEN = os.getenv("CF_API_TOKEN", "")


async def render_page(url: str) -> str:
    """Use Cloudflare Browser Rendering API to get fully-rendered HTML."""
    endpoint = CF_API_URL.format(account_id=CF_ACCOUNT_ID)
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {CF_API_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "url": url,
                "rejectResourceTypes": ["image"],
                "setExtraHTTPHeaders": {
                    "Accept-Language": "en-US,en;q=0.9",
                },
            },
        )
        resp.raise_for_status()

    data = resp.json()
    if isinstance(data, dict) and "result" in data:
        return data["result"]
    return resp.text


def extract_business_data(html: str, url: str) -> dict:
    """Parse rendered HTML and extract business info."""
    soup = BeautifulSoup(html, "html.parser")

    # --- Business name ---
    business_name = ""
    og_site = soup.find("meta", property="og:site_name")
    if og_site and og_site.get("content"):
        business_name = og_site["content"]
    elif soup.title and soup.title.string:
        raw = soup.title.string.strip()
        # Strip common separators to get the brand portion
        business_name = re.split(r"\s*[|\-–—:]\s*", raw)[0].strip()

    # --- Tagline ---
    tagline = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    og_desc = soup.find("meta", property="og:description")
    if og_desc and og_desc.get("content"):
        tagline = og_desc["content"].strip()
    elif meta_desc and meta_desc.get("content"):
        tagline = meta_desc["content"].strip()

    # --- Logo ---
    logo = ""
    # Check common logo patterns
    for selector in [
        {"attrs": {"class": re.compile(r"logo", re.I)}},
        {"attrs": {"id": re.compile(r"logo", re.I)}},
        {"attrs": {"alt": re.compile(r"logo", re.I)}},
    ]:
        tag = soup.find("img", **selector)
        if tag and tag.get("src"):
            logo = _resolve_url(tag["src"], url)
            break
    # Fallback: apple-touch-icon or favicon
    if not logo:
        link = soup.find("link", rel=lambda r: r and "apple-touch-icon" in r)
        if link and link.get("href"):
            logo = _resolve_url(link["href"], url)
    if not logo:
        link = soup.find("link", rel=lambda r: r and "icon" in r)
        if link and link.get("href"):
            logo = _resolve_url(link["href"], url)

    # --- Colors ---
    colors = _extract_colors(soup)

    # --- Images ---
    images = []
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        images.append(_resolve_url(og_image["content"], url))
    for img in soup.find_all("img", src=True):
        src = _resolve_url(img["src"], url)
        if src not in images and not _is_tracking_pixel(img):
            images.append(src)
        if len(images) >= 10:
            break

    return {
        "business_name": business_name,
        "tagline": tagline,
        "logo": logo,
        "colors": colors,
        "images": images,
    }


def _resolve_url(src: str, base_url: str) -> str:
    """Turn relative URLs into absolute ones."""
    if src.startswith("data:"):
        return ""
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        from urllib.parse import urlparse
        parsed = urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{src}"
    if not src.startswith("http"):
        return base_url.rstrip("/") + "/" + src
    return src


def _is_tracking_pixel(img_tag) -> bool:
    """Filter out 1x1 tracking pixels."""
    w = img_tag.get("width", "")
    h = img_tag.get("height", "")
    if w in ("0", "1") or h in ("0", "1"):
        return True
    return False


def _extract_colors(soup: BeautifulSoup) -> list[str]:
    """Extract brand colors from theme-color meta, inline styles, and CSS vars."""
    colors = set()

    # theme-color meta tag
    theme = soup.find("meta", attrs={"name": "theme-color"})
    if theme and theme.get("content"):
        colors.add(theme["content"].strip())

    # msapplication-TileColor
    tile = soup.find("meta", attrs={"name": "msapplication-TileColor"})
    if tile and tile.get("content"):
        colors.add(tile["content"].strip())

    # Scan inline styles and style tags for hex colors
    hex_pattern = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
    for style_tag in soup.find_all("style"):
        if style_tag.string:
            found = hex_pattern.findall(style_tag.string)
            colors.update(found[:20])  # cap to avoid noise

    # Dedupe, remove common defaults
    ignore = {"#fff", "#FFF", "#ffffff", "#FFFFFF", "#000", "#000000"}
    return sorted(c for c in colors if c not in ignore)[:10]
