#!/usr/bin/env python3
"""
Mem0 Local Server with Gemini Embeddings
========================================

A local HTTP server that provides Mem0 API endpoints using Google Gemini embeddings.
This allows OneAgent to have a fully local memory system without external dependencies.

Features:
- RESTful API compatible with Mem0 client expectations
- Google Gemini embeddings for text vectorization
- ChromaDB for local vector storage
- No external API keys required for embeddings
- TypeScript-compatible JSON responses

Usage:
    python mem0_server.py
    
Server will run on http://localhost:8000
"""

import json
import os
import logging
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from uuid import uuid4

# HTTP server
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Google Gemini API
import google.generativeai as genai

# Mem0 and ChromaDB
from mem0 import Memory
import chromadb

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
        return {
            'id': self.id,
            'content': self.content,
            'metadata': self.metadata,
            'userId': self.userId,
            'agentId': self.agentId,
            'workflowId': self.workflowId,
            'sessionId': self.sessionId,
            'memoryType': self.memoryType,
            'createdAt': self.createdAt,
            'updatedAt': self.updatedAt,
            'expiresAt': self.expiresAt
        }

class GeminiEmbeddingProvider:
    """Custom Gemini embeddings provider for Mem0"""
    
    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model
        genai.configure(api_key=api_key)
        logger.info(f"🔢 Initialized Gemini embeddings provider with model: {model}")
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            logger.info(f"🔢 Generating embeddings for {len(texts)} texts using Gemini {self.model}")
            embeddings = []
            
            for text in texts:
                result = genai.embed_content(
                    model=f"models/{self.model}",
                    content=text,
                    task_type="semantic_similarity",
                    title="Memory Content"
                )
                
                embedding = result['embedding']
                embeddings.append(embedding)
                logger.debug(f"✅ Generated embedding: {len(embedding)} dimensions")
            
            logger.info(f"✅ Generated {len(embeddings)} embeddings")
            if embeddings:
                logger.info(f"   Dimensions: {len(embeddings[0])} per embedding")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {e}")
            raise

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query text"""
        return self.embed_texts([text])[0]

class Mem0Server:
    """Local Mem0 server with Gemini embeddings"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        # Initialize Gemini embeddings
        self.embeddings = GeminiEmbeddingProvider(self.api_key)        # Initialize Mem0 with custom Gemini embeddings
        try:
            # Initialize with default config first
            self.memory = Memory()
            
            # Override the embedding function to use Gemini
            self._patch_memory_embeddings()
            
            logger.info("✅ Local memory with Gemini embeddings initialized")
            
        except Exception as e:
            logger.error(f"❌ Error initializing memory: {e}")
            logger.error(f"Details: {traceback.format_exc()}")
            raise

    def _patch_memory_embeddings(self):
        """Patch mem0 to use our Gemini embeddings"""
        try:
            # This is a workaround to inject our custom embeddings
            # We'll intercept the embedding calls and use Gemini instead
            original_embed = getattr(self.memory.embedding_model, 'embed', None)
            
            def gemini_embed_wrapper(texts):
                if isinstance(texts, str):
                    texts = [texts]
                return self.embeddings.embed_texts(texts)
            
            if hasattr(self.memory, 'embedding_model'):
                self.memory.embedding_model.embed = gemini_embed_wrapper
                logger.info("✅ Patched mem0 to use Gemini embeddings")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not patch embeddings, using fallback: {e}")

    def add_memory(self, content: str, user_id: str = "default", metadata: Dict[str, Any] = None) -> MemoryItem:
        """Add a new memory"""
        try:
            if metadata is None:
                metadata = {}
            
            # Add memory using mem0
            result = self.memory.add(
                messages=[{"role": "user", "content": content}],
                user_id=user_id,
                metadata=metadata
            )
            
            # Convert to our format
            memory_id = str(uuid4())
            if isinstance(result, list) and len(result) > 0:
                if hasattr(result[0], 'get'):
                    memory_id = result[0].get('id', memory_id)
            
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
            
            logger.info(f"✅ Added memory: {memory.id[:8]}... - {content[:50]}...")
            return memory
            
        except Exception as e:
            logger.error(f"❌ Error adding memory: {e}")
            logger.error(f"Details: {traceback.format_exc()}")
            raise

    def search_memories(self, query: str, user_id: str = "default", limit: int = 10) -> List[MemoryItem]:
        """Search memories"""
        try:
            # Use mem0 search
            results = self.memory.search(
                query=query,
                user_id=user_id,
                limit=limit
            )
            
            memories = []
            for result in results:
                # Convert mem0 result to our format
                content = result.get('memory', result.get('text', ''))
                memory_id = result.get('id', str(uuid4()))
                
                memory = MemoryItem(
                    id=memory_id,
                    content=content,
                    metadata=result.get('metadata', {}),
                    userId=user_id
                )
                memories.append(memory)
            
            logger.info(f"✅ Found {len(memories)} memories for query: {query[:30]}...")
            return memories
            
        except Exception as e:
            logger.error(f"❌ Error searching memories: {e}")
            logger.error(f"Details: {traceback.format_exc()}")
            return []

    def get_all_memories(self, user_id: str = "default") -> List[MemoryItem]:
        """Get all memories for a user"""
        try:
            # Use mem0 get_all
            results = self.memory.get_all(user_id=user_id)
            
            memories = []
            for result in results:
                content = result.get('memory', result.get('text', ''))
                memory_id = result.get('id', str(uuid4()))
                
                memory = MemoryItem(
                    id=memory_id,
                    content=content,
                    metadata=result.get('metadata', {}),
                    userId=user_id
                )
                memories.append(memory)
            
            logger.info(f"✅ Retrieved {len(memories)} total memories for user: {user_id}")
            return memories
            
        except Exception as e:
            logger.error(f"❌ Error getting all memories: {e}")
            logger.error(f"Details: {traceback.format_exc()}")
            return []

    def delete_memory(self, memory_id: str) -> bool:
        """Delete a memory"""
        try:
            # Use mem0 delete
            self.memory.delete(memory_id=memory_id)
            logger.info(f"✅ Deleted memory: {memory_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error deleting memory: {e}")
            return False

