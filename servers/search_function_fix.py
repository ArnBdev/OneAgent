    async def search_memories(self, request: MemorySearchRequest) -> List[MemoryResponse]:
        """Search memories with semantic similarity - FIXED VERSION"""
        try:
            logger.info(f"Searching memories for user: {request.user_id}, query: {request.query}, limit: {request.limit}")
            
            if request.query:
                # Semantic search using query() - returns nested arrays
                query_embedding = await self.generate_embedding(request.query)
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=request.limit,
                    where={"userId": request.user_id}
                )
                # Query results structure: {'ids': [[...]], 'documents': [[...]], 'metadatas': [[...]], 'distances': [[...]]}
                is_query_result = True
            else:
                # Get all memories for user using get() - returns flat arrays
                results = self.collection.get(
                    where={"userId": request.user_id}
                )
                # Get results structure: {'ids': [...], 'documents': [...], 'metadatas': [...]}
                is_query_result = False
                
                # Manually limit the results if needed
                if results.get('ids') and len(results.get('ids', [])) > request.limit:
                    results = {
                        'ids': results['ids'][:request.limit],
                        'documents': results['documents'][:request.limit],
                        'metadatas': results['metadatas'][:request.limit]
                    }
            
            memories = []
            
            # Handle different result structures
            if results.get('ids'):
                if is_query_result:
                    # Query results: nested arrays
                    ids = results['ids'][0] if results['ids'] and results['ids'][0] else []
                    documents = results['documents'][0] if results['documents'] and results['documents'][0] else []
                    metadatas = results['metadatas'][0] if results['metadatas'] and results['metadatas'][0] else []
                    distances = results.get('distances', [[]])[0] if results.get('distances') and results['distances'][0] else []
                else:
                    # Get results: flat arrays
                    ids = results['ids'] if results['ids'] else []
                    documents = results['documents'] if results['documents'] else []
                    metadatas = results['metadatas'] if results['metadatas'] else []
                    distances = []  # No distances in get results
                
                # Process results safely
                for i, memory_id in enumerate(ids):
                    if i < len(documents) and i < len(metadatas):
                        content = documents[i]
                        metadata = metadatas[i]
                        
                        # Calculate relevance score if available
                        relevance = None
                        if distances and i < len(distances):
                            # Convert distance to similarity score (1 - distance)
                            relevance = 1.0 - distances[i]
                        
                        memory = MemoryResponse(
                            id=memory_id,
                            content=content,
                            metadata=metadata,
                            userId=metadata.get("userId", request.user_id),
                            createdAt=metadata.get("createdAt", ""),
                            updatedAt=metadata.get("updatedAt", ""),
                            relevanceScore=relevance
                        )
                        memories.append(memory)
            
            logger.info(f"Search completed: {len(memories)} results for user {request.user_id}")
            return memories
            
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Memory search failed: {str(e)}")
