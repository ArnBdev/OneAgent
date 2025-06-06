#!/usr/bin/env python3
"""
Test Mem0 SDK Direct Integration
This tests the mem0 Python SDK directly as an embedded memory layer
"""

import os
import sys
import traceback

def test_mem0_import():
    """Test basic mem0 import"""
    try:
        print("🧠 Testing Mem0 SDK Import...")
        import mem0
        print(f"✅ Mem0 imported successfully! Version: {mem0.__version__}")
        return True
    except Exception as e:
        print(f"❌ Failed to import mem0: {e}")
        traceback.print_exc()
        return False

def test_mem0_memory():
    """Test mem0 Memory class"""
    try:
        print("\n🧠 Testing Mem0 Memory Class...")
        from mem0 import Memory
        
        # Create memory instance without API key (local mode)
        print("🔧 Creating Memory instance...")
        memory = Memory()
        print("✅ Memory instance created successfully!")
        
        # Test adding a memory
        print("💾 Testing memory addition...")
        result = memory.add("OneAgent is a sophisticated AI system with memory capabilities", user_id="test_user")
        print(f"✅ Memory added: {result}")
        
        # Test searching memories
        print("🔍 Testing memory search...")
        memories = memory.search("OneAgent AI system", user_id="test_user")
        print(f"✅ Found memories: {memories}")
        
        # Test getting all memories
        print("📋 Testing get all memories...")
        all_memories = memory.get_all(user_id="test_user")
        print(f"✅ All memories: {all_memories}")
        
        return True
        
    except Exception as e:
        print(f"❌ Memory test failed: {e}")
        traceback.print_exc()
        return False

def test_mem0_client():
    """Test MemoryClient (if available)"""
    try:
        print("\n🧠 Testing MemoryClient...")
        from mem0 import MemoryClient
        
        # This might require API key, so we'll catch that
        print("🔧 Testing MemoryClient creation...")
        client = MemoryClient()
        print("✅ MemoryClient created successfully!")
        return True
        
    except ValueError as e:
        if "API Key" in str(e):
            print("💡 MemoryClient requires API key (cloud mode)")
            print("✅ This is expected for cloud mode - local Memory class works!")
            return True
        else:
            print(f"❌ MemoryClient test failed: {e}")
            return False
    except Exception as e:
        print(f"❌ MemoryClient test failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Mem0 SDK Tests...")
    print("=" * 50)
    
    # Test 1: Import
    import_success = test_mem0_import()
    if not import_success:
        print("\n❌ Import failed - stopping tests")
        return
    
    # Test 2: Memory class
    memory_success = test_mem0_memory()
    
    # Test 3: MemoryClient
    client_success = test_mem0_client()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY:")
    print(f"Import Test: {'✅ PASS' if import_success else '❌ FAIL'}")
    print(f"Memory Test: {'✅ PASS' if memory_success else '❌ FAIL'}")
    print(f"Client Test: {'✅ PASS' if client_success else '❌ FAIL'}")
    
    if import_success and memory_success:
        print("\n🎉 MEM0 IS WORKING LOCALLY!")
        print("💡 You can use the Memory class for embedded memory functionality")
    else:
        print("\n❌ Some tests failed - check configuration")

if __name__ == "__main__":
    main()
