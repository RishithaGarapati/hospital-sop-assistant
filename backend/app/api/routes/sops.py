import os, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional

from app.db.database import get_db
from app.models.sop_document import SOPDocument, SOPStatus
from app.core.security import get_current_user, require_admin
from app.core.config import settings
from app.schemas.sop import SOPResponse, SOPListResponse, SOPUpdate
from app.services.document_processor import process_document

router = APIRouter()


async def _run_pipeline(sop_id: int, file_path: str, file_type: str, metadata: dict):
    from app.db.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            chunk_count = await process_document(sop_id, file_path, file_type, metadata)
            await db.execute(
                update(SOPDocument)
                .where(SOPDocument.id == sop_id)
                .values(status=SOPStatus.active, chunk_count=chunk_count)
            )
            await db.commit()
        except Exception:
            await db.execute(
                update(SOPDocument).where(SOPDocument.id == sop_id).values(status=SOPStatus.failed)
            )
            await db.commit()


@router.post("/", response_model=SOPResponse, status_code=201)
async def upload_sop(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    department: Optional[str] = Form(None),
    version: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type .{ext} not allowed.")
    dest = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    size_kb = os.path.getsize(dest) / 1024
    sop = SOPDocument(
        title=title, category=category, department=department,
        version=version, author=author, description=description,
        file_path=dest, file_name=file.filename, file_type=ext,
        file_size_kb=round(size_kb, 1), status=SOPStatus.processing,
        uploaded_by=current_user.id,
    )
    db.add(sop)
    await db.flush()
    await db.refresh(sop)
    await db.commit()
    metadata = {"title": title, "category": category, "department": department or "", "version": version or ""}
    background_tasks.add_task(_run_pipeline, sop.id, dest, ext, metadata)
    return sop


@router.get("/", response_model=SOPListResponse)
async def list_sops(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(SOPDocument)
    if category:
        q = q.where(SOPDocument.category == category)
    if search:
        q = q.where(SOPDocument.title.ilike(f"%{search}%"))
    q = q.offset(skip).limit(limit).order_by(SOPDocument.created_at.desc())
    result = await db.execute(q)
    items = result.scalars().all()
    return {"total": len(items), "items": items}


@router.get("/{sop_id}", response_model=SOPResponse)
async def get_sop(sop_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    sop = await db.get(SOPDocument, sop_id)
    if not sop:
        raise HTTPException(404, "SOP not found")
    return sop


@router.put("/{sop_id}", response_model=SOPResponse)
async def update_sop(sop_id: int, data: SOPUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    sop = await db.get(SOPDocument, sop_id)
    if not sop:
        raise HTTPException(404, "SOP not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(sop, field, value)
    await db.commit()
    await db.refresh(sop)
    return sop


@router.delete("/{sop_id}", status_code=204)
async def delete_sop(sop_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    from app.db.vector_store import delete_sop_chunks
    sop = await db.get(SOPDocument, sop_id)
    if not sop:
        raise HTTPException(404, "SOP not found")
    await delete_sop_chunks(sop_id)
    if os.path.exists(sop.file_path):
        os.remove(sop.file_path)
    await db.delete(sop)
    await db.commit()
