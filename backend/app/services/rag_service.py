"""
RAG Service - Retrieval Augmented Generation sobre la base de conocimiento de ciberseguridad.
Indexa los 4 libros y permite búsqueda semántica para responder preguntas técnicas.
"""
import os
import json
import asyncio
from pathlib import Path
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# Lazy imports para evitar errores si las dependencias no están instaladas aún
_faiss = None
_embeddings = None
_vectorstore = None

def _get_faiss():
    global _faiss
    if _faiss is None:
        try:
            from langchain_community.vectorstores import FAISS
            _faiss = FAISS
        except ImportError:
            logger.warning("FAISS no disponible, usando búsqueda por texto simple")
    return _faiss

def _get_embeddings():
    """Devuelve el backend de embeddings para el RAG.

    Por defecto usa FastEmbed local (modelo ONNX, sin API key ni coste; se
    descarga una vez y luego funciona offline). Anthropic no ofrece un endpoint
    de embeddings, por lo que no se usa aquí. Si se define OPENAI_API_KEY (o
    EMBEDDINGS_PROVIDER=openai) se usa OpenAI en su lugar.
    """
    global _embeddings
    if _embeddings is not None:
        return _embeddings

    provider = os.getenv("EMBEDDINGS_PROVIDER", "").strip().lower()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    # OpenAI: solo si se pide explícitamente o hay una API key de OpenAI.
    if provider == "openai" or (provider == "" and openai_key):
        try:
            from langchain_openai import OpenAIEmbeddings
            model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            # openai_api_base opcional (p. ej. un gateway compatible con OpenAI).
            api_base = os.getenv("OPENAI_API_BASE", "").strip() or None
            _embeddings = OpenAIEmbeddings(
                openai_api_key=openai_key,
                openai_api_base=api_base,
                model=model,
            )
            logger.info("Embeddings: OpenAI (%s)", model)
            return _embeddings
        except Exception as e:
            logger.warning(f"OpenAI Embeddings no disponible, usando FastEmbed local: {e}")

    # Por defecto: FastEmbed local (sin API key, offline tras la descarga inicial).
    try:
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
        model_name = os.getenv("FASTEMBED_MODEL", "BAAI/bge-small-en-v1.5")
        _embeddings = FastEmbedEmbeddings(model_name=model_name)
        logger.info("Embeddings: FastEmbed local (%s)", model_name)
    except Exception as e:
        logger.warning(f"Embeddings locales no disponibles (fallback a búsqueda simple): {e}")
    return _embeddings


class SimpleTextSearch:
    """Búsqueda por texto simple como fallback cuando FAISS no está disponible."""
    
    def __init__(self):
        self.chunks = []
        self.metadata = []
    
    def add_texts(self, texts: List[str], metadatas: List[dict]):
        self.chunks.extend(texts)
        self.metadata.extend(metadatas)
    
    def similarity_search(self, query: str, k: int = 5) -> List[dict]:
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        scored = []
        for i, chunk in enumerate(self.chunks):
            chunk_lower = chunk.lower()
            score = sum(1 for w in query_words if w in chunk_lower)
            if score > 0:
                scored.append((score, i, chunk))
        
        scored.sort(reverse=True)
        results = []
        for score, idx, chunk in scored[:k]:
            results.append({
                "page_content": chunk,
                "metadata": self.metadata[idx] if idx < len(self.metadata) else {}
            })
        return results


