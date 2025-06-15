#!/usr/bin/env python3
"""
Quick script to check what memories are stored in ChromaDB
"""

import chromadb
import json

try:
    # Connect to ChromaDB
    client = chromadb.PersistentClient(path='./oneagent_gemini_memory')
    collection = client.get_collection('oneagent_memories')
    
    print(f'Total documents in collection: {collection.count()}')
    
    # Get all documents
    results = collection.get()
    
    print("\nStored memories:")
    print("=" * 80)
    
    for i, doc in enumerate(results['documents']):
        print(f"\nMemory {i+1}:")
        print(f"Content: {doc[:200]}{'...' if len(doc) > 200 else ''}")
        print(f"ID: {results['ids'][i]}")
        print(f"Metadata: {json.dumps(results['metadatas'][i], indent=2)}")
        print("-" * 40)
        
except Exception as e:
    print(f"Error: {e}")
