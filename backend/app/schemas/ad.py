from pydantic import BaseModel, HttpUrl
from datetime import datetime


class AdCreate(BaseModel):
    url: HttpUrl
    headline: str
    ad_copy: str
    video_url: str | None = None


class AdUpdate(BaseModel):
    headline: str | None = None
    ad_copy: str | None = None
    video_url: str | None = None


class AdResponse(BaseModel):
    id: str
    url: str
    headline: str
    ad_copy: str
    video_url: str | None
    created_at: datetime