class RAGService:
    def __init__(self, knowledge_base_dir: Path, index_dir: Path):
        self.knowledge_base_dir = knowledge_base_dir
        self.index_dir = index_dir
        self.vectorstore = None
        self.simple_search = SimpleTextSearch()
        self.use_faiss = False
        self._initialized = False
        self._init_lock = asyncio.Lock()

        # Mapeo de archivos a títulos de libros
        self.book_titles = {
            "malware_dev.txt": "Malware Development for Ethical Hackers (Zhussupov, 2024)",
            "advanced_python_cyber.txt": "Advanced Python for Cybersecurity (Jones, 2024)",
            "web_hacking_arsenal.txt": "Web Hacking Arsenal (Baloch, 2024)",
            "hack_is_back.txt": "The Hack Is Back (Varsalone & Haller, 2024)"
        }
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Divide el texto en chunks con overlap."""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            # Intentar cortar en un salto de línea
            if end < text_len:
                newline_pos = text.rfind('\n', start, end)
                if newline_pos > start + chunk_size // 2:
                    end = newline_pos
            
            chunk = text[start:end].strip()
            if len(chunk) > 100:  # Ignorar chunks muy pequeños
                chunks.append(chunk)
            # Al llegar al final, terminar. Sin esto, cuando end == text_len el
            # siguiente start = text_len - overlap se repite indefinidamente
            # (bucle infinito que agota la memoria).
            if end >= text_len:
                break
            start = end - overlap

        return chunks
    
    async def initialize(self):
        """Inicializa el sistema RAG indexando los libros.

        El trabajo pesado (I/O de archivos, chunking, embeddings y FAISS) es
        síncrono y bloqueante, por lo que se ejecuta en un hilo aparte con
        asyncio.to_thread para no bloquear el event loop. El lock evita que
        varias corrutinas construyan el índice a la vez.
        """
        if self._initialized:
            return

        async with self._init_lock:
            # Re-comprobar tras adquirir el lock por si otra corrutina ya inicializó.
            if self._initialized:
                return

            logger.info("Inicializando sistema RAG...")

            # Intentar cargar índice FAISS existente (en un hilo)
            faiss_path = self.index_dir / "index.faiss"
            if faiss_path.exists():
                try:
                    loaded = await asyncio.to_thread(self._load_index_sync)
                    if loaded:
                        self._initialized = True
                        logger.info("Índice FAISS cargado exitosamente.")
                        return
                except Exception as e:
                    logger.warning(f"No se pudo cargar índice FAISS: {e}")

            # Indexar desde cero (en un hilo)
            await asyncio.to_thread(self._build_index_sync)
            self._initialized = True

    def _load_index_sync(self) -> bool:
        """Carga un índice FAISS existente. Bloqueante: ejecutar en un hilo."""
        FAISS = _get_faiss()
        embeddings = _get_embeddings()
        if FAISS and embeddings:
            self.vectorstore = FAISS.load_local(
                str(self.index_dir),
                embeddings,
                allow_dangerous_deserialization=True
            )
            self.use_faiss = True
            return True
        return False

    def _build_index_sync(self):
        """Construye el índice desde los archivos de texto.

        Bloqueante (I/O de archivos, chunking, embeddings, FAISS): se ejecuta
        en un hilo aparte desde initialize() para no bloquear el event loop.
        """
        all_chunks = []
        all_metadata = []
        
        for filename, book_title in self.book_titles.items():
            file_path = self.knowledge_base_dir / filename
            if not file_path.exists():
                logger.warning(f"Archivo no encontrado: {file_path}")
                continue
            
            logger.info(f"Indexando: {book_title}")
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            
            chunks = self.chunk_text(text)
            logger.info(f"  -> {len(chunks)} chunks generados")
            
            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_metadata.append({
                    "source": book_title,
                    "filename": filename,
                    "chunk_id": i
                })
        
        logger.info(f"Total chunks: {len(all_chunks)}")
        
        # Intentar crear índice FAISS
        try:
            FAISS = _get_faiss()
            embeddings = _get_embeddings()
            if FAISS and embeddings and all_chunks:
                logger.info("Creando índice FAISS con embeddings...")
                # Procesar en lotes para no sobrecargar la API
                batch_size = 100
                texts_batch = all_chunks[:batch_size]
                meta_batch = all_metadata[:batch_size]
                
                self.vectorstore = FAISS.from_texts(texts_batch, embeddings, metadatas=meta_batch)
                
                for i in range(batch_size, len(all_chunks), batch_size):
                    batch = all_chunks[i:i+batch_size]
                    meta = all_metadata[i:i+batch_size]
                    self.vectorstore.add_texts(batch, metadatas=meta)
                    logger.info(f"  Procesado batch {i//batch_size + 1}")
                
                self.vectorstore.save_local(str(self.index_dir))
                self.use_faiss = True
                logger.info("Índice FAISS creado y guardado.")
                return
        except Exception as e:
            logger.warning(f"FAISS falló, usando búsqueda simple: {e}")
        
        # Fallback: búsqueda simple por texto
        self.simple_search.add_texts(all_chunks, all_metadata)
        logger.info("Índice de búsqueda simple creado.")
    
    async def search(self, query: str, k: int = 5) -> List[dict]:
        """Busca chunks relevantes para una consulta."""
        if not self._initialized:
            await self.initialize()
        
        try:
            if self.use_faiss and self.vectorstore:
                # similarity_search hace una llamada de embeddings + búsqueda
                # FAISS síncronas; ejecutarlas en un hilo mantiene libre el loop.
                docs = await asyncio.to_thread(self.vectorstore.similarity_search, query, k)
                return [{"content": d.page_content, "source": d.metadata.get("source", "Unknown")} for d in docs]
            else:
                results = await asyncio.to_thread(self.simple_search.similarity_search, query, k)
                return [{"content": r["page_content"], "source": r["metadata"].get("source", "Unknown")} for r in results]
        except Exception as e:
            logger.error(f"Error en búsqueda RAG: {e}")
            return []
    
    async def answer_question(self, question: str, claude_service) -> str:
        """Responde una pregunta usando RAG + Claude."""
        chunks = await self.search(question, k=5)
        
        if not chunks:
            context = "No se encontró información relevante en la base de conocimiento."
        else:
            context_parts = []
            for chunk in chunks:
                context_parts.append(f"[Fuente: {chunk['source']}]\n{chunk['content']}")
            context = "\n\n---\n\n".join(context_parts)
        
        prompt = f"""Eres un experto en ciberseguridad, hacking ético y desarrollo de malware. 
Tienes acceso a la siguiente información de libros especializados:

{context}

Basándote en esta información y en tu conocimiento experto, responde la siguiente pregunta de forma técnica y detallada:

Pregunta: {question}

Proporciona ejemplos de código cuando sea relevante. Si la información de los libros no cubre completamente el tema, complementa con tu conocimiento técnico."""
        
        return await claude_service.chat(prompt)


# Instancia global
_rag_service_instance = None

def get_rag_service(knowledge_base_dir: Path, index_dir: Path) -> RAGService:
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService(knowledge_base_dir, index_dir)
    return _rag_service_instance
