
import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field


router = APIRouter(prefix="/voice", tags=["Voice"])

VOICE_ID = "pNInz6obpgDQGcFmaJgB"
ELEVENLABS_URL = (
    f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


def generate_speech(text: str, api_key: str) -> bytes:
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.71,
            "similarity_boost": 0.85,
            "style": 0.4,
            "use_speaker_boost": True,
        },
    }

    request = Request(
        ELEVENLABS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        return response.read()


@router.post("/speak")
async def speak(request: SpeechRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice service is not configured.",
        )

    try:
        audio_data = await asyncio.to_thread(
            generate_speech, request.text, api_key
        )

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )

    except HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=502,
                detail="Voice provider authentication failed.",
            ) from exc

        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail="Voice provider rate limit reached.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail="Voice provider request failed.",
        ) from exc

    except (URLError, TimeoutError, OSError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Voice provider is temporarily unavailable.",
        ) from exc
