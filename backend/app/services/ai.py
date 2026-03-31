import os
import json

from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


async def generate_ad(page_data: dict) -> dict:
    """Generate ad copy from scraped page data."""
    prompt = f"""Based on this webpage content, generate advertising copy.

Title: {page_data['title']}
Description: {page_data['description']}
Content: {page_data['body_text']}

Return JSON with exactly these keys:
- headline: short punchy ad headline (max 10 words)
- body: compelling ad body text (1-2 sentences)
- cta: call-to-action button text (2-5 words)"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
