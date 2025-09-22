#!/usr/bin/env python3
"""
OneAgent Memory Server - Clean, unified implementation
- Env-first config
- Canonical embeddings via Node gateway (default), Gemini/local fallback
- Optional LLM processor (Gemini or OpenAI) with safe guards
- ChromaDB persistence
- FastAPI with MCP headers
"""

import os
import sys
import json
import ssl
import asyncio
import hashlib
import random
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union, cast
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Path, BackgroundTasks, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from urllib import request as urlrequest
from urllib.error import URLError, HTTPError

import chromadb
from chromadb.config import Settings

try:
    import google.generativeai as genai
except Exception:  # library optional
    genai = None  # type: ignore

# Load .env from repo root
from dotenv import load_dotenv
# Load env file based on ONEAGENT_ENV (env-first precedence). Defaults to .env for development.
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_ENV_NAME = os.environ.get('ONEAGENT_ENV', 'development').lower()
_ENV_FILE = '.env.production' if _ENV_NAME == 'production' else '.env'
load_dotenv(os.path.join(_ROOT, _ENV_FILE))

MCP_PROTOCOL_VERSION = "2025-06-18"
ONEAGENT_VERSION = os.getenv("ONEAGENT_VERSION", "0.0.0")
# Derive version from root package.json (canonical) unless explicitly overridden by env
try:
    _pkg_path = os.path.join(_ROOT, 'package.json')
    if os.path.exists(_pkg_path):
        with open(_pkg_path, 'r', encoding='utf-8') as _pf:
            _pkg_json = json.load(_pf)
            _pkg_ver = str(_pkg_json.get('version', '')).strip()
            if _pkg_ver:
                if os.getenv('ONEAGENT_VERSION') and os.getenv('ONEAGENT_VERSION') != _pkg_ver:
                    # Environment override explicit
                    logger = logging.getLogger("OneAgent.Memory")
                    logger.info(f"Environment ONEAGENT_VERSION override: pkg={_pkg_ver} env={os.getenv('ONEAGENT_VERSION')}")
                else:
                    ONEAGENT_VERSION = _pkg_ver
except Exception:
    # Non-fatal; keep existing value (could be env override or default)
    pass
MEM0_API_KEY = os.getenv("MEM0_API_KEY")

# Logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.FileHandler('oneagent_memory.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("OneAgent.Memory")

# Header dependency

def require_mcp_headers(
    Authorization: str = Header(None),
    mcp_protocol_version: str = Header(None, alias="MCP-Protocol-Version")
):
    if not Authorization or not Authorization.startswith("Bearer ") or Authorization.split(" ", 1)[1] != MEM0_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Invalid or missing Authorization header", "mcp_protocol_version": MCP_PROTOCOL_VERSION, "mcp_error_code": "unauthorized"})
    if mcp_protocol_version != MCP_PROTOCOL_VERSION:
        raise HTTPException(status_code=status.HTTP_426_UPGRADE_REQUIRED, detail={"error": f"MCP protocol version mismatch. Required: {MCP_PROTOCOL_VERSION}", "mcp_protocol_version": MCP_PROTOCOL_VERSION, "mcp_error_code": "protocol_version_mismatch"})

# Config

