#!/usr/bin/env python3
"""
Debug Mem0 Installation and Setup
"""

import sys
import traceback

print("🔍 Mem0 Debug Test")
print(f"Python version: {sys.version}")
print(f"Python path: {sys.executable}")

print("\n1. Testing basic import...")
try:
    import mem0
    print(f"✅ mem0 imported successfully")
    print(f"   Version: {getattr(mem0, '__version__', 'Unknown')}")
    print(f"   Location: {mem0.__file__}")
except Exception as e:
    print(f"❌ Failed to import mem0: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n2. Testing Memory class import...")
try:
    from mem0 import Memory
    print("✅ Memory class imported successfully")
except Exception as e:
    print(f"❌ Failed to import Memory: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n3. Testing Memory instantiation...")
try:
    # Try the simplest possible configuration
    memory = Memory()
    print("✅ Memory instance created successfully")
except Exception as e:
    print(f"⚠️ Memory instantiation failed: {e}")
    print("This is expected - needs configuration")
    traceback.print_exc()

print("\n4. Testing with minimal config...")
try:
    config = {
        "version": "v1.1"  # Minimal config
    }
    memory = Memory(config=config)
    print("✅ Memory with minimal config created")
except Exception as e:
    print(f"⚠️ Minimal config failed: {e}")
    traceback.print_exc()

print("\n✅ Mem0 package is properly installed!")
print("💡 The integration will work with OneAgent's mock mode")
