from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.models.database import get_db, Artifact, Engagement
from app.services.claude_service import get_claude_service
from app.services.compiler_service import get_compiler_service
from app.config import settings

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])


class ArtifactGenerateRequest(BaseModel):
    engagement_id: int
    name: str
    description: str
    artifact_type: str  # malware, exploit, tool, payload, rat, keylogger, c2, etc.
    language: str
    target_info: Optional[str] = ""
    techniques: Optional[List[str]] = []
    auto_compile: Optional[bool] = True


class ArtifactExecuteRequest(BaseModel):
    args: Optional[List[str]] = []
    env_vars: Optional[dict] = {}
    timeout: Optional[int] = 30


@router.get("")
async def list_artifacts(engagement_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Artifact).order_by(Artifact.created_at.desc())
    if engagement_id:
        query = query.where(Artifact.engagement_id == engagement_id)
    result = await db.execute(query)
    artifacts = result.scalars().all()
    return [
        {
            "id": a.id, "engagement_id": a.engagement_id, "name": a.name,
            "description": a.description, "artifact_type": a.artifact_type,
            "language": a.language, "status": a.status,
            "compiled_path": a.compiled_path,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in artifacts
    ]


@router.get("/{artifact_id}")
async def get_artifact(artifact_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artefacto no encontrado")
    return {
        "id": artifact.id,
        "engagement_id": artifact.engagement_id,
        "name": artifact.name,
        "description": artifact.description,
        "artifact_type": artifact.artifact_type,
        "language": artifact.language,
        "source_code": artifact.source_code,
        "compiled_path": artifact.compiled_path,
        "status": artifact.status,
        "execution_output": artifact.execution_output,
        "execution_error": artifact.execution_error,
        "created_at": artifact.created_at.isoformat() if artifact.created_at else None
    }


@router.post("/generate")
async def generate_artifact(
    req: ArtifactGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Genera un artefacto ofensivo usando Claude."""
    
    # Obtener contexto del engagement
    eng_result = await db.execute(select(Engagement).where(Engagement.id == req.engagement_id))
    engagement = eng_result.scalar_one_or_none()
    
    engagement_context = ""
    if engagement:
        engagement_context = f"Engagement: {engagement.name}, Scope: {engagement.scope}, Targets: {engagement.targets}"
    
    claude = get_claude_service()
    
    # Generar artefacto
    result = await claude.generate_artifact(
        artifact_type=req.artifact_type,
        language=req.language,
        description=req.description,
        target_info=req.target_info,
        techniques=req.techniques,
        engagement_context=engagement_context
    )
    
    # Guardar en base de datos
    artifact = Artifact(
        engagement_id=req.engagement_id,
        name=req.name,
        description=req.description,
        artifact_type=req.artifact_type,
        language=req.language,
        source_code=result["source_code"],
        status="generated"
    )
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)
    
    response = {
        "id": artifact.id,
        "name": artifact.name,
        "source_code": result["source_code"],
        "full_response": result["full_response"],
        "status": "generated"
    }
    
    # Auto-compilar si se solicita
    if req.auto_compile:
        compiler = get_compiler_service(settings.ARTIFACTS_DIR)
        compile_result = await compiler.compile_artifact(
            artifact_id=artifact.id,
            source_code=result["source_code"],
            language=req.language,
            artifact_name=req.name
        )
        
        artifact.compiled_path = compile_result.get("compiled_path")
        artifact.status = "compiled" if compile_result["success"] else "compile_failed"
        await db.commit()
        
        response["compile_result"] = compile_result
        response["status"] = artifact.status
    
    return response


@router.post("/{artifact_id}/compile")
async def compile_artifact(artifact_id: int, db: AsyncSession = Depends(get_db)):
    """Compila un artefacto existente."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artefacto no encontrado")
    
    compiler = get_compiler_service(settings.ARTIFACTS_DIR)
    compile_result = await compiler.compile_artifact(
        artifact_id=artifact.id,
        source_code=artifact.source_code,
        language=artifact.language,
        artifact_name=artifact.name
    )
    
    artifact.compiled_path = compile_result.get("compiled_path")
    artifact.status = "compiled" if compile_result["success"] else "compile_failed"
    await db.commit()
    
    return compile_result


@router.post("/{artifact_id}/execute")
async def execute_artifact(
    artifact_id: int,
    req: ArtifactExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Ejecuta un artefacto compilado."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artefacto no encontrado")
    
    if not artifact.compiled_path:
        raise HTTPException(status_code=400, detail="El artefacto no está compilado")
    
    compiler = get_compiler_service(settings.ARTIFACTS_DIR)
    exec_result = await compiler.execute_artifact(
        compiled_path=artifact.compiled_path,
        language=artifact.language,
        artifact_name=artifact.name,
        args=req.args,
        env_vars=req.env_vars,
        timeout=req.timeout
    )
    
    artifact.execution_output = exec_result.get("stdout", "")
    artifact.execution_error = exec_result.get("stderr", "")
    artifact.status = "executed" if exec_result["success"] else "execution_failed"
    await db.commit()
    
    return {
        "success": exec_result["success"],
        "stdout": exec_result.get("stdout", ""),
        "stderr": exec_result.get("stderr", ""),
        "returncode": exec_result.get("returncode", -1)
    }


@router.put("/{artifact_id}/code")
async def update_artifact_code(
    artifact_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Actualiza el código fuente de un artefacto."""
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artefacto no encontrado")
    
    artifact.source_code = data.get("source_code", artifact.source_code)
    artifact.status = "generated"  # Reset status
    await db.commit()
    return {"message": "Código actualizado"}


@router.delete("/{artifact_id}")
async def delete_artifact(artifact_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(Artifact).where(Artifact.id == artifact_id))
    await db.commit()
    return {"message": "Artefacto eliminado"}


@router.get("/dependencies/check")
async def check_dependencies():
    """Verifica qué compiladores están disponibles."""
    compiler = get_compiler_service(settings.ARTIFACTS_DIR)
    deps = await compiler.check_dependencies()
    return deps
