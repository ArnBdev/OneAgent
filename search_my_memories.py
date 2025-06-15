import chromadb

client = chromadb.PersistentClient(path='./oneagent_gemini_memory')
collection = client.get_collection('oneagent_memories')

# Get all documents and search manually
all_docs = collection.get(limit=200)
print('Searching for memories containing "development pattern" or "critical issue":')

found = []
search_terms = ['development pattern', 'critical issue', 'architectural mismatch', 'adapter', 'oneagent_system']

for doc, metadata in zip(all_docs['documents'], all_docs['metadatas']):
    if any(term in doc.lower() for term in search_terms):
        found.append((doc, metadata))

print(f'Found {len(found)} relevant memories:')
for i, (doc, metadata) in enumerate(found):
    print(f'{i+1}. {doc[:100]}...')
    print(f'   User: {metadata.get("userId", "unknown")}')
    print(f'   Created: {metadata.get("createdAt", "unknown")}')
    print('---')
