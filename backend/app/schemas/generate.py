from typing import Literal

from pydantic import BaseModel


class GenerateAdRequest(BaseModel):
    url: str = ""
    business_name: str
    tagline: str
    logo: str
    colors: list[str]
    images: list[str]
    voice: Literal["alloy", "nova", "shimmer"] = "alloy"


AdStatus = Literal["pending", "processing", "succeeded", "failed"]


class GenerateAdResponse(BaseModel):
    """Ack for POST /api/generate-ad. The actual render happens in the
    background; the frontend polls GET /api/ads/{id} until status is
    'succeeded' or 'failed'."""

    id: str
    status: AdStatus
