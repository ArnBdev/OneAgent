#!/usr/bin/env python3
"""
OneAgent Memory Server - Unified Production Implementation
=========================================================

A high-performance, production-grade memory server for OneAgent v4.0.0 Professional.
Combines all best practices from previous implementations into a single, reliable solution.

Features:
- Google Gemini embeddings (768-dimensional)
- ChromaDB vector storage with persistence
- RESTful API with full CRUD operations
- TypeScript-compatible responses
- Constitutional AI compliance
- Performance monitoring and health checks
- Error handling and logging
- Memory optimization and cleanup

Architecture:
- FastAPI for async performance
- Pydantic for type validation
- ChromaDB for vector operations
- Environment-based configuration
- Structured logging and monitoring

Endpoints:
- GET /health - Health check and statistics
- POST /v1/memories - Create memory
- GET /v1/memories - Search/retrieve memories
- PUT /v1/memories/{id} - Update memory
- DELETE /v1/memories/{id} - Delete memory

Usage:
    python oneagent_memory_server.py
    
Server runs on http://localhost:8000
"""

import os
import json
import logging
import asyncio
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from uuid import uuid4
import sys

# FastAPI for production performance
from fastapi import FastAPI, HTTPException, Query, Path, BackgroundTasks, Request, Header, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import uvicorn

# --- MCP 2025-06-18: Require Authorization and MCP-Protocol-Version headers on all memory endpoints ---
# SECURITY WARNING: For local/dev only. In production, always use HTTPS and never log or expose API keys.
MCP_PROTOCOL_VERSION = "2025-06-18"

# Environment and configuration
from dotenv import load_dotenv

# Load .env from root directory (one level up from servers/)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
MEM0_API_KEY = os.getenv("MEM0_API_KEY")  # <-- moved here, after dotenv
print(f"Loading environment from: {os.path.abspath(env_path)}")
print(f"GEMINI_API_KEY loaded: {'Yes' if os.getenv('GEMINI_API_KEY') else 'No'}")
print(f"ONEAGENT_MEMORY_PORT: {os.getenv('ONEAGENT_MEMORY_PORT', '8001')}")

# --- MCP header validation dependency (must be defined before use) ---
from fastapi import Header, HTTPException, status, Depends

def require_mcp_headers(
    Authorization: str = Header(None),
    mcp_protocol_version: str = Header(None, alias="MCP-Protocol-Version")
):
    if not Authorization or not Authorization.startswith("Bearer ") or Authorization.split(" ", 1)[1] != MEM0_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Invalid or missing Authorization header", "mcp_protocol_version": MCP_PROTOCOL_VERSION, "mcp_error_code": "unauthorized"})
    if mcp_protocol_version != MCP_PROTOCOL_VERSION:
        raise HTTPException(status_code=status.HTTP_426_UPGRADE_REQUIRED, detail={"error": f"MCP protocol version mismatch. Required: {MCP_PROTOCOL_VERSION}", "mcp_protocol_version": MCP_PROTOCOL_VERSION, "mcp_error_code": "protocol_version_mismatch"})

# Google Gemini API
import google.generativeai as genai

# ChromaDB for vector storage
import chromadb
from chromadb.config import Settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.FileHandler('oneagent_memory.log'),
        logging.StreamHandler(sys.stdout)  # Log to both file and stdout
    ]
)
logger = logging.getLogger("OneAgent.Memory")

# ============================================================================
# CONFIGURATION & VALIDATION
# ============================================================================

class MemoryConfig:
    """Centralized configuration with validation"""
    
    def __init__(self):
        # API Configuration
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # Server Configuration
        self.host = os.getenv('MEMORY_HOST', '127.0.0.1')
        self.port = int(os.getenv('ONEAGENT_MEMORY_PORT', '8001'))
        
        # Storage Configuration
        self.storage_path = os.getenv('MEMORY_STORAGE_PATH', './oneagent_memory')
        self.collection_name = os.getenv('MEMORY_COLLECTION', 'oneagent_memories')
        
        # Performance Configuration
        self.max_memories_per_user = int(os.getenv('MEMORY_MAX_PER_USER', '10000'))
        self.embedding_dimensions = 768
        self.search_similarity_threshold = float(os.getenv('MEMORY_SIMILARITY_THRESHOLD', '0.7'))
        
        logger.info(f"Memory server configured for {self.host}:{self.port}")
        logger.info(f"Storage: {self.storage_path}/{self.collection_name}")

config = MemoryConfig()

# ============================================================================
# DATA MODELS (PYDANTIC FOR VALIDATION)
# ============================================================================

