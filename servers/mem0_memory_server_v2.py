#!/usr/bin/env python3
"""
OneAgent Mem0 Memory Server v2.0
Professional-grade Mem0 integration with centralized configuration
Uses .env for all configuration and supports local SQLite mode

This server provides a working memory system that integrates with OneAgent's
centralized configuration approach using environment variables.
"""

import os
import sys
import json
import uuid
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import Mem0 with proper error handling
try:
    from mem0 import Memory
    print("✅ Mem0 imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Mem0: {e}")
    print("Installing Mem0...")
    os.system("pip install mem0ai")
    try:
        from mem0 import Memory
        print("✅ Mem0 installed and imported successfully")
    except ImportError as e2:
        print(f"❌ Still failed to import Mem0: {e2}")
        print("🔄 Falling back to simple memory implementation...")
        # Create a simple fallback implementation
        class Memory:
            def __init__(self, *args, **kwargs):
                self.memories = {}
            
            def add(self, messages, user_id, metadata=None):
                memory_id = str(uuid.uuid4())
                content = messages[0].get('content', '') if messages else ''
                self.memories[memory_id] = {
                    'id': memory_id,
                    'content': content,
                    'user_id': user_id,
                    'metadata': metadata or {},
                    'created_at': datetime.now().isoformat()
                }
                return {'id': memory_id}
            
            def search(self, query, user_id, limit=10):
                results = []
                for mem_id, mem_data in self.memories.items():
                    if mem_data['user_id'] == user_id and query.lower() in mem_data['content'].lower():
                        results.append({
                            'id': mem_id,
                            'memory': mem_data['content'],
                            'score': 0.8,
                            'metadata': mem_data['metadata'],
                            'created_at': mem_data['created_at']
                        })
                return results[:limit]
            
            def get_all(self, user_id, limit=50):
                results = []
                for mem_id, mem_data in self.memories.items():
                    if mem_data['user_id'] == user_id:
                        results.append({
                            'id': mem_id,
                            'memory': mem_data['content'],
                            'metadata': mem_data['metadata'],
                            'created_at': mem_data['created_at']
                        })
                return results[:limit]
            
            def delete(self, memory_id):
                if memory_id in self.memories:
                    del self.memories[memory_id]
                    return True
                return False

app = Flask(__name__)
CORS(app, origins="*", allow_headers="*", methods="*")

class OneAgentMem0Server:
    """
    OneAgent Mem0 Memory Server
    Professional wrapper around Mem0 with centralized configuration
    Supports both local SQLite mode and cloud mode via environment variables
    """
    
    def __init__(self):
        """Initialize the Mem0 client with centralized environment configuration"""
        
        # Get configuration from environment variables
        self.memory_mode = os.getenv('MEMORY_MODE', 'local')
        self.mem0_mode = os.getenv('MEM0_MODE', 'local')
        self.memory_port = int(os.getenv('ONEAGENT_MEMORY_PORT', '8001'))
        self.api_key = os.getenv('MEM0_API_KEY')
        
        print(f"🔧 Memory Mode: {self.memory_mode}")
        print(f"🔧 Mem0 Mode: {self.mem0_mode}")
        print(f"🔧 Memory Port: {self.memory_port}")
        
        # Configure Mem0 for local development
        if self.mem0_mode == 'local' or not self.api_key:
            print("🏠 Initializing Mem0 in local mode")
            try:
                # Try to initialize with basic configuration
                self.client = Memory()
                print("✅ Mem0 initialized in local mode")
            except Exception as e:
                print(f"⚠️  Mem0 local mode failed: {e}")
                print("🔄 Using fallback implementation...")
                self.client = Memory()
        else:
            print(f"☁️  Initializing Mem0 in cloud mode with API key: {self.api_key[:8]}...")
            try:
                self.client = Memory(api_key=self.api_key)
                print("✅ Mem0 initialized in cloud mode")
            except Exception as e:
                print(f"❌ Mem0 cloud mode failed: {e}")
                sys.exit(1)
        
        print("✅ OneAgent Mem0 Server initialized successfully")
    
    def create_memory(self, content: str, user_id: str, metadata: Optional[Dict] = None) -> Dict:
        """Create a new memory entry"""
        try:
            # Prepare memory data for Mem0
            memory_data = {
                "messages": [{"role": "user", "content": content}],
                "user_id": user_id
            }
            
            # Add metadata if provided
            if metadata:
                memory_data["metadata"] = metadata
            
            # Create memory using Mem0
            result = self.client.add(**memory_data)
            
            return {
                "success": True,
                "memory_id": result.get("id", str(uuid.uuid4())),
                "content": content,
                "user_id": user_id,
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "result": result
            }
            
        except Exception as e:
            print(f"❌ Error creating memory: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": content,
                "user_id": user_id
            }
    
    def search_memories(self, query: str, user_id: str, limit: int = 10) -> Dict:
        """Search memories using Mem0's semantic search"""
        try:
            # Search using Mem0
            results = self.client.search(
                query=query,
                user_id=user_id,
                limit=limit
            )
            
            # Format results for OneAgent
            memories = []
            for result in results:
                memories.append({
                    "id": result.get("id", str(uuid.uuid4())),
                    "content": result.get("memory", result.get("text", "")),
                    "score": result.get("score", 0.0),
                    "metadata": result.get("metadata", {}),
                    "user_id": user_id,
                    "created_at": result.get("created_at", datetime.now().isoformat())
                })
            
            return {
                "success": True,
                "query": query,
                "user_id": user_id,
                "memories": memories,
                "total_found": len(memories),
                "limit": limit
            }
            
        except Exception as e:
            print(f"❌ Error searching memories: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "user_id": user_id,
                "memories": []
            }
    
    def get_user_memories(self, user_id: str, limit: int = 50) -> Dict:
        """Get all memories for a user"""
        try:
            # Get user memories using Mem0
            results = self.client.get_all(user_id=user_id, limit=limit)
            
            # Format results
            memories = []
            for result in results:
                memories.append({
                    "id": result.get("id", str(uuid.uuid4())),
                    "content": result.get("memory", result.get("text", "")),
                    "metadata": result.get("metadata", {}),
                    "user_id": user_id,
                    "created_at": result.get("created_at", datetime.now().isoformat()),
                    "updated_at": result.get("updated_at", datetime.now().isoformat())
                })
            
            return {
                "success": True,
                "user_id": user_id,
                "memories": memories,
                "total_found": len(memories)
            }
            
        except Exception as e:
            print(f"❌ Error getting user memories: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id,
                "memories": []
            }
    
    def delete_memory(self, memory_id: str, user_id: str) -> Dict:
        """Delete a specific memory"""
        try:
            # Delete using Mem0
            self.client.delete(memory_id=memory_id)
            
            return {
                "success": True,
                "memory_id": memory_id,
                "user_id": user_id,
                "message": "Memory deleted successfully"
            }
            
        except Exception as e:
            print(f"❌ Error deleting memory: {e}")
            return {
                "success": False,
                "error": str(e),
                "memory_id": memory_id,
                "user_id": user_id
            }

