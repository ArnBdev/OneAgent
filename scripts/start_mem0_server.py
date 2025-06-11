#!/usr/bin/env python3
"""
Start mem0 server for OneAgent DevAgent integration testing
"""
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mem0 Test Server", version="1.0.0")

# Simple in-memory storage for testing
memory_store: Dict[str, List[Dict[str, Any]]] = {}

class MemoryItem(BaseModel):
    user_id: str
    memory: str
    metadata: Optional[Dict[str, Any]] = None

class MemoryQuery(BaseModel):
    query: str
    user_id: str
    limit: Optional[int] = 10

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mem0-test-server"}

@app.post("/add")
async def add_memory(memory_item: MemoryItem):
    """Add a memory item"""
    user_id = memory_item.user_id
    if user_id not in memory_store:
        memory_store[user_id] = []
    
    memory_entry = {
        "id": f"mem_{len(memory_store[user_id])}",
        "memory": memory_item.memory,
        "metadata": memory_item.metadata or {},
        "timestamp": "2025-01-03T12:00:00Z"
    }
    
    memory_store[user_id].append(memory_entry)
    logger.info(f"Added memory for user {user_id}: {memory_item.memory}")
    
    return {"status": "success", "id": memory_entry["id"]}

@app.post("/search")
async def search_memories(query: MemoryQuery):
    """Search memories for a user"""
    user_id = query.user_id
    if user_id not in memory_store:
        return {"memories": []}
    
    # Simple text search for testing
    memories = memory_store[user_id]
    matching_memories = [
        mem for mem in memories 
        if query.query.lower() in mem["memory"].lower()
    ]
    
    # Apply limit
    if query.limit:
        matching_memories = matching_memories[:query.limit]
    
    logger.info(f"Found {len(matching_memories)} memories for query: {query.query}")
    return {"memories": matching_memories}

@app.get("/memories/{user_id}")
async def get_user_memories(user_id: str):
    """Get all memories for a user"""
    if user_id not in memory_store:
        return {"memories": []}
    
    return {"memories": memory_store[user_id]}

@app.delete("/memories/{user_id}")
async def clear_user_memories(user_id: str):
    """Clear all memories for a user"""
    if user_id in memory_store:
        memory_store[user_id] = []
    return {"status": "success", "message": f"Cleared memories for {user_id}"}

if __name__ == "__main__":
    logger.info("Starting mem0 test server on localhost:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
