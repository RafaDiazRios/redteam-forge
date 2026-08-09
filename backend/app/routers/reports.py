from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.models.database import get_db, Report, Engagement, Client, Artifact
from app.services.claude_service import get_claude_service
from app.services.report_service import get_report_service
from app.config import settings

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportGenerateRequest(BaseModel):
    engagement_id: int
    title: str
    target: Optional[str] = ""
    scan_output: Optional[str] = ""
    artifact_ids: Optional[List[int]] = []
    include_artifacts_output: Optional[bool] = True


@router.get("")
async def list_reports(engagement_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Report).order_by(Report.created_at.desc())
    if engagement_id:
        query = query.where(Report.engagement_id == engagement_id)
    result = await db.execute(query)
    reports = result.scalars().all()
    return [
        {
            "id": r.id, "engagement_id": r.engagement_id, "title": r.title,
            "executive_summary": (r.executive_summary or "")[:200],
            "severity_counts": r.severity_counts,
            "report_path": r.report_path,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reports
    ]


@router.get("/{report_id}")
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {
        "id": report.id,
        "engagement_id": report.engagement_id,
        "title": report.title,
        "executive_summary": report.executive_summary,
        "findings": report.findings,
        "recommendations": report.recommendations,
        "severity_counts": report.severity_counts,
        "report_path": report.report_path,
        "created_at": report.created_at.isoformat() if report.created_at else None
    }


@router.post("/generate")
async def generate_report(req: ReportGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Genera un reporte de vulnerabilidades automáticamente."""
    
    # Obtener engagement y cliente
    eng_result = await db.execute(select(Engagement).where(Engagement.id == req.engagement_id))
    engagement = eng_result.scalar_one_or_none()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement no encontrado")
    
    client_result = await db.execute(select(Client).where(Client.id == engagement.client_id))
    client = client_result.scalar_one_or_none()
    client_name = client.name if client else "Unknown Client"
    
    # Recopilar output de artefactos ejecutados
    artifact_output = ""
    if req.include_artifacts_output and req.artifact_ids:
        for art_id in req.artifact_ids:
            art_result = await db.execute(select(Artifact).where(Artifact.id == art_id))
            artifact = art_result.scalar_one_or_none()
            if artifact and artifact.execution_output:
                artifact_output += f"\n[{artifact.name} ({artifact.artifact_type})]:\n{artifact.execution_output}\n"
    
    # Generar análisis con Claude
    claude = get_claude_service()
    report_data = await claude.analyze_vulnerability(
        target=req.target or engagement.targets or "Unknown",
        scan_output=req.scan_output,
        artifact_output=artifact_output
    )
    
    # Generar PDF
    report_svc = get_report_service(settings.REPORTS_DIR)
    
    # Crear registro en DB primero para obtener ID
    report = Report(
        engagement_id=req.engagement_id,
        title=req.title,
        executive_summary=report_data.get("executive_summary", ""),
        findings=report_data.get("findings", []),
        recommendations=report_data.get("remediation_roadmap", []),
        severity_counts=report_data.get("severity_counts", {})
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # Generar PDF
    pdf_path = await report_svc.generate_pdf_report(
        engagement_name=engagement.name,
        client_name=client_name,
        report_data=report_data,
        report_id=report.id
    )
    
    report.report_path = pdf_path
    await db.commit()
    
    return {
        "id": report.id,
        "title": report.title,
        "executive_summary": report_data.get("executive_summary", "")[:500],
        "findings_count": len(report_data.get("findings", [])),
        "severity_counts": report_data.get("severity_counts", {}),
        "report_path": pdf_path,
        "message": "Reporte generado exitosamente"
    }


@router.get("/{report_id}/download")
async def download_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Descarga el PDF del reporte."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if not report.report_path or not os.path.exists(report.report_path):
        raise HTTPException(status_code=404, detail="Archivo de reporte no encontrado")
    
    return FileResponse(
        report.report_path,
        media_type="application/pdf",
        filename=f"report_{report.id}.pdf"
    )
