from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.models.database import get_db, Client, Engagement, Document

router = APIRouter(prefix="/api/clients", tags=["clients"])


class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class EngagementCreate(BaseModel):
    client_id: int
    name: str
    scope: Optional[str] = None
    targets: Optional[str] = None
    status: Optional[str] = "active"
    authorization_doc: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    clients = result.scalars().all()
    return [
        {
            "id": c.id, "name": c.name, "company": c.company,
            "email": c.email, "phone": c.phone, "notes": c.notes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in clients
    ]


@router.post("")
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    client = Client(**data.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return {"id": client.id, "name": client.name, "message": "Cliente creado"}


@router.put("/{client_id}")
async def update_client(client_id: int, data: ClientCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for k, v in data.model_dump().items():
        setattr(client, k, v)
    await db.commit()
    return {"message": "Cliente actualizado"}


@router.delete("/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Client).where(Client.id == client_id))
    await db.commit()
    return {"message": "Cliente eliminado"}


@router.get("/engagements")
async def list_all_engagements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Engagement).order_by(Engagement.created_at.desc()))
    engagements = result.scalars().all()
    return [
        {
            "id": e.id, "client_id": e.client_id, "name": e.name,
            "scope": e.scope, "targets": e.targets, "status": e.status,
            "notes": e.notes, "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in engagements
    ]


@router.get("/{client_id}/engagements")
async def list_engagements(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Engagement).where(Engagement.client_id == client_id).order_by(Engagement.created_at.desc())
    )
    engagements = result.scalars().all()
    return [
        {
            "id": e.id, "name": e.name, "scope": e.scope,
            "targets": e.targets, "status": e.status,
            "notes": e.notes, "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in engagements
    ]


@router.post("/engagements")
async def create_engagement(data: EngagementCreate, db: AsyncSession = Depends(get_db)):
    engagement = Engagement(**data.model_dump())
    db.add(engagement)
    await db.commit()
    await db.refresh(engagement)
    return {"id": engagement.id, "name": engagement.name, "message": "Engagement creado"}


@router.put("/engagements/{engagement_id}")
async def update_engagement(engagement_id: int, data: EngagementCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Engagement).where(Engagement.id == engagement_id))
    eng = result.scalar_one_or_none()
    if not eng:
        raise HTTPException(status_code=404, detail="Engagement no encontrado")
    for k, v in data.model_dump().items():
        setattr(eng, k, v)
    await db.commit()
    return {"message": "Engagement actualizado"}


@router.delete("/engagements/{engagement_id}")
async def delete_engagement(engagement_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Engagement).where(Engagement.id == engagement_id))
    await db.commit()
    return {"message": "Engagement eliminado"}