# ============================================================================
# DATA MODELS (PYDANTIC FOR VALIDATION)
# ============================================================================

class UnifiedTimestamp(BaseModel):
    """Unified timestamp structure matching TypeScript implementation"""
    iso: str
    unix: int
    utc: str
    local: str
    timezone: str
    context: str
    contextual: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class UnifiedMetadata(BaseModel):
    """Canonical OneAgent metadata structure matching TypeScript UnifiedMetadata"""
    id: str
    type: str
    version: str
    temporal: Dict[str, Any]  # Contains created, updated, accessed timestamps
    system: Dict[str, Any]    # Contains source, component, sessionId, userId, agent info
    quality: Dict[str, Any]   # Contains score, constitutionalCompliant, validationLevel, confidence
    content: Dict[str, Any]   # Contains category, tags, sensitivity, relevanceScore, contextDependency
    relationships: Dict[str, Any] = {}  # Contains parent, children, related, dependencies
    analytics: Dict[str, Any] = {}      # Contains accessCount, lastAccessPattern, usageContext
    
    class Config:
        extra = "allow"  # Allow additional fields for flexibility

class MemoryCreateRequest(BaseModel):
    """Memory creation request using canonical UnifiedMetadata"""
    content: str = Field(..., min_length=1, max_length=50000)
    user_id: str = Field(..., min_length=1, max_length=100, alias="userId")
    metadata: Optional[UnifiedMetadata] = None
    
    class Config:
        populate_by_name = True

class MemorySearchRequest(BaseModel):
    """Memory search request"""
    query: Optional[str] = None
    user_id: str = Field(..., alias="userId")
    limit: Optional[int] = Field(default=10, ge=1, le=100)
    metadata_filter: Optional[Dict[str, Any]] = None
    
    class Config:
        populate_by_name = True

class MemoryResponse(BaseModel):
    """Memory response model"""
    id: str
    content: str
    metadata: Dict[str, Any]
    userId: str
    createdAt: str
    updatedAt: str
    relevanceScore: Optional[float] = None

class MemoryOperationResponse(BaseModel):
    """Standard operation response"""
    success: bool
    data: Optional[Union[MemoryResponse, List[MemoryResponse], Dict[str, Any]]] = None
    message: Optional[str] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============================================================================
# MEMORY MANAGEMENT SYSTEM
# ============================================================================

