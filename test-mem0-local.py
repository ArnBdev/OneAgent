#!/usr/bin/env python3
"""
Test Mem0 Local Installation
Simple test to verify mem0 is working locally
"""

import os
from mem0 import MemoryClient

def test_mem0_local():
    print("🧠 Testing Mem0 Local Installation...")
    
    try:
        # Initialize mem0 client (this will use local storage by default)
        client = MemoryClient()
        print("✅ Mem0 client initialized successfully")
        
        # Test adding a memory
        print("\n📝 Testing memory creation...")
        result = client.add("The user likes to work with TypeScript and React", user_id="test-user")
        print(f"✅ Memory added: {result}")
        
        # Test searching memories
        print("\n🔍 Testing memory search...")
        memories = client.search("TypeScript", user_id="test-user")
        print(f"✅ Found {len(memories)} memories")
        for memory in memories:
            print(f"   - {memory}")
        
        # Test getting all memories for user
        print("\n📋 Testing memory retrieval...")
        all_memories = client.get_all(user_id="test-user")
        print(f"✅ Retrieved {len(all_memories)} total memories")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing mem0: {e}")
        return False

if __name__ == "__main__":
    success = test_mem0_local()
    if success:
        print("\n🎉 Mem0 is fully operational locally!")
    else:
        print("\n💥 Mem0 local test failed!")
