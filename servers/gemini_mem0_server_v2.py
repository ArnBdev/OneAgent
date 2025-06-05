#!/usr/bin/env python3
"""
Gemini Memory Server v2 - OneAgent Compatible
============================================

A local HTTP server that provides memory API endpoints using Google Gemini embeddings
and ChromaDB for vector storage. This version is fully compatible with OneAgent's 
mem0Client expectations.

Features:
- RESTful API compatible with OneAgent mem0Client expectations
- Supports both /memories and /v1/memories/ endpoints
- Google Gemini embeddings for text vectorization  
- ChromaDB for local vector storage
- Flexible request body format (content or messages)
- TypeScript-compatible JSON responses

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
        """Convert to dictionary with both camelCase and snake_case for compatibility"""
        result = asdict(self)
        # Add snake_case versions for compatibility
        result.update({
            'user_id': self.userId,
            'agent_id': self.agentId,
            'workflow_id': self.workflowId,
            'session_id': self.sessionId,
            'memory_type': self.memoryType,
            'created_at': self.createdAt,
            'updated_at': self.updatedAt,
            'expires_at': self.expiresAt
        })
        return result

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
                task_type="semantic_similarity"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {e}")
            raise

    def add_memory(self, content: str, user_id: str = "default", metadata: Dict[str, Any] = None) -> MemoryItem:
        """Add a new memory"""
        try:
            if metadata is None:
                metadata = {}
            
            # Generate unique ID
            memory_id = str(uuid4())
            
            # Generate embedding
            logger.info(f"🔢 Generating embedding for: {content[:50]}...")
            embedding = self.generate_embedding(content)
            
            # Prepare metadata for ChromaDB
            chroma_metadata = {
                "userId": user_id,
                "content": content,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                **metadata
            }
            
            # Add to ChromaDB
            self.collection.add(
                ids=[memory_id],
                embeddings=[embedding],
                documents=[content],
                metadatas=[chroma_metadata]
            )
            
            # Create memory item
            memory = MemoryItem(
                id=memory_id,
                content=content,
                metadata=metadata,
                userId=user_id,
                agentId=metadata.get('agentId') or metadata.get('agent_id'),
                workflowId=metadata.get('workflowId') or metadata.get('workflow_id'),
                sessionId=metadata.get('sessionId') or metadata.get('session_id'),
                memoryType=metadata.get('memoryType') or metadata.get('memory_type', 'long_term')
            )
            
            logger.info(f"✅ Added memory: {memory_id[:8]}... - {content[:50]}...")
            return memory
            
        except Exception as e:
            logger.error(f"❌ Error adding memory: {e}")
            logger.error(f"Details: {traceback.format_exc()}")
            raise

    def search_memories(self, query: str, user_id: str = "default", limit: int = 10) -> List[MemoryItem]:
        """Search memories using semantic similarity"""
        try:
            # Generate query embedding
            logger.info(f"🔍 Searching for: {query[:50]}...")
            query_embedding = self.generate_embedding(query)
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where={"userId": user_id} if user_id != "all" else None
            )
            
            memories = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    memory_id = results['ids'][0][i]
                    content = results['documents'][0][i]
                    metadata = results['metadatas'][0][i] or {}
                    distance = results['distances'][0][i] if results['distances'] else 0
                    
                    # Convert ChromaDB metadata back to our format
                    clean_metadata = {k: v for k, v in metadata.items() 
                                    if k not in ['userId', 'content', 'createdAt']}
                    
                    memory = MemoryItem(
                        id=memory_id,
                        content=content,
                        metadata={**clean_metadata, 'similarity_score': 1 - distance},
                        userId=metadata.get('userId', user_id),
                        createdAt=metadata.get('createdAt')
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
            # Get all memories for user
            results = self.collection.get(
                where={"userId": user_id} if user_id != "all" else None
            )
            
            memories = []
            if results['ids']:
                for i in range(len(results['ids'])):
                    memory_id = results['ids'][i]
                    content = results['documents'][i]
                    metadata = results['metadatas'][i] or {}
                    
                    # Convert ChromaDB metadata back to our format
                    clean_metadata = {k: v for k, v in metadata.items() 
                                    if k not in ['userId', 'content', 'createdAt']}
                    
                    memory = MemoryItem(
                        id=memory_id,
                        content=content,
                        metadata=clean_metadata,
                        userId=metadata.get('userId', user_id),
                        createdAt=metadata.get('createdAt')
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
            self.collection.delete(ids=[memory_id])
            logger.info(f"✅ Deleted memory: {memory_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error deleting memory: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        try:
            total_count = self.collection.count()
            return {
                "total_memories": total_count,
                "collection_name": self.collection.name,
                "embedding_model": "text-embedding-004",
                "vector_store": "ChromaDB"
            }
        except Exception as e:
            logger.error(f"❌ Error getting stats: {e}")
            return {"error": str(e)}

class MemoryRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for Memory API endpoints"""
    
    def __init__(self, *args, memory_system=None, **kwargs):
        self.memory_system = memory_system
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

    def _extract_content_from_request(self, body: Dict[str, Any]) -> tuple:
        """Extract content and user_id from various request formats"""
        # Handle OneAgent format with 'content' field
        if 'content' in body:
            content = body['content']
            user_id = body.get('user_id', body.get('userId', 'default'))
            metadata = body.get('metadata', {})
            return content, user_id, metadata
        
        # Handle mem0 format with 'messages' field
        if 'messages' in body:
            messages = body['messages']
            if isinstance(messages, list) and messages:
                # Extract content from messages
                content_parts = []
                for msg in messages:
                    if isinstance(msg, dict) and 'content' in msg:
                        role = msg.get('role', 'user')
                        content_parts.append(f"{role}: {msg['content']}")
                content = "\n".join(content_parts)
            else:
                content = str(messages)
                
            user_id = body.get('user_id', body.get('userId', 'default'))
            metadata = body.get('metadata', {})
            return content, user_id, metadata
        
        return None, None, None

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
                    'message': 'Gemini Memory Server is running',
                    'stats': self.memory_system.get_stats(),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
                
            elif path in ['/memories', '/v1/memories', '/v1/memories/']:
                # Get memories - support both paths for compatibility
                user_id = query_params.get('userId', query_params.get('user_id', ['default']))[0]
                query = query_params.get('query', [None])[0]
                limit = int(query_params.get('limit', [10])[0])
                
                if query:
                    memories = self.memory_system.search_memories(query, user_id, limit)
                else:
                    memories = self.memory_system.get_all_memories(user_id)
                
                # Return format compatible with OneAgent expectations
                self._send_json_response(
                    [mem.to_dict() for mem in memories]  # Direct array for OneAgent
                )
                
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
            
            if path in ['/memories', '/v1/memories', '/v1/memories/']:
                # Add memory - support both paths for compatibility
                content, user_id, metadata = self._extract_content_from_request(body)
                
                if not content:
                    self._send_json_response({
                        'success': False,
                        'error': 'Content is required'
                    }, 400)
                    return
                
                memory = self.memory_system.add_memory(content, user_id, metadata)
                
                # Return format compatible with OneAgent expectations
                response_data = memory.to_dict()
                response_data['memory_id'] = memory.id  # Add memory_id field for compatibility
                
                self._send_json_response({
                    'success': True,
                    'data': response_data,
                    'message': 'Memory created successfully'
                })
                
            elif path in ['/memories/search', '/v1/memories/search']:
                # Search memories
                query = body.get('query', '')
                user_id = body.get('userId', body.get('user_id', 'default'))
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
            
            if path.startswith('/memories/') or path.startswith('/v1/memories/'):
                # Delete memory - support both paths
                memory_id = path.split('/')[-1]
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
    """Start the Gemini Memory Server v2"""
    try:
        print("🚀 Starting Gemini Memory Server v2 (OneAgent Compatible)")
        print("=" * 60)
        
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
        print("📋 Available endpoints (OneAgent Compatible):")
        print("   GET  /health                    - Server health check")
        print("   GET  /memories                  - Get all memories")
        print("   GET  /v1/memories/              - Get all memories (OneAgent format)")
        print("   GET  /memories?query=<text>     - Search memories")
        print("   POST /memories                  - Add new memory")
        print("   POST /v1/memories/              - Add new memory (OneAgent format)")
        print("   POST /memories/search           - Search memories (body)")
        print("   DELETE /memories/<id>           - Delete memory")
        print("   DELETE /v1/memories/<id>        - Delete memory (OneAgent format)")
        print("\n🎯 OneAgent mem0Client will connect seamlessly!")
        print("🔄 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Test the system
        try:
            test_memory = memory_system.add_memory(
                "OneAgent Gemini Memory Server v2 is running successfully with full API compatibility",
                "test_user",
                {"source": "startup_test", "memoryType": "system", "version": "v2"}
            )
            print(f"✅ Startup test successful: Added memory {test_memory.id[:8]}...")
            
            # Test search
            search_results = memory_system.search_memories("OneAgent server compatibility", "test_user", 1)
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