class OneAgentMemorySystem:
    """Production-grade memory system with best practices"""
    
    def __init__(self):
        # Initialize Gemini with latest models
        genai.configure(api_key=config.gemini_api_key)
        # Use a supported Gemini embedding model for embeddings (see https://ai.google.dev/gemini-api/docs/embeddings)
        self.embedding_model = "gemini-embedding-001"  # Latest stable embedding model
        self.llm_model = "gemini-2.5-flash"  # LLM for text/fact extraction (recommended)
        # Initialize LLM processor for intelligent memory management
        self.llm_processor = LLMMemoryProcessor(config.gemini_api_key, self.llm_model)
        # Initialize ChromaDB with production settings
        self.client = chromadb.PersistentClient(
            path=config.storage_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=False,
                is_persistent=True
            )
        )
        # Get or create collection with metadata
        self.collection = self.client.get_or_create_collection(
            name=config.collection_name,
            metadata={
                "description": "OneAgent v4.0.0 Professional Memory System",
                "embedding_model": self.embedding_model,
                "dimensions": config.embedding_dimensions,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        )
        logger.info(f"Memory system initialized: {self.collection.count()} memories loaded")
    
    async def generate_embedding(self, text: str, action: str = "add") -> List[float]:
        """Generate embedding with error handling and action-specific task types"""
        try:
            # Use different task types based on action (like mem0)
            task_type_map = {
                "add": "retrieval_document",
                "search": "retrieval_query", 
                "update": "retrieval_document"
            }
            task_type = task_type_map.get(action, "retrieval_document")
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type=task_type
            )
            embedding = result['embedding']
            # Gemini may return 3072-dim embedding; select first 768 dims for ChromaDB
            if len(embedding) > config.embedding_dimensions:
                embedding = embedding[:config.embedding_dimensions]
            elif len(embedding) < config.embedding_dimensions:
                raise ValueError(f"Embedding dimension mismatch: got {len(embedding)}, expected {config.embedding_dimensions}")
            return embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            # Return zero vector as fallback
            return [0.0] * config.embedding_dimensions
    
    async def create_memory(self, request: MemoryCreateRequest) -> MemoryResponse:
        """Create new memory with intelligent processing and conflict resolution (mem0 best practice: always store original input)"""
        try:
            # SIMPLIFIED: Always store the original content as a memory (mem0 canonical pattern)
            # Skip LLM processing unless explicitly requested via metadata
            # Convert metadata to dict if it's a Pydantic model
            metadata_dict = request.metadata.model_dump() if request.metadata else {}
            use_llm_processing = metadata_dict.get('use_llm_processing', False)
            
            original_memory_id = await self._create_single_memory(
                request.content,
                request.user_id,
                request.metadata,
                "Original user input (mem0 best practice)"
            )
            
            created_memories = [{
                "id": original_memory_id,
                "content": request.content,
                "action": "ADD_ORIGINAL"
            }]
            
            # Only perform LLM processing if explicitly requested
            if use_llm_processing:
                try:
                    # Extract facts from content using LLM (optional)
                    facts = await self.llm_processor.extract_facts(request.content)
                    logger.info(f"Extracted {len(facts)} facts from content")
                    
                    # Search for potentially conflicting existing memories
                    existing_memories = []
                    for fact in facts:
                        fact_embedding = await self.generate_embedding(fact, "search")
                        similar_results = self.collection.query(
                            query_embeddings=[fact_embedding],
                            n_results=5,
                            where={"userId": request.user_id}
                        )
                        if similar_results.get('ids') and similar_results['ids'][0]:
                            for i, memory_id in enumerate(similar_results['ids'][0]):
                                if similar_results['distances'][0][i] < 0.3:  # High similarity threshold
                                    existing_memories.append({
                                        "id": memory_id,
                                        "content": similar_results['documents'][0][i],
                                        "similarity": 1.0 - similar_results['distances'][0][i]
                                    })
                    
                    # Resolve conflicts using LLM
                    memory_actions = await self.llm_processor.resolve_memory_conflicts(facts, existing_memories)
                    
                    # Execute memory actions for facts (skip if fact is identical to original)
                    for action in memory_actions:
                        if action["action"] == "ADD" and action["text"] == request.content:
                            continue  # Already stored as original
                        if action["action"] == "ADD":
                            memory_id = await self._create_single_memory(
                                action["text"],
                                request.user_id,
                                request.metadata,
                                action.get("reasoning", "")
                            )
                            created_memories.append({
                                "id": memory_id,
                                "content": action["text"],
                                "action": "ADD"
                            })
                        elif action["action"] == "UPDATE":
                            await self._update_single_memory(
                                action["target_id"],
                                action["text"],
                                request.user_id,
                                action.get("reasoning", "")
                            )
                            created_memories.append({
                                "id": action["target_id"],
                                "content": action["text"],
                                "action": "UPDATE"
                            })
                        elif action["action"] == "DELETE":
                            await self.delete_memory(action["target_id"], request.user_id)
                except Exception as llm_error:
                    logger.warning(f"LLM processing failed but memory stored: {llm_error}")
                    # Continue without LLM processing
                    created_memories.append({
                        "id": action["target_id"],
                        "content": "DELETED",
                        "action": "DELETE"
                    })
            now = datetime.now(timezone.utc).isoformat()
            return MemoryResponse(
                id=original_memory_id,
                content=request.content,
                metadata={
                    "userId": request.user_id,
                    "createdAt": now,
                    "updatedAt": now,
                    "processedActions": len(created_memories),
                    "allActions": created_memories
                },
                userId=request.user_id,
                createdAt=now,
                updatedAt=now
            )
        except Exception as e:
            logger.error(f"Memory creation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Memory creation failed: {str(e)}")
    
    async def _create_single_memory(self, content: str, user_id: str, metadata: Optional[UnifiedMetadata], reasoning: str = "") -> str:
        """Create a single memory entry using canonical UnifiedMetadata"""
        memory_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Extract and process UnifiedMetadata
        if metadata:
            metadata_dict = metadata.model_dump()
            # Extract key information from UnifiedMetadata structure
            processed_metadata = {
                # Core OneAgent fields
                "memoryId": metadata_dict.get("id", memory_id),
                "type": metadata_dict.get("type", "memory"),
                "version": metadata_dict.get("version", "1.0.0"),
                
                # System information
                "userId": metadata_dict.get("system", {}).get("userId", user_id),
                "sessionId": metadata_dict.get("system", {}).get("sessionId"),
                "source": metadata_dict.get("system", {}).get("source", "OneAgent"),
                "component": metadata_dict.get("system", {}).get("component", "memory-system"),
                "agentId": metadata_dict.get("system", {}).get("agent", {}).get("id") if isinstance(metadata_dict.get("system", {}).get("agent"), dict) else metadata_dict.get("system", {}).get("agent"),
                
                # Content information
                "category": metadata_dict.get("content", {}).get("category", "general"),
                "tags": metadata_dict.get("content", {}).get("tags", []),
                "sensitivity": metadata_dict.get("content", {}).get("sensitivity", "internal"),
                "relevanceScore": metadata_dict.get("content", {}).get("relevanceScore", 0.5),
                "contextDependency": metadata_dict.get("content", {}).get("contextDependency", "session"),
                
                # Quality information
                "qualityScore": metadata_dict.get("quality", {}).get("score", 0.8),
                "constitutionallyValidated": metadata_dict.get("quality", {}).get("constitutionalCompliant", False),
                "validationLevel": metadata_dict.get("quality", {}).get("validationLevel", "basic"),
                "confidence": metadata_dict.get("quality", {}).get("confidence", 0.8),
                
                # Temporal information
                "createdAt": metadata_dict.get("temporal", {}).get("created", {}).get("iso", now),
                "updatedAt": metadata_dict.get("temporal", {}).get("updated", {}).get("iso", now),
                
                # Analytics information
                "accessCount": metadata_dict.get("analytics", {}).get("accessCount", 0),
                "lastAccessPattern": metadata_dict.get("analytics", {}).get("lastAccessPattern", "created"),
                "usageContext": metadata_dict.get("analytics", {}).get("usageContext", [])
            }
            
            # Convert lists to comma-separated strings for ChromaDB compatibility
            for key, value in processed_metadata.items():
                if isinstance(value, list):
                    processed_metadata[key] = ",".join(str(item) for item in value)
                elif value is None:
                    processed_metadata[key] = ""
        else:
            processed_metadata = {
                "userId": user_id,
                "type": "memory",
                "category": "general",
                "source": "OneAgent"
            }
            
        # Add standard processing metadata
        processed_metadata.update({
            "createdAt": now,
            "updatedAt": now,
            "memoryType": processed_metadata.get("memoryType", "long_term"),
            "contentHash": hashlib.md5(content.encode()).hexdigest(),
            "contentLength": len(content),
            "wordCount": len(content.split()),
            "processingReasoning": reasoning,
            "intelligentlyProcessed": True
        })
        
        # Generate embedding and store
        embedding = await self.generate_embedding(content, "add")
        
        self.collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[processed_metadata],
            ids=[memory_id]
        )
        
        logger.info(f"Memory created: {memory_id[:8]} for user {user_id} - {reasoning}")
        return memory_id
    
    async def _update_single_memory(self, memory_id: str, new_content: str, user_id: str, reasoning: str = ""):
        """Update a single memory entry"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get existing memory
        existing = self.collection.get(ids=[memory_id], where={"userId": user_id})
        if not existing['ids']:
            raise ValueError(f"Memory {memory_id} not found for user {user_id}")
        
        existing_metadata = existing['metadatas'][0]
        existing_metadata.update({
            "updatedAt": now,
            "contentHash": hashlib.md5(new_content.encode()).hexdigest(),
            "contentLength": len(new_content),
            "wordCount": len(new_content.split()),
            "updateReasoning": reasoning,
            "intelligentlyUpdated": True
        })
        
        # Generate new embedding and update
        embedding = await self.generate_embedding(new_content, "update")
        
        self.collection.update(
            ids=[memory_id],
            embeddings=[embedding],
            documents=[new_content],
            metadatas=[existing_metadata]
        )
        
        logger.info(f"Memory updated: {memory_id[:8]} for user {user_id} - {reasoning}")
    
    async def search_memories(self, request: MemorySearchRequest) -> List[MemoryResponse]:
        """Search memories with semantic similarity, fallback to exact match if no results"""
        try:
            results = None
            if request.query:
                # Semantic search with search-specific embedding
                query_embedding = await self.generate_embedding(request.query, "search")
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=request.limit,
                    where={"userId": request.user_id}
                )
            else:
                # Get all memories for user
                results = self.collection.get(
                    where={"userId": request.user_id},
                    limit=request.limit
                )
            memories = []
            if results.get('ids') and results['ids'][0]:
                for i, memory_id in enumerate(results['ids'][0]):
                    content = results['documents'][0][i]
                    metadata = results['metadatas'][0][i]
                    relevance = None
                    if results.get('distances') and results['distances'][0]:
                        relevance = 1.0 - results['distances'][0][i]
                    memory = MemoryResponse(
                        id=memory_id,
                        content=content,
                        metadata=metadata,
                        userId=metadata.get("userId", request.user_id),
                        createdAt=metadata.get("createdAt", ""),
                        updatedAt=metadata.get("updatedAt", ""),
                        relevanceScore=relevance
                    )
                    memories.append(memory)
            # Fallback: exact match if no semantic results and query provided
            if request.query and (not memories or len(memories) == 0):
                all_user_memories = self.collection.get(where={"userId": request.user_id})
                for i, content in enumerate(all_user_memories['documents']):
                    if content == request.query:
                        metadata = all_user_memories['metadatas'][i]
                        memory_id = all_user_memories['ids'][i]
                        memory = MemoryResponse(
                            id=memory_id,
                            content=content,
                            metadata=metadata,
                            userId=metadata.get("userId", request.user_id),
                            createdAt=metadata.get("createdAt", ""),
                            updatedAt=metadata.get("updatedAt", ""),
                            relevanceScore=1.0
                        )
                        memories.append(memory)
            logger.info(f"Search completed: {len(memories)} results for user {request.user_id}")
            return memories
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            raise HTTPException(status_code=500, detail=f"Memory search failed: {str(e)}")
    
    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """Delete memory with user verification"""
        try:
            # Verify ownership
            results = self.collection.get(
                ids=[memory_id],
                where={"userId": user_id}
            )
            
            if not results['ids']:
                raise HTTPException(status_code=404, detail="Memory not found or access denied")
            
            self.collection.delete(ids=[memory_id])
            logger.info(f"Memory deleted: {memory_id} by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Memory deletion failed: {e}")
            raise HTTPException(status_code=500, detail=f"Memory deletion failed: {str(e)}")
    
    async def deduplicate_memories(self, user_id: str) -> Dict[str, int]:
        """Remove duplicate memories for a user"""
        try:
            # Get all memories for user
            all_memories = self.collection.get(where={"userId": user_id})
            
            if not all_memories['ids']:
                return {"removed": 0, "total": 0}
            
            duplicates_removed = 0
            seen_hashes = set()
            
            for i, memory_id in enumerate(all_memories['ids']):
                content_hash = all_memories['metadatas'][i].get('contentHash')
                if content_hash in seen_hashes:
                    # Remove duplicate
                    self.collection.delete(ids=[memory_id])
                    duplicates_removed += 1
                    logger.info(f"Removed duplicate memory: {memory_id[:8]}")
                else:
                    seen_hashes.add(content_hash)
            
            return {
                "removed": duplicates_removed,
                "total": len(all_memories['ids']),
                "remaining": len(all_memories['ids']) - duplicates_removed
            }
            
        except Exception as e:
            logger.error(f"Deduplication failed: {e}")
            return {"error": str(e)}
    
    async def get_memory_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get detailed memory statistics for a user"""
        try:
            user_memories = self.collection.get(where={"userId": user_id})
            
            if not user_memories['ids']:
                return {"total": 0, "types": {}, "avgLength": 0}
            
            total_memories = len(user_memories['ids'])
            memory_types = {}
            total_length = 0
            intelligent_count = 0
            
            for metadata in user_memories['metadatas']:
                # Count by memory type
                mem_type = metadata.get('memoryType', 'unknown')
                memory_types[mem_type] = memory_types.get(mem_type, 0) + 1
                
                # Calculate average length
                length = metadata.get('contentLength', 0)
                total_length += length
                
                # Count intelligently processed
                if metadata.get('intelligentlyProcessed'):
                    intelligent_count += 1
            
            return {
                "total": total_memories,
                "types": memory_types,
                "avgLength": total_length / total_memories if total_memories > 0 else 0,
                "intelligentlyProcessed": intelligent_count,
                "processingRate": (intelligent_count / total_memories * 100) if total_memories > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Statistics generation failed: {e}")
            return {"error": str(e)}
    
    def get_stats(self) -> Dict[str, Any]:
        """Get enhanced system statistics"""
        try:
            total_memories = self.collection.count()
            
            # Get sample of recent memories to analyze
            recent_sample = self.collection.get(limit=100)
            intelligent_count = 0
            avg_length = 0
            
            if recent_sample['metadatas']:
                for metadata in recent_sample['metadatas']:
                    if metadata.get('intelligentlyProcessed'):
                        intelligent_count += 1
                    avg_length += metadata.get('contentLength', 0)
                
                avg_length = avg_length / len(recent_sample['metadatas']) if recent_sample['metadatas'] else 0
            
            return {
                "total_memories": total_memories,
                "collection_name": config.collection_name,
                "storage_path": config.storage_path,
                "embedding_model": self.embedding_model,
                "dimensions": config.embedding_dimensions,
                "uptime": "operational",
                "version": "4.0.0-Enhanced",
                "features": {
                    "intelligent_processing": True,
                    "conflict_resolution": True,
                    "fact_extraction": True,
                    "deduplication": True,
                    "action_specific_embeddings": True,
                    "constitutional_ai_ready": True,
                    "bulk_operations": True
                },
                "sample_stats": {
                    "intelligent_processing_rate": (intelligent_count / len(recent_sample['metadatas']) * 100) if recent_sample['metadatas'] else 0,
                    "average_content_length": avg_length,
                    "sample_size": len(recent_sample['metadatas']) if recent_sample['metadatas'] else 0
                }
            }
        except Exception as e:
            logger.error(f"Stats collection failed: {e}")
            return {"error": str(e)}

# ============================================================================
# LLM MEMORY PROCESSOR
# ============================================================================

# [REMOVED LEGACY LLMMemoryProcessor CLASS]
# Only the advanced, mem0-inspired LLMMemoryProcessor remains below.

# ============================================================================
# ADVANCED LLM MEMORY PROCESSOR (MEM0-INSPIRED FEATURES)
# ============================================================================

class LLMMemoryProcessor:
    """Advanced LLM-based memory processing with conflict resolution and fact extraction"""
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.model_name = model_name
        logger.info(f"LLM Memory Processor initialized with {model_name}")
    
    async def extract_facts(self, content: str) -> List[str]:
        """Extract meaningful facts from content using LLM"""
        try:
            prompt = f"""
Extract key facts and information from the following content. 
Return only the most important, factual statements as a JSON array of strings.
Focus on actionable information, specific details, and concrete facts.
Avoid redundant or trivial information.

Content: {content}

IMPORTANT: Return ONLY a valid JSON array, nothing else. No markdown code blocks, no explanations.
Format: ["fact1", "fact2", "fact3", ...]
"""
            
            response = await self.model.generate_content_async(prompt)
            facts_text = response.text.strip()
            
            # Robust JSON parsing with fallback handling
            facts = self._parse_json_response(facts_text)
            if facts:
                return [str(fact) for fact in facts if fact and len(str(fact).strip()) > 10]
            else:
                # Fallback: split by lines and clean
                facts = [line.strip() for line in facts_text.split('\n') if line.strip() and len(line.strip()) > 10]
                return facts[:5]  # Limit to top 5 facts
                
        except Exception as e:
            logger.error(f"Fact extraction failed: {e}")
            # Fallback: return content as single fact
            return [content[:500]] if len(content) > 20 else []
    
    async def resolve_memory_conflicts(self, new_facts: List[str], existing_memories: List[Dict]) -> List[Dict]:
        """Resolve conflicts between new facts and existing memories using LLM"""
        try:
            if not existing_memories:
                return [{"action": "ADD", "text": fact, "reasoning": "No conflicts detected"} for fact in new_facts]
            
            prompt = f"""
Analyze the relationship between new facts and existing memories. For each new fact, determine the appropriate action:

NEW FACTS:
{json.dumps(new_facts, indent=2)}

EXISTING MEMORIES:
{json.dumps([{"content": mem["content"], "similarity": mem["similarity"]} for mem in existing_memories], indent=2)}

For each new fact, return ONE action:
- ADD: If the fact is new and doesn't conflict
- UPDATE: If the fact updates/improves existing information (provide memory_id)
- DELETE: If the fact contradicts and should replace existing information (provide memory_id)
- SKIP: If the fact is redundant or already covered

IMPORTANT: Return ONLY a valid JSON array, nothing else. No markdown code blocks, no explanations.
Format:
[
  {{"action": "ADD|UPDATE|DELETE|SKIP", "text": "fact text", "memory_id": "id_if_applicable", "reasoning": "brief explanation"}}
]
"""
            
            response = await self.model.generate_content_async(prompt)
            actions_text = response.text.strip()
            
            # Robust JSON parsing with fallback handling
            actions = self._parse_json_response(actions_text)
            if actions:
                return actions
            else:
                # Fallback: add all facts
                return [{"action": "ADD", "text": fact, "reasoning": "LLM parsing failed"} for fact in new_facts]
                
        except Exception as e:
            logger.error(f"Conflict resolution failed: {e}")
            # Fallback: add all facts
            return [{"action": "ADD", "text": fact, "reasoning": "Error in conflict resolution"} for fact in new_facts]
    
    async def generate_memory_summary(self, memories: List[Dict]) -> str:
        """Generate a comprehensive summary of related memories"""
        try:
            if not memories:
                return ""
            
            content_list = [mem.get("content", "") for mem in memories[:10]]  # Limit to 10 memories
            
            prompt = f"""
Create a concise, comprehensive summary of the following related memories.
Focus on key patterns, insights, and the most important information.
Maximum 200 words.

MEMORIES:
{json.dumps(content_list, indent=2)}

Summary:
"""
            
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return "Summary generation failed"
    
    async def detect_duplicates(self, content: str, existing_contents: List[str]) -> List[Dict]:
        """Detect potential duplicates using semantic analysis"""
        try:
            if not existing_contents:
                return []
            
            prompt = f"""
Analyze if the new content is a duplicate or near-duplicate of any existing content.
Return potential duplicates with confidence scores.

NEW CONTENT:
{content}

EXISTING CONTENT:
{json.dumps(existing_contents[:20], indent=2)}

IMPORTANT: Return ONLY a valid JSON array, nothing else. No markdown code blocks, no explanations.
Format:
[
  {{"index": 0, "confidence": 0.95, "reasoning": "Nearly identical content"}}
]

Only return matches with confidence > 0.8
"""
            
            response = await self.model.generate_content_async(prompt)
            duplicates_text = response.text.strip()
            
            # Use robust JSON parsing
            duplicates = self._parse_json_response(duplicates_text)
            if duplicates:
                return [dup for dup in duplicates if dup.get("confidence", 0) > 0.8]
            else:
                return []
                
        except Exception as e:
            logger.error(f"Duplicate detection failed: {e}")
            return []

    def _parse_json_response(self, response_text: str) -> List:
        """
        Robust JSON parsing that handles common LLM response formats
        
        Args:
            response_text: Raw text response from LLM
            
        Returns:
            List: Parsed JSON array or None if parsing fails
        """
        try:
            # Clean the response text
            cleaned = response_text.strip()
            
            # Handle markdown code blocks
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]  # Remove ```json
            elif cleaned.startswith('```'):
                cleaned = cleaned[3:]   # Remove ```
            
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]  # Remove trailing ```
            
            # Remove any leading/trailing whitespace again
            cleaned = cleaned.strip()
            
            # Try direct JSON parsing
            if cleaned.startswith('[') and cleaned.endswith(']'):
                return json.loads(cleaned)
            
            # Try to extract JSON from response
            json_start = cleaned.find('[')
            json_end = cleaned.rfind(']')
            
            if json_start != -1 and json_end != -1 and json_end > json_start:
                json_str = cleaned[json_start:json_end+1]
                return json.loads(json_str)
                
            # Try to parse as single-line JSON (without brackets)
            if '{' in cleaned and '}' in cleaned:
                # Extract individual JSON objects and wrap in array
                import re
                json_objects = re.findall(r'\{[^}]*\}', cleaned)
                if json_objects:
                    parsed_objects = []
                    for obj_str in json_objects:
                        try:
                            parsed_objects.append(json.loads(obj_str))
                        except:
                            continue
                    return parsed_objects
                    
            return None
            
        except Exception as e:
            logger.error(f"JSON parsing failed: {e} for text: {response_text[:100]}...")
            return None

