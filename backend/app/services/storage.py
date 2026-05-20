import asyncio
import time

from app.services.supabase import get_supabase

BUCKET_NAME = "voiceovers"


async def upload_voiceover(ad_id: str, mp3_bytes: bytes) -> str:
    """Upload an MP3 voiceover to Supabase Storage. Returns a public URL.

    The `voiceovers` bucket must already exist with public read enabled.
    Files are written under {ad_id}/{ts}.mp3 so re-renders don't collide
    and old voiceovers stay reachable for any cached video URLs.
    """
    timestamp = int(time.time())
    path = f"{ad_id}/{timestamp}.mp3"

    def _upload() -> str:
        storage = get_supabase().storage.from_(BUCKET_NAME)
        storage.upload(
            path=path,
            file=mp3_bytes,
            file_options={"content-type": "audio/mpeg"},
        )
        return storage.get_public_url(path)

    return await asyncio.to_thread(_upload)