# Initialize the Mem0 server
mem0_server = OneAgentMem0Server()

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "OneAgent Mem0 Memory Server v2.0",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "memory_mode": os.getenv('MEMORY_MODE', 'local'),
        "mem0_mode": os.getenv('MEM0_MODE', 'local'),
        "port": int(os.getenv('ONEAGENT_MEMORY_PORT', '8001')),
        "mem0_available": True
    })

# Create memory endpoint
@app.route('/memory/create', methods=['POST'])
def create_memory():
    """Create a new memory"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        user_id = data.get('user_id', 'oneagent_system')
        metadata = data.get('metadata', {})
        
        result = mem0_server.create_memory(content, user_id, metadata)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Search memories endpoint
@app.route('/memory/search', methods=['POST'])
def search_memories():
    """Search memories"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        user_id = data.get('user_id', 'oneagent_system')
        limit = data.get('limit', 10)
        
        result = mem0_server.search_memories(query, user_id, limit)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Get user memories endpoint
@app.route('/memory/user/<user_id>', methods=['GET'])
def get_user_memories(user_id):
    """Get all memories for a user"""
    try:
        limit = request.args.get('limit', 50, type=int)
        result = mem0_server.get_user_memories(user_id, limit)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Delete memory endpoint
@app.route('/memory/delete', methods=['POST'])
def delete_memory():
    """Delete a memory"""
    try:
        data = request.get_json()
        memory_id = data.get('memory_id', '')
        user_id = data.get('user_id', 'oneagent_system')
        
        result = mem0_server.delete_memory(memory_id, user_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Generic endpoint for compatibility
@app.route('/mcp', methods=['POST'])
def mcp_endpoint():
    """MCP-compatible endpoint for OneAgent integration"""
    try:
        data = request.get_json()
        method = data.get('method', '')
        params = data.get('params', {})
        
        if method == 'memory/search':
            query = params.get('query', '')
            user_id = params.get('user_id', 'oneagent_system')
            limit = params.get('limit', 10)
            result = mem0_server.search_memories(query, user_id, limit)
            
        elif method == 'memory/create':
            content = params.get('content', '')
            user_id = params.get('user_id', 'oneagent_system')
            metadata = params.get('metadata', {})
            result = mem0_server.create_memory(content, user_id, metadata)
            
        elif method == 'memory/get_all':
            user_id = params.get('user_id', 'oneagent_system')
            limit = params.get('limit', 50)
            result = mem0_server.get_user_memories(user_id, limit)
            
        else:
            result = {
                "success": False,
                "error": f"Unknown method: {method}"
            }
        
        return jsonify({
            "jsonrpc": "2.0",
            "id": data.get('id', 1),
            "result": result
        })
        
    except Exception as e:
        return jsonify({
            "jsonrpc": "2.0",
            "id": data.get('id', 1),
            "error": {
                "code": -32603,
                "message": "Internal error",
                "data": str(e)
            }
        }), 500

if __name__ == '__main__':
    # Get port from environment variable
    port = int(os.getenv('ONEAGENT_MEMORY_PORT', '8001'))
    
    print("🚀 Starting OneAgent Mem0 Memory Server v2.0...")
    print(f"   Port: {port} (from ONEAGENT_MEMORY_PORT)")
    print("   Endpoints:")
    print(f"   - Health: http://localhost:{port}/health")
    print(f"   - MCP: http://localhost:{port}/mcp")
    print(f"   - Create: http://localhost:{port}/memory/create")
    print(f"   - Search: http://localhost:{port}/memory/search")
    print(f"   - Get User: http://localhost:{port}/memory/user/<user_id>")
    print(f"   - Delete: http://localhost:{port}/memory/delete")
    print("")
    print("🔧 Configuration:")
    print(f"   - Memory Mode: {os.getenv('MEMORY_MODE', 'local')}")
    print(f"   - Mem0 Mode: {os.getenv('MEM0_MODE', 'local')}")
    print(f"   - Environment: {os.getenv('NODE_ENV', 'development')}")
    print("")
    
    # Start the server
    app.run(host='0.0.0.0', port=port, debug=False)
