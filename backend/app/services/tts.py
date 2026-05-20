from app.services.ai import client


async def synthesize(text: str, voice: str) -> bytes:
    """Generate an MP3 voiceover from text via OpenAI TTS.

    Voice must be one of OpenAI's tts-1 voices; routes validate the choice
    via a Literal type so this helper trusts the input.
    """
    response = await client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        response_format="mp3",
    )
    return response.content