class MemoryConfig:
    def __init__(self):
        disable_gemini_flag = (os.getenv('ONEAGENT_DISABLE_GEMINI', '0') or '0').strip().lower()
        self.gemini_disabled = disable_gemini_flag in {'1','true','yes','y','on'}
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')

        self.host = os.getenv('MEMORY_HOST', '127.0.0.1')
        # Default to 8010 to align with OneAgent docs and prior configuration
        self.port = int(os.getenv('ONEAGENT_MEMORY_PORT', '8010'))
        # Consolidated canonical storage path
        # Configure via MEMORY_STORAGE_PATH; default to unified path under repo root
        self.storage_path = os.getenv('MEMORY_STORAGE_PATH', './oneagent_unified_memory')
        self.collection_name = os.getenv('MEMORY_COLLECTION', 'oneagent_memories')
        self.embedding_dimensions = 768
        self.search_similarity_threshold = float(os.getenv('MEMORY_SIMILARITY_THRESHOLD', '0.7'))

        self.embeddings_source = (os.getenv('ONEAGENT_EMBEDDINGS_SOURCE', 'node') or 'node').strip().lower()
        host = os.getenv('ONEAGENT_HOST', '127.0.0.1')
        mcp_port = int(os.getenv('ONEAGENT_MCP_PORT', '8083'))
        base_url = os.getenv('ONEAGENT_MCP_URL', f"http://{host}:{mcp_port}")
        if base_url.endswith('/mcp'):
            base_url = base_url[:-4]
        self.embeddings_url = base_url.rstrip('/') + '/api/v1/embeddings'

        # OpenAI Embeddings configuration (optional; used when ONEAGENT_EMBEDDINGS_SOURCE=openai)
        self.openai_embedding_model = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
        # If user selects OpenAI embeddings, default embedding dimensions accordingly (can be overridden)
        if self.embeddings_source == 'openai':
            try:
                self.embedding_dimensions = int(os.getenv('OPENAI_EMBED_DIM', '1536'))
            except Exception:
                self.embedding_dimensions = 1536

        # Cooldown to reduce log spam when gateway is unavailable (seconds)
        try:
            self.embeddings_gateway_cooldown_seconds = float(os.getenv('ONEAGENT_EMBEDDINGS_COOLDOWN_SECONDS', '5'))
        except Exception:
            self.embeddings_gateway_cooldown_seconds = 5.0

        # LLM provider
        self.llm_provider = None
        if not self.gemini_disabled and self.gemini_api_key:
            self.llm_provider = 'gemini'
        elif self.openai_api_key:
            self.llm_provider = 'openai'
        # Model names are canonical and not read from env to avoid parallel model selection via env

        logger.info(f"Embeddings source: {self.embeddings_source} -> {self.embeddings_url}")

a_config = MemoryConfig()

# Models

class UnifiedMetadata(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = "memory"
    version: Optional[str] = "1.0.0"
    temporal: Optional[Dict[str, Any]] = None
    system: Optional[Dict[str, Any]] = None
    quality: Optional[Dict[str, Any]] = None
    content: Optional[Dict[str, Any]] = None
    relationships: Optional[Dict[str, Any]] = None
    analytics: Optional[Dict[str, Any]] = None

class MemoryCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000)
    user_id: str = Field(..., alias="userId")
    metadata: Optional[UnifiedMetadata] = None
    class Config:
        populate_by_name = True

class MemorySearchRequest(BaseModel):
    query: Optional[str] = None
    user_id: str = Field(..., alias="userId")
    limit: Optional[int] = Field(default=10, ge=1, le=500)
    class Config:
        populate_by_name = True

class MemoryResponse(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]
    userId: str
    createdAt: str
    updatedAt: str
    relevanceScore: Optional[float] = None

class MemoryOperationResponse(BaseModel):
    success: bool
    data: Optional[Union[MemoryResponse, List[MemoryResponse], Dict[str, Any]]] = None
    message: Optional[str] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# LLM helper

