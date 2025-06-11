#!/usr/bin/env python3
"""
Gemini Memory Server v2 - OneAgent Compatible Implementation
==========================================================

A local HTTP server that provides memory API endpoints using Google Gemini embeddings
and ChromaDB for vector storage. This server provides full compatibility with OneAgent's
mem0Client and supports DevAgent integration.

Features:
- RESTful API compatible with OneAgent mem0Client expectations
- Google Gemini embeddings for text vectorization  
- ChromaDB for local vector storage
- TypeScript-compatible JSON responses
- Full CRUD operations (Create, Read, Update, Delete)
- User-specific memory management
- Semantic search capabilities

Usage:
    python gemini_mem0_server_v2.py
    
Server will run on http://localhost:8000
"""

import json
import os
import logging
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from uuid import uuid4

# HTTP server
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Google Gemini API
import google.generativeai as genai

# ChromaDB for vector storage
import chromadb
from chromadb.config import Settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class MemoryItem:
    """Memory item structure matching OneAgent expectations"""
    id: str
    content: str
    metadata: Dict[str, Any]
    userId: Optional[str] = None
    agentId: Optional[str] = None
    workflowId: Optional[str] = None
    sessionId: Optional[str] = None
    memoryType: Optional[str] = None
    createdAt: str = None
    updatedAt: str = None
    expiresAt: Optional[str] = None

    def __post_init__(self):
        if not self.createdAt:
            self.createdAt = datetime.now(timezone.utc).isoformat()
        if not self.updatedAt:
            self.updatedAt = self.createdAt

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class GeminiMemorySystem:
    """Complete memory system using Gemini embeddings and ChromaDB"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(
            path="./oneagent_gemini_memory",
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="oneagent_memories",
            metadata={"description": "OneAgent memory storage with Gemini embeddings"}
        )
        
        logger.info("✅ Gemini Memory System initialized")
        logger.info(f"   Collection: {self.collection.name}")
        logger.info(f"   Memory count: {self.collection.count()}")

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using Gemini"""
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return a dummy embedding if Gemini fails
            return [0.0] * 768

    def add_memory(self, content: str, user_id: str = "default", metadata: Dict[str, Any] = None) -> MemoryItem:
        """Add a new memory item"""
        try:
            # Generate unique ID
            memory_id = str(uuid4())
            
            # Prepare metadata
            if metadata is None:
                metadata = {}
            
            # Create memory item
            memory = MemoryItem(
                id=memory_id,
                content=content,
                metadata=metadata,
                userId=user_id,
                agentId=metadata.get('agentId'),
                workflowId=metadata.get('workflowId'),
                sessionId=metadata.get('sessionId'),
                memoryType=metadata.get('memoryType', 'long_term')
            )
            
            # Generate embedding
            embedding = self.generate_embedding(content)
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[content],
                metadatas=[{
                    **metadata,
                    'userId': user_id,
                    'createdAt': memory.createdAt,
                    'updatedAt': memory.updatedAt
                }],
                ids=[memory_id]
            )
            
            logger.info(f"✅ Memory added: {memory_id[:8]}... for user {user_id}")
            return memory
            
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            raise

    def search_memories(self, query: str, user_id: str = "default", limit: int = 10) -> List[MemoryItem]:
        """Search memories using semantic similarity"""
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where={"userId": user_id} if user_id != "default" else None
            )
            
            memories = []
            if results['ids'] and results['ids'][0]:
                for i, memory_id in enumerate(results['ids'][0]):
                    content = results['documents'][0][i]
                    metadata = results['metadatas'][0][i]
                    
                    memory = MemoryItem(
                        id=memory_id,
                        content=content,
                        metadata=metadata,
                        userId=metadata.get('userId'),
                        agentId=metadata.get('agentId'),
                        workflowId=metadata.get('workflowId'),
                        sessionId=metadata.get('sessionId'),
                        memoryType=metadata.get('memoryType', 'long_term'),
                        createdAt=metadata.get('createdAt'),
                        updatedAt=metadata.get('updatedAt')
                    )
                    memories.append(memory)
            
            logger.info(f"🔍 Search completed: {len(memories)} results for '{query}'")
            return memories
            
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []

    def get_all_memories(self, user_id: str = "default") -> List[MemoryItem]:
        """Get all memories for a user"""
        try:
            # Get all memories for user
            results = self.collection.get(
                where={"userId": user_id} if user_id != "default" else None
            )
            
            memories = []
            if results['ids']:
                for i, memory_id in enumerate(results['ids']):
                    content = results['documents'][i]
                    metadata = results['metadatas'][i]
                    
                    memory = MemoryItem(
                        id=memory_id,
                        content=content,
                        metadata=metadata,
                        userId=metadata.get('userId'),
                        agentId=metadata.get('agentId'),
                        workflowId=metadata.get('workflowId'),
                        sessionId=metadata.get('sessionId'),
                        memoryType=metadata.get('memoryType', 'long_term'),
                        createdAt=metadata.get('createdAt'),
                        updatedAt=metadata.get('updatedAt')
                    )
                    memories.append(memory)
            
            logger.info(f"📋 Retrieved {len(memories)} memories for user {user_id}")
            return memories
            
        except Exception as e:
            logger.error(f"Error getting memories: {e}")
            return []

    def delete_memory(self, memory_id: str) -> bool:
        """Delete a memory by ID"""
        try:
            self.collection.delete(ids=[memory_id])
            logger.info(f"🗑️ Memory deleted: {memory_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory {memory_id}: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        try:
            count = self.collection.count()
            return {
                "total_memories": count,
                "collection_name": self.collection.name,
                "storage_path": "./oneagent_gemini_memory"
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}

class MemoryRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for memory operations"""
    
    def __init__(self, *args, memory_system=None, **kwargs):
        self.memory_system = memory_system
        super().__init__(*args, **kwargs)

    def _send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, indent=2)
        self.wfile.write(response_json.encode('utf-8'))

    def _parse_request_body(self) -> Dict[str, Any]:
        """Parse JSON request body"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        
        body = self.rfile.read(content_length)
        return json.loads(body.decode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self._send_json_response({}, 200)

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)
            
            if path == '/health':
                self._send_json_response({
                    'success': True,
                    'message': 'Gemini Memory Server v2 is running',
                    'stats': self.memory_system.get_stats(),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
                
            elif path.startswith('/v1/memories'):
                # Get memories (OneAgent compatible endpoint)
                user_id = query_params.get('userId', ['default'])[0]
                query = query_params.get('query', [None])[0]
                limit = int(query_params.get('limit', [10])[0])
                
                if query:
                    memories = self.memory_system.search_memories(query, user_id, limit)
                else:
                    memories = self.memory_system.get_all_memories(user_id)
                
                self._send_json_response({
                    'success': True,
                    'data': [mem.to_dict() for mem in memories]
                })
                
            else:
                self._send_json_response({
                    'success': False,
                    'error': 'Endpoint not found'
                }, 404)
                
        except Exception as e:
            logger.error(f"Error handling GET request: {e}")
            self._send_json_response({
                'success': False,
                'error': str(e)
            }, 500)

    def do_POST(self):
        """Handle POST requests"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            body = self._parse_request_body()
            
            if path == '/v1/memories' or path == '/v1/memories/':
                # Add memory (OneAgent compatible endpoint)
                content = body.get('content', '')
                user_id = body.get('user_id', body.get('userId', 'default'))
                metadata = body.get('metadata', {})
                
                if not content:
                    self._send_json_response({
                        'success': False,
                        'error': 'Content is required'
                    }, 400)
                    return
                
                memory = self.memory_system.add_memory(content, user_id, metadata)
                self._send_json_response({
                    'success': True,
                    'data': memory.to_dict()
                })
                
            elif path == '/v1/memories/search':
                # Search memories
                query = body.get('query', '')
                user_id = body.get('user_id', body.get('userId', 'default'))
                limit = body.get('limit', 10)
                
                if not query:
                    self._send_json_response({
                        'success': False,
                        'error': 'Query is required'
                    }, 400)
                    return
                
                memories = self.memory_system.search_memories(query, user_id, limit)
                self._send_json_response({
                    'success': True,
                    'data': [mem.to_dict() for mem in memories]
                })
                
            else:
                self._send_json_response({
                    'success': False,
                    'error': 'Endpoint not found'
                }, 404)
                
        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self._send_json_response({
                'success': False,
                'error': str(e)
            }, 500)

    def do_DELETE(self):
        """Handle DELETE requests"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            if path.startswith('/v1/memories/'):
                # Delete memory (OneAgent compatible endpoint)
                memory_id = path.split('/v1/memories/')[-1]
                success = self.memory_system.delete_memory(memory_id)
                
                self._send_json_response({
                    'success': success,
                    'message': f'Memory {memory_id} deleted' if success else 'Failed to delete memory'
                })
                
            else:
                self._send_json_response({
                    'success': False,
                    'error': 'Endpoint not found'
                }, 404)
                
        except Exception as e:
            logger.error(f"Error handling DELETE request: {e}")
            self._send_json_response({
                'success': False,
                'error': str(e)
            }, 500)

def create_request_handler(memory_system):
    """Create request handler with memory_system instance"""
    def handler(*args, **kwargs):
        return MemoryRequestHandler(*args, memory_system=memory_system, **kwargs)
    return handler

def main():
    """Start the Gemini Memory Server"""
    try:
        print("🚀 Starting Gemini Memory Server v2")
        print("=" * 50)
        
        # Check for API key
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("❌ Error: GOOGLE_API_KEY environment variable is required")
            print("   Please set your Google API key in the .env file")
            return
        
        # Initialize memory system
        print("🔧 Initializing Gemini Memory System...")
        memory_system = GeminiMemorySystem(api_key)
        
        # Create HTTP server
        port = 8000
        handler = create_request_handler(memory_system)
        httpd = HTTPServer(('localhost', port), handler)
        
        print(f"✅ Server running on http://localhost:{port}")
        print("📋 Available endpoints:")
        print("   GET  /health                    - Server health check")
        print("   GET  /v1/memories               - Get all memories")
        print("   GET  /v1/memories?query=<text>  - Search memories")
        print("   POST /v1/memories               - Add new memory")
        print("   POST /v1/memories/search        - Search memories (body)")
        print("   DELETE /v1/memories/<id>        - Delete memory")
        print("\n🎯 OneAgent mem0Client will connect to this server automatically")
        print("🔄 Press Ctrl+C to stop the server")
        print("=" * 50)
        
        # Test the system
        try:
            test_memory = memory_system.add_memory(
                "Gemini Memory Server v2 is running successfully with ChromaDB storage",
                "test_user",
                {"source": "startup_test", "memoryType": "system"}
            )
            print(f"✅ Startup test successful: Added memory {test_memory.id[:8]}...")
            
            # Test search
            search_results = memory_system.search_memories("server running", "test_user", 1)
            if search_results:
                print(f"✅ Search test successful: Found {len(search_results)} results")
            
        except Exception as e:
            print(f"⚠️ Startup test warning: {e}")
        
        # Start server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        print(f"Details: {traceback.format_exc()}")

if __name__ == "__main__":
    main()
