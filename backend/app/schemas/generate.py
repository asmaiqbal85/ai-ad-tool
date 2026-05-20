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


class GenerateAdResponse(BaseModel):
    id: str
    url: str
    video_url: str
    headline: str
    ad_copy: str