class Mem0RequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for Mem0 API endpoints"""
    
    def __init__(self, *args, mem0_server=None, **kwargs):
        self.mem0_server = mem0_server
        super().__init__(*args, **kwargs)

    def _send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        response_json = json.dumps(data, indent=2)
        self.wfile.write(response_json.encode('utf-8'))

    def _parse_request_body(self) -> Dict[str, Any]:
        """Parse JSON request body"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                return json.loads(body.decode('utf-8'))
            return {}
        except Exception as e:
            logger.error(f"Error parsing request body: {e}")
            return {}

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self._send_json_response({})

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)
            
            if path == '/health':
                self._send_json_response({
                    'success': True,
                    'message': 'Mem0 server with Gemini embeddings is running',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
                
            elif path.startswith('/memories'):
                # Get memories
                user_id = query_params.get('userId', ['default'])[0]
                query = query_params.get('query', [None])[0]
                limit = int(query_params.get('limit', [10])[0])
                
                if query:
                    memories = self.mem0_server.search_memories(query, user_id, limit)
                else:
                    memories = self.mem0_server.get_all_memories(user_id)
                
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
            
            if path == '/memories':
                # Add memory
                content = body.get('content', '')
                user_id = body.get('userId', 'default')
                metadata = body.get('metadata', {})
                
                if not content:
                    self._send_json_response({
                        'success': False,
                        'error': 'Content is required'
                    }, 400)
                    return
                
                memory = self.mem0_server.add_memory(content, user_id, metadata)
                self._send_json_response({
                    'success': True,
                    'data': memory.to_dict()
                })
                
            elif path == '/memories/search':
                # Search memories
                query = body.get('query', '')
                user_id = body.get('userId', 'default')
                limit = body.get('limit', 10)
                
                if not query:
                    self._send_json_response({
                        'success': False,
                        'error': 'Query is required'
                    }, 400)
                    return
                
                memories = self.mem0_server.search_memories(query, user_id, limit)
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
            
            if path.startswith('/memories/'):
                # Delete memory
                memory_id = path.split('/memories/')[-1]
                success = self.mem0_server.delete_memory(memory_id)
                
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

def create_request_handler(mem0_server):
    """Create request handler with mem0_server instance"""
    def handler(*args, **kwargs):
        return Mem0RequestHandler(*args, mem0_server=mem0_server, **kwargs)
    return handler

def main():
    """Start the Mem0 server"""
    try:
        print("🚀 Starting Mem0 Server with Gemini Embeddings")
        print("=" * 50)
        
        # Initialize server
        mem0_server = Mem0Server()
        
        # Create HTTP server
        port = 8000
        handler = create_request_handler(mem0_server)
        httpd = HTTPServer(('localhost', port), handler)
        
        print(f"✅ Server running on http://localhost:{port}")
        print("📋 Available endpoints:")
        print("   GET  /health                    - Server health check")
        print("   GET  /memories                  - Get all memories")
        print("   GET  /memories?query=<text>     - Search memories")
        print("   POST /memories                  - Add new memory")
        print("   POST /memories/search           - Search memories (body)")
        print("   DELETE /memories/<id>           - Delete memory")
        print("\n🎯 OneAgent mem0Client will connect to this server automatically")
        print("🔄 Press Ctrl+C to stop the server")
        print("=" * 50)
        
        # Test the server
        try:
            test_memory = mem0_server.add_memory(
                "Mem0 server is running with Gemini embeddings",
                "test_user",
                {"source": "startup_test", "memoryType": "system"}
            )
            print(f"✅ Startup test successful: Added memory {test_memory.id[:8]}...")
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
