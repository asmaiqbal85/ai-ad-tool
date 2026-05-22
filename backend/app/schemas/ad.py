from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl


class AdCreate(BaseModel):
    url: HttpUrl
    headline: str
    ad_copy: str
    video_url: str | None = None


class AdUpdate(BaseModel):
    headline: str | None = None
    ad_copy: str | None = None
    video_url: str | None = None


class AdRerenderRequest(BaseModel):
    headline: str
    ad_copy: str
    colors: list[str] = []
    logo: str = ""
    images: list[str] = []
    voice: Literal["alloy", "nova", "shimmer"] = "alloy"


AdStatus = Literal["pending", "processing", "succeeded", "failed"]


class AdResponse(BaseModel):
    id: str
    url: str
    headline: str | None = None
    ad_copy: str | None = None
    video_url: str | None = None
    colors: list[str] = []
    logo: str = ""
    images: list[str] = []
    template_id: str | None = None
    voiceover_url: str | None = None
    status: AdStatus = "succeeded"
    error: str | None = None
    created_at: datetime
