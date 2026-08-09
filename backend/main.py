"""
RedTeam Forge - Backend API
Plataforma de Ethical Hacking y Malware Development impulsada por IA
"""
import os
import sys
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Añadir el directorio del backend al path
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.models.database import init_db
from app.routers import clients, artifacts, chat, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización y limpieza de la aplicación."""
    logger.info("=" * 60)
    logger.info("  RedTeam Forge - Iniciando servidor...")
    logger.info("=" * 60)
    
    # Inicializar base de datos
    await init_db()
    logger.info("[OK] Base de datos inicializada")
    
    # Inicializar RAG en background (no bloquear el inicio)
    from app.services.rag_service import get_rag_service
    rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
    asyncio.create_task(rag.initialize())
    logger.info("[OK] RAG inicializando en background...")
    
    logger.info(f"[OK] API disponible en http://{settings.API_HOST}:{settings.API_PORT}")
    logger.info("[OK] RedTeam Forge listo para operar")
    
    yield
    
    logger.info("RedTeam Forge - Servidor detenido")


app = FastAPI(
    title="RedTeam Forge API",
    description="Plataforma avanzada de Ethical Hacking y Malware Development",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS - Permitir acceso desde el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(clients.router)
app.include_router(artifacts.router)
app.include_router(chat.router)
app.include_router(reports.router)


@app.get("/")
async def root():
    return {
        "name": "RedTeam Forge API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    from app.services.rag_service import get_rag_service
    rag = get_rag_service(settings.KNOWLEDGE_BASE_DIR, settings.FAISS_INDEX_DIR)
    
    return {
        "status": "healthy",
        "rag_initialized": rag._initialized,
        "rag_use_faiss": rag.use_faiss,
        "anthropic_key_set": bool(settings.ANTHROPIC_API_KEY),
        "artifacts_dir": str(settings.ARTIFACTS_DIR),
        "reports_dir": str(settings.REPORTS_DIR)
    }


@app.get("/api/tools")
async def list_tools():
    """Lista todas las herramientas y técnicas disponibles."""
    return {
        "artifact_types": [
            {"id": "rat", "name": "Remote Access Trojan (RAT)", "description": "Control remoto completo del sistema objetivo"},
            {"id": "keylogger", "name": "Keylogger", "description": "Captura de pulsaciones de teclado"},
            {"id": "ransomware", "name": "Ransomware", "description": "Cifrado de archivos para simulación de ataque"},
            {"id": "rootkit", "name": "Rootkit", "description": "Ocultación de procesos y archivos en el sistema"},
            {"id": "backdoor", "name": "Backdoor", "description": "Acceso persistente al sistema"},
            {"id": "c2", "name": "C2 Framework", "description": "Infraestructura de comando y control"},
            {"id": "exploit", "name": "Exploit", "description": "Explotación de vulnerabilidades específicas"},
            {"id": "payload", "name": "Payload", "description": "Carga útil para ejecución en objetivo"},
            {"id": "reverse_shell", "name": "Reverse Shell", "description": "Shell inverso para conexión remota"},
            {"id": "bind_shell", "name": "Bind Shell", "description": "Shell que escucha en el objetivo"},
            {"id": "web_shell", "name": "Web Shell", "description": "Shell web para servidores comprometidos"},
            {"id": "dropper", "name": "Dropper", "description": "Descargador e instalador de malware"},
            {"id": "stager", "name": "Stager", "description": "Cargador de etapas para payloads"},
            {"id": "av_bypass", "name": "AV/EDR Bypass", "description": "Técnicas de evasión de antivirus y EDR"},
            {"id": "privilege_escalation", "name": "Privilege Escalation", "description": "Escalada de privilegios"},
            {"id": "lateral_movement", "name": "Lateral Movement", "description": "Movimiento lateral en la red"},
            {"id": "exfiltration", "name": "Data Exfiltration", "description": "Exfiltración de datos"},
            {"id": "persistence", "name": "Persistence", "description": "Mecanismos de persistencia"},
            {"id": "recon", "name": "Reconnaissance Tool", "description": "Herramientas de reconocimiento"},
            {"id": "scanner", "name": "Vulnerability Scanner", "description": "Escáner de vulnerabilidades personalizado"},
            {"id": "fuzzer", "name": "Fuzzer", "description": "Fuzzing de aplicaciones"},
            {"id": "phishing", "name": "Phishing Framework", "description": "Framework de phishing y spear phishing"},
            {"id": "custom", "name": "Custom Tool", "description": "Herramienta personalizada"}
        ],
        "languages": [
            "Python", "C", "C++", "Go", "Rust", "PowerShell", "Bash",
            "JavaScript", "PHP", "Ruby", "Java", "C#", "Assembly"
        ],
        "techniques": {
            "evasion": [
                "Process Injection", "Process Hollowing", "DLL Injection", "Reflective Loading",
                "AMSI Bypass", "ETW Bypass", "Sandbox Detection", "VM Detection",
                "Timestomping", "Code Obfuscation", "Packing", "Encryption",
                "Living off the Land (LOLBins)", "Fileless Execution"
            ],
            "persistence": [
                "Registry Run Keys", "Scheduled Tasks", "WMI Subscriptions",
                "Startup Folder", "Service Installation", "Bootkit",
                "DLL Hijacking", "COM Hijacking", "Browser Extension"
            ],
            "c2_channels": [
                "HTTPS Beaconing", "DNS Tunneling", "ICMP Tunneling",
                "SMB Named Pipes", "Slack/Teams/Discord C2", "GitHub C2",
                "Cloud Storage C2", "Domain Fronting"
            ],
            "web_attacks": [
                "SQL Injection", "XSS (Reflected/Stored/DOM)", "SSRF", "XXE",
                "SSTI", "Deserialization", "Path Traversal", "File Upload",
                "OAuth Attacks", "JWT Attacks", "CORS Abuse", "CSRF",
                "HTTP Request Smuggling", "WebSockets Attacks"
            ],
            "network": [
                "ARP Spoofing", "DNS Poisoning", "SMB Relay", "LLMNR Poisoning",
                "Kerberoasting", "AS-REP Roasting", "Pass-the-Hash",
                "Pass-the-Ticket", "Golden Ticket", "Silver Ticket"
            ]
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
