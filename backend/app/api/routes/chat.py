from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_query
from app.models.query_log import QueryLog

router = APIRouter()


@router.post("/query", response_model=ChatResponse)
async def query_sop(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty")

    result = await rag_query(
        question=req.question,
        category_filter=req.category_filter,
    )

    log = QueryLog(
        user_id=current_user.id,
        question=req.question,
        response=result["answer"],
        sources=[s.sop_id for s in result["sources"]],
        confidence=result["confidence"],
        response_time_ms=result["response_time_ms"],
        department=req.department,
    )
    db.add(log)
    await db.commit()

    return ChatResponse(**result)
