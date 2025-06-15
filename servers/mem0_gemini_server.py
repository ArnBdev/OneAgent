#!/usr/bin/env python3
"""
OneAgent Mem0 Gemini Memory Server
Simple, working Mem0 integration with Google Gemini for OneAgent platform
Centralized configuration using .env file

This replaces the broken memory system with a clean, working implementation.
Uses Google Gemini instead of OpenAI for better local compatibility.
"""

import os
import sys
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file in parent directory
load_dotenv(dotenv_path="../.env")

# Import Mem0
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
        sys.exit(1)

app = Flask(__name__)
CORS(app, origins="*", allow_headers="*", methods="*")

class OneAgentMem0GeminiServer:
    """
    OneAgent Mem0 Memory Server with Google Gemini
    Uses centralized .env configuration for API keys and ports
    """
    
    def __init__(self):
        """Initialize the Mem0 client with Gemini configuration"""
          # Get configuration from environment
        self.google_api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
        self.memory_port = int(os.getenv('MEMORY_PORT', os.getenv('ONEAGENT_MEMORY_PORT', 8001)))
        
        if not self.google_api_key:
            raise ValueError("❌ GOOGLE_API_KEY not found in .env file")
        
        print(f"✅ Using Google API key: {self.google_api_key[:8]}...")
        
        # Configure Google Generative AI
        genai.configure(api_key=self.google_api_key)
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel('gemini-1.5-flash')        # Initialize Mem0 with Windows-compatible local configuration
        # Create a unique data directory in the servers folder to avoid conflicts
        data_dir = os.path.join(os.path.dirname(__file__), "oneagent_mem0_data")
        os.makedirs(data_dir, exist_ok=True)
        
        # Add a unique suffix to avoid conflicts with other processes
        import time
        unique_id = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        unique_data_dir = os.path.join(data_dir, f"session_{unique_id}")
        os.makedirs(unique_data_dir, exist_ok=True)
        
        config = {
            "vector_store": {
                "provider": "qdrant",
                "config": {
                    "collection_name": f"oneagent_memories_{unique_id}",
                    "path": unique_data_dir,
                    "host": None,  # Use local file-based storage
                    "port": None
                }            },            
            "embedder": {
                "provider": "google",
                "config": {
                    "model": "models/text-embedding-004",
                    "api_key": self.google_api_key
                }
            },
            "llm": {
                "provider": "google", 
                "config": {
                    "model": "gemini-1.5-flash",
                    "api_key": self.google_api_key
                }
            }
        }
        
        try:
            # Try with local configuration first
            self.memory = Memory(config=config)
            print("✅ Mem0 initialized with local configuration")
        except Exception as e:
            print(f"⚠️  Local config failed ({e}), using default configuration")
            # Fall back to default configuration
            self.memory = Memory()
            print("✅ Mem0 initialized with default configuration")
        
        print("✅ OneAgent Mem0 Gemini Server initialized")
    
    def create_memory(self, content: str, user_id: str, metadata: Optional[Dict] = None) -> Dict:
        """Create a new memory entry using Gemini for processing"""
        try:
            # Use Gemini to enhance the memory content
            prompt_for_ai = f"""
            You are helping to create a memory entry for an AI assistant.
            
            Original content: "{content}"
            User ID: {user_id}
            
            Create a clean, searchable memory entry that captures the key information.
            Keep it concise but preserve important details.
            """
            
            # Process with Gemini
            response = self.model.generate_content(prompt_for_ai)
            enhanced_content = response.text.strip()
              # Create memory using Mem0
            result = self.memory.add(
                messages=[{"role": "user", "content": enhanced_content}],
                user_id=user_id,
                agent_id="gemini-agent"
            )
            
            return {
                "success": True,
                "memory_id": result.get("id", str(uuid.uuid4())),
                "content": enhanced_content,
                "original_content": content,
                "user_id": user_id,
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "result": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "content": content,
                "user_id": user_id
            }
    
    def search_memories(self, query: str, user_id: str, limit: int = 10) -> Dict:
        """Search memories using Mem0's semantic search with Gemini enhancement"""
        try:
            # Search using Mem0
            results = self.memory.search(
                query=query,
                user_id=user_id,
                agent_id="gemini-agent",
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
            results = self.memory.get_all(
                user_id=user_id,
                agent_id="gemini-agent",
                limit=limit
            )
            
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
            self.memory.delete(memory_id=memory_id)
            
            return {
                "success": True,
                "memory_id": memory_id,
                "user_id": user_id,
                "message": "Memory deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "memory_id": memory_id,
                "user_id": user_id
            }

# Initialize the Mem0 Gemini server
try:
    mem0_server = OneAgentMem0GeminiServer()
except Exception as e:
    print(f"❌ Failed to initialize server: {e}")
    sys.exit(1)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "OneAgent Mem0 Gemini Memory Server",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "ai_provider": "Google Gemini",
        "mem0_available": True,
        "port": mem0_server.memory_port
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
    print("🚀 Starting OneAgent Mem0 Gemini Memory Server...")
    print(f"   Port: {mem0_server.memory_port}")
    print("   Endpoints:")
    print(f"   - Health: http://localhost:{mem0_server.memory_port}/health")
    print(f"   - MCP: http://localhost:{mem0_server.memory_port}/mcp")
    print(f"   - Create: http://localhost:{mem0_server.memory_port}/memory/create")
    print(f"   - Search: http://localhost:{mem0_server.memory_port}/memory/search")
    print(f"   - Get User: http://localhost:{mem0_server.memory_port}/memory/user/<user_id>")
    print(f"   - Delete: http://localhost:{mem0_server.memory_port}/memory/delete")
    print("")
    
    # Start the server
    app.run(host='0.0.0.0', port=mem0_server.memory_port, debug=False)