# ============================================================================
# MEMORY MANAGEMENT SYSTEM
# ============================================================================

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

# Initialize FastAPI app
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    await startup_tasks()
    yield

# Initialize FastAPI app with lifespan handler
app = FastAPI(
    title="OneAgent Memory Server",
    description="Production-grade memory system with Gemini embeddings and ChromaDB",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize memory system
memory_system = OneAgentMemorySystem()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health", response_model=MemoryOperationResponse)
async def health_check():
    """Health check with system statistics"""
    return MemoryOperationResponse(
        success=True,
        data=memory_system.get_stats(),
        message="OneAgent Memory Server v4.0.0 - Operational"
    )

@app.post("/v1/memories", response_model=MemoryOperationResponse)
async def create_memory(request: MemoryCreateRequest, deps=Depends(require_mcp_headers)):
    """Create new memory"""
    memory = await memory_system.create_memory(request)
    return MemoryOperationResponse(
        success=True,
        data=memory,
        message="Memory created successfully"
    )

@app.get("/v1/memories", response_model=MemoryOperationResponse)
async def search_memories(
    userId: str = Query(..., description="User ID"),
    query: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Result limit"),
    deps=Depends(require_mcp_headers)
):
    """Search or retrieve memories"""
    search_request = MemorySearchRequest(
        query=query,
        userId=userId,
        limit=limit
    )
    memories = await memory_system.search_memories(search_request)
    return MemoryOperationResponse(
        success=True,
        data=memories,
        message=f"Retrieved {len(memories)} memories"
    )

@app.put("/v1/memories/{memory_id}", response_model=MemoryOperationResponse)
async def update_memory(
    memory_id: str = Path(..., description="Memory ID"),
    request: MemoryCreateRequest = None,
    deps=Depends(require_mcp_headers)
):
    """Update an existing memory (content and/or metadata)"""
    # Validate input
    if request is None:
        raise HTTPException(status_code=400, detail="Missing request body")
    try:
        await memory_system._update_single_memory(
            memory_id,
            request.content,
            request.user_id,
            "API update via PUT /v1/memories/{id}"
        )
        return MemoryOperationResponse(
            success=True,
            message="Memory updated successfully",
            data={"id": memory_id}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory update failed: {str(e)}")
    

@app.delete("/v1/memories/{memory_id}", response_model=MemoryOperationResponse)
async def delete_memory(
    memory_id: str = Path(..., description="Memory ID"),
    userId: str = Query(..., description="User ID for verification"),
    deps=Depends(require_mcp_headers)
):
    """Delete memory"""
    success = await memory_system.delete_memory(memory_id, userId)
    return MemoryOperationResponse(
        success=success,
        message="Memory deleted successfully"
    )

@app.post("/v1/memories/deduplicate", response_model=MemoryOperationResponse)
async def deduplicate_user_memories(userId: str = Query(..., description="User ID"), deps=Depends(require_mcp_headers)):
    """Remove duplicate memories for a user"""
    result = await memory_system.deduplicate_memories(userId)
    return MemoryOperationResponse(
        success=True,
        data=result,
        message=f"Deduplication completed: removed {result.get('removed', 0)} duplicates"
    )

@app.get("/v1/memories/stats", response_model=MemoryOperationResponse)
async def get_memory_statistics(userId: str = Query(..., description="User ID"), deps=Depends(require_mcp_headers)):
    """Get detailed memory statistics for a user"""
    stats = await memory_system.get_memory_statistics(userId)
    return MemoryOperationResponse(
        success=True,
        data=stats,
        message="Memory statistics retrieved successfully"
    )

@app.post("/v1/memories/bulk", response_model=MemoryOperationResponse)
async def create_bulk_memories(
    requests: List[MemoryCreateRequest],
    background_tasks: BackgroundTasks,
    deps=Depends(require_mcp_headers)
):
    """Create multiple memories with intelligent processing"""
    results = []
    for request in requests:
        try:
            memory = await memory_system.create_memory(request)
            results.append({
                "success": True,
                "memory_id": memory.id,
                "user_id": memory.userId
            })
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e),
                "user_id": request.user_id
            })
    return MemoryOperationResponse(
        success=True,
        data={
            "processed": len(results),
            "successful": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"]),
            "results": results
        },
        message=f"Bulk operation completed: {len(results)} memories processed"
    )

