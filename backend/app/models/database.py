from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.config import settings

Base = declarative_base()

engine = create_async_engine(f"sqlite+aiosqlite:///{settings.DB_PATH}", echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    company = Column(String(200))
    email = Column(String(200))
    phone = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    engagements = relationship("Engagement", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")


class Engagement(Base):
    __tablename__ = "engagements"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String(300), nullable=False)
    scope = Column(Text)
    targets = Column(Text)  # JSON list of IP/domain targets
    status = Column(String(50), default="active")  # active, completed, paused
    authorization_doc = Column(Text)  # Path to authorization document
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    client = relationship("Client", back_populates="engagements")
    artifacts = relationship("Artifact", back_populates="engagement", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="engagement", cascade="all, delete-orphan")


class Artifact(Base):
    __tablename__ = "artifacts"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    name = Column(String(300), nullable=False)
    description = Column(Text)
    artifact_type = Column(String(100))  # malware, exploit, tool, payload, etc.
    language = Column(String(50))  # python, c, cpp, go, powershell, bash, etc.
    source_code = Column(Text)
    compiled_path = Column(String(500))
    status = Column(String(50), default="generated")  # generated, compiled, executed, failed
    execution_output = Column(Text)
    execution_error = Column(Text)
    artifact_metadata = Column("metadata", JSON)  # 'metadata' is reserved by SQLAlchemy's Declarative API
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    engagement = relationship("Engagement", back_populates="artifacts")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    title = Column(String(300), nullable=False)
    executive_summary = Column(Text)
    findings = Column(JSON)  # List of vulnerability findings
    recommendations = Column(JSON)  # List of remediation recommendations
    severity_counts = Column(JSON)  # {critical: N, high: N, medium: N, low: N}
    report_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    engagement = relationship("Engagement", back_populates="reports")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    name = Column(String(300), nullable=False)
    doc_type = Column(String(100))  # authorization, contract, scope, nda, etc.
    file_path = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    client = relationship("Client", back_populates="documents")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="chat")  # chat, rag, codegen
    created_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