class LLMMemoryProcessor:
    def __init__(self, provider: str, gemini_api_key: str = "", openai_api_key: str = "", gemini_model: str = "gemini-1.5-flash", openai_model: str = "gpt-4o-mini"):
        self.provider = provider
        self.gemini_api_key = gemini_api_key
        self.openai_api_key = openai_api_key
        self.gemini_model = gemini_model
        self.openai_model = openai_model
        self._gemini_ready = False
        if provider == 'gemini' and gemini_api_key and genai is not None:
            try:
                _configure = getattr(genai, 'configure', None)
                if callable(_configure):
                    _configure(api_key=gemini_api_key)
                    self._gemini_ready = True
                else:
                    self._gemini_ready = False
            except Exception:
                self._gemini_ready = False

    async def _generate_text(self, prompt: str) -> str:
        if self.provider == 'gemini' and self._gemini_ready and genai is not None:
            def _call() -> str:
                try:
                    _model_cls = getattr(genai, 'GenerativeModel', None)
                    if _model_cls is None:
                        return ''
                    model = _model_cls(self.gemini_model)
                    resp = model.generate_content(prompt)
                    return getattr(resp, 'text', '') or ''
                except Exception:
                    return ''
            return await asyncio.to_thread(_call)
        if self.provider == 'openai' and self.openai_api_key:
            import urllib.request as _req
            def _call() -> str:
                try:
                    url = 'https://api.openai.com/v1/chat/completions'
                    body = json.dumps({
                        'model': self.openai_model,
                        'messages': [
                            {'role': 'system', 'content': 'Return concise JSON when asked.'},
                            {'role': 'user', 'content': prompt}
                        ],
                        'temperature': 0.2,
                    }).encode('utf-8')
                    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.openai_api_key}'}
                    req = _req.Request(url, data=body, headers=headers, method='POST')
                    with _req.urlopen(req, timeout=15) as r:
                        data = json.loads(r.read().decode('utf-8'))
                        return (((data.get('choices') or [{}])[0].get('message') or {}).get('content')) or ''
                except Exception:
                    return ''
            return await asyncio.to_thread(_call)
        return ''

    @staticmethod
    def _parse_json_array(text: str) -> List[Any]:
        try:
            t = text.strip()
            if t.startswith('```'):
                t = t.strip('`')
                if t.startswith('json'):
                    t = t[4:]
            t = t.strip()
            if t.startswith('[') and t.endswith(']'):
                return json.loads(t)
            l = t.find('['); r = t.rfind(']')
            if l != -1 and r != -1 and r > l:
                return json.loads(t[l:r+1])
        except Exception:
            pass
        return []

    async def extract_facts(self, content: str) -> List[str]:
        prompt = (
            "Extract key facts and information from the following content. Return a JSON array of strings.\n\n"
            f"Content: {content}\n\n"
            "Return ONLY a valid JSON array, nothing else."
        )
        text = await self._generate_text(prompt)
        facts = self._parse_json_array(text)
        if not facts:
            return [content[:500]] if len(content) > 20 else []
        return [str(f) for f in facts if f and len(str(f).strip()) > 10][:10]

    async def resolve_memory_conflicts(self, new_facts: List[str], existing_memories: List[Dict]) -> List[Dict]:
        if not existing_memories:
            return [{"action": "ADD", "text": f, "reasoning": "No conflicts"} for f in new_facts]
        prompt = (
            "For each new fact decide ADD/UPDATE/DELETE/SKIP compared to existing memories. Return JSON array.\n\n"
            f"NEW FACTS: {json.dumps(new_facts)}\n\n"
            f"EXISTING: {json.dumps([{'content': m.get('content',''), 'id': m.get('id'), 'similarity': m.get('similarity',0)} for m in existing_memories])}\n"
            "Return ONLY a JSON array."
        )
        text = await self._generate_text(prompt)
        actions = self._parse_json_array(text)
        if not actions:
            return [{"action": "ADD", "text": f, "reasoning": "LLM unavailable"} for f in new_facts]
        return actions

# Memory system