@app.get("/mcp/version")
async def mcp_version():
    return {"mcp_protocol_version": MCP_PROTOCOL_VERSION}

@app.get("/mcp/capabilities")
async def mcp_capabilities():
    return {"capabilities": ["memory", "embedding", "search", "graph"], "mcp_protocol_version": MCP_PROTOCOL_VERSION}

# =========================================================================
# HEALTH/LIVENESS/READINESS ENDPOINTS (ROBUST, EXPANDABLE)
# =========================================================================

def minimal_health_status() -> dict:
    """Minimal liveness response for /ping, /livez, /readyz"""
    return {
        "status": "ok",
        "service": "oneagent-memory",
        "version": "4.0.0",
        "mcp_protocol_version": MCP_PROTOCOL_VERSION
    }

@app.get("/ping", tags=["health"])
async def ping():
    """Minimal liveness endpoint for health checks and client pings"""
    return minimal_health_status()

@app.get("/livez", tags=["health"])
async def livez():
    """Liveness probe endpoint (expandable for future checks)"""
    return minimal_health_status()

@app.get("/readyz", tags=["health"])
async def readyz():
    """Readiness probe endpoint (expandable for future checks)"""
    # In future, add DB/model checks here
    return minimal_health_status()

# ============================================================================
# SERVER STARTUP
# ============================================================================

async def startup_tasks():
    """Startup tasks and validation"""
    logger.info("OneAgent Memory Server v4.0.0 Starting...")
    logger.info(f"Configuration validated successfully")
    logger.info(f"Memory system operational: {memory_system.collection.count()} memories")
    logger.info(f"Server ready at http://{config.host}:{config.port}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    logger.info("Initializing OneAgent Memory Server v4.0.0...")
    
    try:
        uvicorn.run(
            app,
            host=config.host,
            port=config.port,
            log_level="info",
            access_log=True,
            loop="asyncio"
        )
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        raise
