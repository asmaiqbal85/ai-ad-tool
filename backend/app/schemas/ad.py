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


class AdRerenderRequest(BaseModel):
    headline: str
    ad_copy: str
    colors: list[str] = []
    logo: str = ""
    images: list[str] = []


class AdResponse(BaseModel):
    id: str
    url: str
    headline: str
    ad_copy: str
    video_url: str | None
    colors: list[str] = []
    logo: str = ""
    images: list[str] = []
    created_at: datetime