class OneAgentMemorySystem:
    def __init__(self):
        self.use_node_gateway = (a_config.embeddings_source == 'node')
        self.openai_enabled = (a_config.embeddings_source == 'openai') and bool(a_config.openai_api_key)
        self.gemini_enabled = (not a_config.gemini_disabled) and bool(a_config.gemini_api_key) and genai is not None
        if self.use_node_gateway:
            self.embedding_model = 'oneagent-node-gateway'
        elif self.openai_enabled:
            self.embedding_model = f"openai:{a_config.openai_embedding_model}"
        elif self.gemini_enabled:
            self.embedding_model = 'gemini-embedding-001'
        else:
            self.embedding_model = 'local-hash-embedding'
        # LLM
        if a_config.llm_provider:
            self.llm_processor = LLMMemoryProcessor(
                provider=a_config.llm_provider,
                gemini_api_key=str(a_config.gemini_api_key or ''),
                openai_api_key=str(a_config.openai_api_key or ''),
            )
        else:
            self.llm_processor = None
        # Chroma
        self.client = chromadb.PersistentClient(
            path=a_config.storage_path,
            settings=Settings(anonymized_telemetry=False, allow_reset=False, is_persistent=True)
        )
        self.collection = self.client.get_or_create_collection(
            name=a_config.collection_name,
            metadata={"description": "OneAgent Memory", "embedding_model": self.embedding_model, "dimensions": a_config.embedding_dimensions, "created_at": datetime.now(timezone.utc).isoformat()}
        )
        self._embedding_cache: Dict[str, List[float]] = {}
        # Cooldown window for gateway failures
        self._gateway_cooldown_until: float = 0.0
        self._gateway_cooldown_seconds: float = float(getattr(a_config, 'embeddings_gateway_cooldown_seconds', 5.0))

    def _local_embedding(self, text: str) -> List[float]:
        seed = int(hashlib.sha256(text.encode('utf-8')).hexdigest()[:16], 16)
        rng = random.Random(seed)
        return [rng.uniform(-0.5, 0.5) for _ in range(a_config.embedding_dimensions)]

    async def generate_embedding(self, text: str, action: str = 'add') -> List[float]:
        key = f"{self.embedding_model}:{action}:{hashlib.sha256(text.encode('utf-8')).hexdigest()}"
        if key in self._embedding_cache:
            return self._embedding_cache[key]
        # Direct OpenAI embeddings path when configured
        if self.openai_enabled:
            try:
                import urllib.request as _req
                url = 'https://api.openai.com/v1/embeddings'
                body = json.dumps({
                    'input': text,
                    'model': a_config.openai_embedding_model,
                }).encode('utf-8')
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {a_config.openai_api_key}',
                }
                def _call():
                    req = _req.Request(url, data=body, headers=headers, method='POST')
                    with _req.urlopen(req, timeout=15) as r:
                        return r.read()
                raw = await asyncio.to_thread(_call)
                data = json.loads(raw.decode('utf-8'))
                emb = None
                try:
                    emb = (((data.get('data') or [])[0] or {}).get('embedding'))
                except Exception:
                    emb = None
                if isinstance(emb, list):
                    # Normalize to configured dimensions
                    if len(emb) > a_config.embedding_dimensions:
                        emb = emb[:a_config.embedding_dimensions]
                    elif len(emb) < a_config.embedding_dimensions:
                        emb = emb + [0.0]*(a_config.embedding_dimensions - len(emb))
                    self._embedding_cache[key] = emb
                    return emb
            except Exception as e:
                logger.warning(f"OpenAI embedding failed: {e}")
        if self.use_node_gateway:
            # Respect cooldown to avoid repeated noisy logs when gateway is down
            now = time.time()
            if now < self._gateway_cooldown_until:
                # Skip gateway attempt during cooldown
                pass
            else:
                for attempt in range(2):
                    try:
                        payload = json.dumps({"content": text, "action": action}).encode('utf-8')
                        headers = {'Content-Type': 'application/json', 'Accept': 'application/json', 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION}
                        req = urlrequest.Request(a_config.embeddings_url, data=payload, headers=headers, method='POST')
                        def _call():
                            with urlrequest.urlopen(req, timeout=10) as r:
                                return r.read()
                        raw = await asyncio.to_thread(_call)
                        data = json.loads(raw.decode('utf-8'))
                        emb = (data.get('data') or {}).get('embedding')
                        if isinstance(emb, list):
                            if len(emb) > a_config.embedding_dimensions:
                                emb = emb[:a_config.embedding_dimensions]
                            elif len(emb) < a_config.embedding_dimensions:
                                emb = emb + [0.0]*(a_config.embedding_dimensions - len(emb))
                            self._embedding_cache[key] = emb
                            # Clear cooldown on success
                            self._gateway_cooldown_until = 0.0
                            return emb
                    except Exception as e:
                        if attempt == 0:
                            logger.warning(f"Gateway embedding failed (will retry): {e}")
                            await asyncio.sleep(0.25)
                        else:
                            logger.warning(f"Gateway embedding failed: {e}")
                            # Enter cooldown window after final failure
                            self._gateway_cooldown_until = time.time() + self._gateway_cooldown_seconds
        if self.gemini_enabled and genai is not None:
            try:
                task_type = {'add':'retrieval_document','search':'retrieval_query','update':'retrieval_document'}.get(action, 'retrieval_document')
                _embed_fn = getattr(genai, 'embed_content', None)
                if not callable(_embed_fn):
                    raise RuntimeError('embed_content not available')
                res = _embed_fn(model='gemini-embedding-001', content=text, task_type=task_type)
                emb = res['embedding'] if isinstance(res, dict) else getattr(res, 'embedding', None)
                if isinstance(emb, list):
                    if len(emb) != a_config.embedding_dimensions:
                        raise ValueError('Embedding dimension mismatch')
                    self._embedding_cache[key] = emb
                    return emb
            except Exception as e:
                logger.warning(f"Gemini embedding failed: {e}")
        emb = self._local_embedding(text)
        self._embedding_cache[key] = emb
        return emb

    async def _create_single_memory(self, content: str, user_id: str, metadata: Optional[UnifiedMetadata], reasoning: str = "") -> str:
        memory_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        md: Dict[str, Any] = {}
        if metadata:
            md_src = metadata.model_dump()
            md.update({
                "memoryId": md_src.get("id", memory_id),
                "type": md_src.get("type", "memory"),
                "version": md_src.get("version", "1.0.0"),
                "userId": (md_src.get("system") or {}).get("userId", user_id),
                "sessionId": (md_src.get("system") or {}).get("sessionId"),
                "source": (md_src.get("system") or {}).get("source", "OneAgent"),
                "component": (md_src.get("system") or {}).get("component", "memory-system"),
                "category": (md_src.get("content") or {}).get("category", "general"),
                "tags": (md_src.get("content") or {}).get("tags", []),
                "sensitivity": (md_src.get("content") or {}).get("sensitivity", "internal"),
                "relevanceScore": (md_src.get("content") or {}).get("relevanceScore", 0.5),
                "contextDependency": (md_src.get("content") or {}).get("contextDependency", "session"),
                "qualityScore": (md_src.get("quality") or {}).get("score", 0.8),
                "constitutionallyValidated": (md_src.get("quality") or {}).get("constitutionalCompliant", False),
                "validationLevel": (md_src.get("quality") or {}).get("validationLevel", "basic"),
                "confidence": (md_src.get("quality") or {}).get("confidence", 0.8),
                "createdAt": ((md_src.get("temporal") or {}).get("created") or {}).get("iso", now),
                "updatedAt": ((md_src.get("temporal") or {}).get("updated") or {}).get("iso", now),
                "accessCount": (md_src.get("analytics") or {}).get("accessCount", 0),
                "lastAccessPattern": (md_src.get("analytics") or {}).get("lastAccessPattern", "created"),
                "usageContext": (md_src.get("analytics") or {}).get("usageContext", []),
            })
        else:
            md.update({"userId": user_id, "type": "memory", "category": "general", "source": "OneAgent"})
        # Normalize types for Chroma
        for k,v in list(md.items()):
            if isinstance(v, list):
                md[k] = ",".join(str(i) for i in v)
            elif v is None:
                md[k] = ""
        md.update({
            "createdAt": now,
            "updatedAt": now,
            "memoryType": md.get("memoryType", "long_term"),
            "contentHash": hashlib.md5(content.encode()).hexdigest(),
            "contentLength": str(len(content)),
            "wordCount": str(len(content.split())),
            "processingReasoning": reasoning,
            "intelligentlyProcessed": "true",
        })
        emb = await self.generate_embedding(content, 'add')
        self.collection.add(embeddings=[emb], documents=[content], metadatas=[md], ids=[memory_id])
        return memory_id

    async def create_memory(self, request: MemoryCreateRequest) -> MemoryResponse:
        md = request.metadata
        memory_id = await self._create_single_memory(request.content, request.user_id, md, "Original user input")
        now = datetime.now(timezone.utc).isoformat()
        return MemoryResponse(
            id=memory_id,
            content=request.content,
            metadata={"userId": request.user_id, "createdAt": now, "updatedAt": now},
            userId=request.user_id,
            createdAt=now,
            updatedAt=now,
        )

    async def _update_single_memory(self, memory_id: str, new_content: str, user_id: str, reasoning: str = ""):
        now = datetime.now(timezone.utc).isoformat()
        existing = self.collection.get(ids=[memory_id], where={"userId": user_id})
        if not existing.get('ids'):
            raise ValueError("Memory not found or access denied")
        md = dict((existing.get('metadatas') or [{}])[0] or {})
        md.update({
            "updatedAt": now,
            "contentHash": hashlib.md5(new_content.encode()).hexdigest(),
            "contentLength": str(len(new_content)),
            "wordCount": str(len(new_content.split())),
            "updateReasoning": reasoning,
            "intelligentlyUpdated": "true",
        })
        emb = await self.generate_embedding(new_content, 'update')
        self.collection.update(ids=[memory_id], embeddings=[emb], documents=[new_content], metadatas=[md])

    async def search_memories(self, request: MemorySearchRequest) -> List[MemoryResponse]:
        if request.query:
            q_emb = await self.generate_embedding(request.query, 'search')
            res = self.collection.query(query_embeddings=[q_emb], n_results=int(request.limit or 10), where={"userId": request.user_id})
        else:
            res = self.collection.get(where={"userId": request.user_id}, limit=int(request.limit or 10))
        out: List[MemoryResponse] = []
        # Normalize shapes from Chroma (query vs get)
        ids_val = res.get('ids') or []
        docs_val = res.get('documents') or []
        metas_val = res.get('metadatas') or []
        dists_val = res.get('distances') or []
        # If nested, take the first list
        if isinstance(ids_val, list) and ids_val and isinstance(ids_val[0], list):
            ids_seq = ids_val[0] or []
            docs_seq = (docs_val[0] if isinstance(docs_val, list) and docs_val else []) or []
            metas_seq = (metas_val[0] if isinstance(metas_val, list) and metas_val else []) or []
            dists_seq = (dists_val[0] if isinstance(dists_val, list) and dists_val else []) or []
        else:
            ids_seq = ids_val if isinstance(ids_val, list) else [ids_val]
            docs_seq = docs_val if isinstance(docs_val, list) else [docs_val]
            metas_seq = metas_val if isinstance(metas_val, list) else ([metas_val] if metas_val else [])
            dists_seq = dists_val if isinstance(dists_val, list) else ([dists_val] if dists_val is not None else [])
        # Build responses
        for i in range(len(ids_seq)):
            mid = ids_seq[i]
            content = docs_seq[i] if i < len(docs_seq) else ""
            # Ensure type for static analysis and safe access
            metas_seq_t = cast(List[Dict[str, Any]], metas_seq if isinstance(metas_seq, list) else [])
            meta_raw = metas_seq_t[i] if i < len(metas_seq_t) else {}
            meta: Dict[str, Any] = {str(k): v for k, v in (meta_raw.items() if isinstance(meta_raw, dict) else [])}
            # Distance handling (could be float or nested list)
            rel = None
            if i < len(dists_seq):
                dv = dists_seq[i]
                if isinstance(dv, (int, float)):
                    rel = 1.0 - float(dv)
                elif isinstance(dv, list) and dv and isinstance(dv[0], (int, float)):
                    rel = 1.0 - float(dv[0])
            out.append(MemoryResponse(
                id=str(mid),
                content=str(content),
                metadata=meta,
                userId=str(meta.get('userId', request.user_id)),
                createdAt=str(meta.get('createdAt', '')),
                updatedAt=str(meta.get('updatedAt', '')),
                relevanceScore=rel
            ))
        return out

    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        res = self.collection.get(ids=[memory_id], where={"userId": user_id})
        if not res.get('ids'):
            raise HTTPException(status_code=404, detail="Memory not found or access denied")
        self.collection.delete(ids=[memory_id])
        return True

    async def deduplicate_memories(self, user_id: str) -> Dict[str, int]:
        all_mem = self.collection.get(where={"userId": user_id})
        ids = all_mem.get('ids') or []
        if not ids:
            return {"removed": 0, "total": 0, "remaining": 0}
        seen = set(); removed = 0
        for i, mid in enumerate(ids):
            md = (all_mem.get('metadatas') or [])
            md_i = md[i] if md and len(md) > i and isinstance(md[i], dict) else {}
            ch = md_i.get('contentHash')
            if ch in seen:
                self.collection.delete(ids=[mid]); removed += 1
            else:
                seen.add(ch)
        total = len(ids)
        return {"removed": removed, "total": total, "remaining": total - removed}

    async def get_memory_statistics(self, user_id: str) -> Dict[str, Any]:
        user_mem = self.collection.get(where={"userId": user_id})
        ids = user_mem.get('ids') or []
        if not ids:
            return {"total": 0, "types": {}, "avgLength": 0}
        total = len(ids); total_len = 0; types: Dict[str,int] = {}
        for md in (user_mem.get('metadatas') or []):
            md_dict = md or {}
            mtype = str(md_dict.get('memoryType', 'unknown'))
            types[mtype] = int(types.get(mtype, 0)) + 1
            try:
                total_len += int(str(md_dict.get('contentLength', '0')))
            except Exception:
                pass
        return {"total": total, "types": types, "avgLength": (total_len/total if total else 0)}

    def get_stats(self) -> Dict[str, Any]:
        total = self.collection.count()
        return {
            "total_memories": total,
            "collection_name": a_config.collection_name,
            "storage_path": a_config.storage_path,
            "embedding_model": self.embedding_model,
            "dimensions": a_config.embedding_dimensions,
            "uptime": "operational",
            "version": f"{ONEAGENT_VERSION}-Clean",
        }

