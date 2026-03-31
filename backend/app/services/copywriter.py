import json

from app.services.ai import client


async def generate_ad_copy(data: dict) -> dict:
    """Generate headline + ad copy from scraped business data."""
    prompt = f"""You are an expert ad copywriter. Based on this business info, write ad copy.

Business name: {data['business_name']}
Tagline: {data['tagline']}

Return JSON with exactly these keys:
- headline: punchy ad headline, max 8 words
- ad_copy: compelling ad body text, 1-2 short sentences that drive action"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
