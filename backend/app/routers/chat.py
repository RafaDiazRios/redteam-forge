from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import json, uuid, asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.models.database import get_db, ChatMessage
from app.services.claude_service import get_claude_service
from app.services.rag_service import get_rag_service
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    engagement_id: Optional[int] = None
    mode: Optional[str] = "chat"  # chat, rag, codegen


class RAGRequest(BaseModel):
    question: str
    session_id: Optional[str] = None


@router.post("/message")
async def send_message(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Envía un mensaje al asistente y recibe respuesta."""
    
    session_id = req.session_id or str(uuid.uuid4())
    claude = get_claude_service()
    
    # Obtener historial de la sesión
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
    )
    history_msgs = history_result.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in history_msgs]
    
    # Guardar mensaje del usuario
    user_msg = ChatMessage(
        session_id=session_id,
        engagement_id=req.engagement_id,
        role="user",
        content=req.message,
        message_type=req.mode
    )
    db.add(user_msg)
    await db.commit()
    
    # Generar respuesta según modo
    if req.mode == "rag":
        rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
        response_text = await rag.answer_question(req.message, claude)
    else:
        response_text = await claude.chat(req.message, history=history)
    
    # Guardar respuesta del asistente
    assistant_msg = ChatMessage(
        session_id=session_id,
        engagement_id=req.engagement_id,
        role="assistant",
        content=response_text,
        message_type=req.mode
    )
    db.add(assistant_msg)
    await db.commit()
    
    return {
        "session_id": session_id,
        "response": response_text,
        "mode": req.mode
    }


@router.post("/rag")
async def rag_query(req: RAGRequest):
    """Consulta la base de conocimiento RAG."""
    rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
    claude = get_claude_service()
    
    # Inicializar RAG si no está listo
    if not rag._initialized:
        await rag.initialize()
    
    # Buscar chunks relevantes
    chunks = await rag.search(req.question, k=5)
    
    # Generar respuesta
    answer = await rag.answer_question(req.question, claude)
    
    return {
        "answer": answer,
        "sources": [{"content": c["content"][:300], "source": c["source"]} for c in chunks]
    }


@router.get("/history/{session_id}")
async def get_history(session_id: str, db: AsyncSession = Depends(get_db)):
    """Obtiene el historial de una sesión de chat."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "message_type": m.message_type,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/rag/initialize")
async def initialize_rag():
    """Inicializa/reconstruye el índice RAG."""
    rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
    rag._initialized = False
    rag.vectorstore = None
    await rag.initialize()
    return {"message": "RAG inicializado correctamente"}


@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket para chat en tiempo real con streaming."""
    await websocket.accept()
    claude = get_claude_service()
    
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            message = msg_data.get("message", "")
            mode = msg_data.get("mode", "chat")
            
            if mode == "rag":
                rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
                response = await rag.answer_question(message, claude)
                await websocket.send_text(json.dumps({"type": "message", "content": response}))
            else:
                # Streaming
                full_response = ""
                async for chunk in claude.stream_chat(message):
                    full_response += chunk
                    await websocket.send_text(json.dumps({"type": "chunk", "content": chunk}))
                
                await websocket.send_text(json.dumps({"type": "done", "content": full_response}))
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))