# FastAPI app

app = FastAPI(title="OneAgent Memory Server", version=ONEAGENT_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

memory_system = OneAgentMemorySystem()

@app.get("/health", response_model=MemoryOperationResponse)
async def health_check():
    return MemoryOperationResponse(success=True, data=memory_system.get_stats(), message="OneAgent Memory Server - Operational")

@app.post("/v1/memories", response_model=MemoryOperationResponse)
async def create_memory(req: MemoryCreateRequest, deps=Depends(require_mcp_headers)):
    mem = await memory_system.create_memory(req)
    return MemoryOperationResponse(success=True, data=mem, message="Memory created successfully")

@app.get("/v1/memories", response_model=MemoryOperationResponse)
async def search_memories(userId: str = Query(...), query: Optional[str] = Query(None), limit: int = Query(10, ge=1, le=500), deps=Depends(require_mcp_headers)):
    res = await memory_system.search_memories(MemorySearchRequest(userId=userId, query=query, limit=limit))
    return MemoryOperationResponse(success=True, data=res, message=f"Retrieved {len(res)} memories")

@app.put("/v1/memories/{memory_id}", response_model=MemoryOperationResponse)
async def update_memory(memory_id: str, req: MemoryCreateRequest, deps=Depends(require_mcp_headers)):
    await memory_system._update_single_memory(memory_id, req.content, req.user_id, "API update")
    return MemoryOperationResponse(success=True, data={"id": memory_id}, message="Memory updated successfully")

@app.delete("/v1/memories/{memory_id}", response_model=MemoryOperationResponse)
async def delete_memory(memory_id: str = Path(...), userId: str = Query(...), deps=Depends(require_mcp_headers)):
    ok = await memory_system.delete_memory(memory_id, userId)
    return MemoryOperationResponse(success=ok, message="Memory deleted successfully")

@app.post("/v1/memories/deduplicate", response_model=MemoryOperationResponse)
async def deduplicate(userId: str = Query(...), deps=Depends(require_mcp_headers)):
    result = await memory_system.deduplicate_memories(userId)
    return MemoryOperationResponse(success=True, data=result, message="Deduplication completed")

@app.get("/v1/memories/stats", response_model=MemoryOperationResponse)
async def stats(userId: str = Query(...), deps=Depends(require_mcp_headers)):
    result = await memory_system.get_memory_statistics(userId)
    return MemoryOperationResponse(success=True, data=result, message="Memory statistics retrieved successfully")

@app.get("/mcp/version")
async def mcp_version():
    return {"mcp_protocol_version": MCP_PROTOCOL_VERSION}

@app.get("/mcp/capabilities")
async def mcp_caps():
    return {"capabilities": ["memory", "embedding", "search", "graph"], "mcp_protocol_version": MCP_PROTOCOL_VERSION}

async def startup_tasks():
    logger.info(f"OneAgent Memory Server v{ONEAGENT_VERSION} starting...")
    logger.info(f"Server ready at http://{a_config.host}:{a_config.port}")
    # Slight delay to allow MCP server (embeddings gateway) to come up, reducing false-negative warnings
    await asyncio.sleep(1.5)
    # Probe embeddings gateway once on startup for operator clarity (non-fatal)
    if getattr(memory_system, 'use_node_gateway', False):
        try:
            payload = json.dumps({"content": "startup-probe", "action": "probe"}).encode('utf-8')
            headers = {'Content-Type': 'application/json', 'Accept': 'application/json', 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION}
            req = urlrequest.Request(a_config.embeddings_url, data=payload, headers=headers, method='POST')
            def _call():
                with urlrequest.urlopen(req, timeout=5) as r:
                    return r.read()
            raw = await asyncio.to_thread(_call)
            if raw:
                logger.info("Embeddings gateway: ready")
                memory_system._gateway_cooldown_until = 0.0
            else:
                raise RuntimeError("Empty response from embeddings gateway")
        except Exception as e:
            logger.warning(f"Embeddings gateway unavailable at startup: {e}. Falling back to Gemini/local. Cooldown {a_config.embeddings_gateway_cooldown_seconds}s")
            memory_system._gateway_cooldown_until = time.time() + float(getattr(a_config, 'embeddings_gateway_cooldown_seconds', 5.0))

# ---------------------------------------------------------------------------
# Additional minimal health endpoints (liveness/readiness) - canonical
# ---------------------------------------------------------------------------
def _minimal_health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "oneagent-memory",
        "version": ONEAGENT_VERSION,
        "mcp_protocol_version": MCP_PROTOCOL_VERSION,
    }

@app.get("/ping")
async def ping():
    return _minimal_health()

@app.get("/livez")
async def livez():
    return _minimal_health()

@app.get("/readyz")
async def readyz():
    return _minimal_health()

# Ensure startup tasks run in all server start modes
@app.on_event("startup")
async def _on_startup():
    await startup_tasks()

if __name__ == "__main__":
    uvicorn.run(app, host=a_config.host, port=a_config.port, log_level="info")
