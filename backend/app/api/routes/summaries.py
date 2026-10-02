from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas.chat import SummaryRequest, SummaryResponse
from app.services.summary_service import summarize_sop

router = APIRouter()


@router.post("/", response_model=SummaryResponse)
async def generate_summary(
    req: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    from app.models.sop_document import SOPDocument
    sop = await db.get(SOPDocument, req.sop_id)
    if not sop:
        raise HTTPException(404, "SOP not found")
    result = await summarize_sop(sop.id, sop.title, req.summary_type)
    return SummaryResponse(**result)
