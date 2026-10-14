import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.chat_service import generate_chat_response
from app.services.memory_service import (
    list_memories,
    delete_memory,
)

router = APIRouter()
logger = logging.getLogger("nova.chat.route")


# --------------------------------------------------
# Request models
# --------------------------------------------------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(
        min_length=1,
        max_length=2000,
    )


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=4000,
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=10,
    )


# --------------------------------------------------
# Chat endpoint
# --------------------------------------------------

@router.post("/chat")
def chat(request: ChatRequest):
    history = [
        item.model_dump()
        for item in request.history
    ]

    return StreamingResponse(
        generate_chat_response(
            request.message,
            history=history,
        ),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# --------------------------------------------------
# List saved memories
# --------------------------------------------------

@router.get("/memory")
def get_memory():
    try:
        return {
            "memories": list_memories(),
        }

    except Exception:
        logger.exception("Failed to retrieve saved memories")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve saved memories.",
        )


# --------------------------------------------------
# Delete a saved memory
# --------------------------------------------------

@router.delete("/memory/{memory_id}")
def remove_memory(memory_id: int):
    try:
        deleted = delete_memory(memory_id)

    except Exception:
        logger.exception("Failed to delete memory")

        raise HTTPException(
            status_code=500,
            detail="Could not delete the memory.",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Memory not found.",
        )

    return {
        "deleted": True,
        "id": memory_id,
    }