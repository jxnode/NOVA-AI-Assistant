
import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


router = APIRouter(prefix="/voice", tags=["Voice"])

VOICE_ID = "pNInz6obpgDQGcFmaJgB"
ELEVENLABS_URL = (
    f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"
)

CHUNK_SIZE = 8192


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


def open_speech_stream(text: str, api_key: str):
    payload = {
        "text": text,
        "model_id": "eleven_flash_v2_5",
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

    return urlopen(request, timeout=60)


async def stream_audio(upstream):
    try:
        while True:
            chunk = await asyncio.to_thread(upstream.read, CHUNK_SIZE)
            if not chunk:
                break
            yield chunk
    finally:
        await asyncio.to_thread(upstream.close)


@router.post("/speak")
async def speak(request: SpeechRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice service is not configured.",
        )

    try:
        upstream = await asyncio.to_thread(
            open_speech_stream,
            request.text,
            api_key,
        )

        return StreamingResponse(
            stream_audio(upstream),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "X-Accel-Buffering": "no",
            },
        )

    except HTTPError as exc:
        try:
            provider_body = exc.read(2000).decode("utf-8", errors="replace")
        except Exception:
            provider_body = "(provider error body unavailable)"

        # Never print request headers or the API key.
        print(
            f"ElevenLabs HTTP error: status={exc.code}; "
            f"body={provider_body[:2000]}"
        )

        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail="ElevenLabs rate limit or quota reached. Check backend logs.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs returned HTTP {exc.code}. Check backend logs.",
        ) from exc

    except (URLError, TimeoutError, OSError) as exc:
        print(f"Voice connection error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Could not connect to ElevenLabs. Check backend logs.",
        ) from exc
