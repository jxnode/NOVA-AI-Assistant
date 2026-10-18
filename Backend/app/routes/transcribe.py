
import asyncio
import os

from fastapi import APIRouter, File, HTTPException, UploadFile
from groq import Groq

router = APIRouter(prefix="/transcribe", tags=["Transcription"])

MAX_AUDIO_SIZE = 20 * 1024 * 1024
ALLOWED_TYPES = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg;codecs=opus",
}

def transcribe_audio(audio_bytes: bytes, filename: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Speech transcription is not configured. Set GROQ_API_KEY.",
        )

    client = Groq(api_key=api_key)

    result = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model="whisper-large-v3-turbo",
        response_format="json",
        language="en",
    )

    return result.text.strip()


@router.post("/")
async def transcribe(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()

    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio format: {content_type or 'unknown'}",
        )

    audio_bytes = await file.read(MAX_AUDIO_SIZE + 1)

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio was recorded.")

    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Audio is too large. Record a shorter clip.",
        )

    filename = file.filename or "recording.webm"

    try:
        text = await asyncio.to_thread(
            transcribe_audio, audio_bytes, filename
        )
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Speech transcription failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Speech transcription failed. Check the Groq API configuration.",
        ) from exc
    finally:
        await file.close()

    return {"text": text}
