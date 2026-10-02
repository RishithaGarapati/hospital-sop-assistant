from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.core.security import require_admin
from app.models.query_log import QueryLog
from app.models.sop_document import SOPDocument
from app.models.user import User

router = APIRouter()


@router.get("/overview")
async def analytics_overview(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    total_sops  = (await db.execute(select(func.count(SOPDocument.id)))).scalar()
    total_queries = (await db.execute(select(func.count(QueryLog.id)))).scalar()
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    avg_conf    = (await db.execute(select(func.avg(QueryLog.confidence)))).scalar()
    return {
        "total_sops": total_sops,
        "total_queries": total_queries,
        "total_users": total_users,
        "avg_confidence": round(avg_conf or 0, 1),
    }


@router.get("/top-sops")
async def top_sops(limit: int = 10, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(
        select(SOPDocument.title, SOPDocument.search_count)
        .order_by(SOPDocument.search_count.desc())
        .limit(limit)
    )
    return [{"title": r[0], "count": r[1]} for r in result]
