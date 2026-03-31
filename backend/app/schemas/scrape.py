from pydantic import BaseModel, HttpUrl


class ScrapeRequest(BaseModel):
    url: HttpUrl


class ScrapeResponse(BaseModel):
    business_name: str
    tagline: str
    logo: str
    colors: list[str]
    images: list[str]
