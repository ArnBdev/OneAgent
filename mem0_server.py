# mem0_server.py - Local FastAPI wrapper for mem0-Gemini with Google AI Studio integration
from dotenv import load_dotenv
load_dotenv()
import os
os.environ['MEM0_PROVIDER'] = 'gemini'
os.environ['MEM0_EMBEDDING_PROVIDER'] = 'gemini'
from fastapi import FastAPI, Request, Depends, HTTPException, Path
from fastapi.responses import JSONResponse, PlainTextResponse
from mem0 import Memory
import logging
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI()

# --- GEMINI (GOOGLE AI STUDIO) CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_PROJECT = os.getenv("GEMINI_PROJECT")
GEMINI_LOCATION = os.getenv("GEMINI_LOCATION", "us-central1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro-latest")

if not GEMINI_API_KEY:
    logging.warning("[GEMINI] GEMINI_API_KEY not set. Please set it in your .env file for Gemini integration.")

# Pass Gemini config to mem0 Memory (env vars only)
memory = Memory()
logging.info(f"[GEMINI] Gemini config: API_KEY={'set' if GEMINI_API_KEY else 'not set'}, PROJECT={GEMINI_PROJECT}, LOCATION={GEMINI_LOCATION}, MODEL={GEMINI_MODEL}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)

# Log startup configuration
logging.info("Starting mem0 FastAPI server")
logging.info(f"Memory storage path: {os.getenv('MEMORY_STORAGE_PATH', './oneagent_unified_memory')}")
logging.info(f"Collection: {os.getenv('MEMORY_COLLECTION', 'oneagent_memories')}")
logging.info(f"Max per user: {os.getenv('MEMORY_MAX_PER_USER', '10000')}")
logging.info(f"Similarity threshold: {os.getenv('MEMORY_SIMILARITY_THRESHOLD', '0.5')}")
logging.info(f"ONEAGENT_ENV: {os.getenv('ONEAGENT_ENV')}")
logging.info(f"[GEMINI] Using Gemini as LLM backend: model={GEMINI_MODEL}, project={GEMINI_PROJECT}, location={GEMINI_LOCATION}")

# --- Canonical API Key Validation Dependency ---
def is_local_mode():
    # Detect local/dev mode by env var or host
    env = os.getenv("ONEAGENT_ENV", "development").lower()
    local_mode = env in ("dev", "development", "local") or os.getenv("MEM0_LOCAL_MODE", "false").lower() == "true"
    logging.info(f"[MODE DETECTION] Local mode: {local_mode} (env={env})")
    return local_mode

def api_key_dependency(request: Request):
    if is_local_mode():
        logging.info("[API KEY] Local mode detected, skipping API key validation.")
        return  # Skip API key check in local/dev mode
    api_key = request.headers.get("x-api-key") or request.headers.get("authorization")
    valid_key = os.getenv("MEM0_API_KEY")
    if not api_key or api_key != valid_key:
        logging.warning(f"[SECURITY] Invalid or missing API key: {api_key}")
        raise HTTPException(status_code=401, detail="Invalid API key.")
    logging.info("[API KEY] API key validated.")

# --- End Canonical API Key Validation ---

@app.post("/add")
async def add_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[ADD] Request: {data}")
    result = memory.add(
        data.get("content"),
        user_id=data.get("user_id"),
        agent_id=data.get("agent_id"),
        metadata=data.get("metadata")
    )
    logging.info(f"[ADD] Result: {result}")
    return result

@app.post("/search")
async def search_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[SEARCH] Request: {data}")
    result = memory.search(
        query=data.get("query"),
        user_id=data.get("user_id"),
        agent_id=data.get("agent_id"),
        limit=data.get("limit", 5)
    )
    logging.info(f"[SEARCH] Result: {result}")
    return result

@app.post("/update")
async def update_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[UPDATE] Request: {data}")
    result = memory.update(
        memory_id=data.get("memory_id"),
        data=data.get("data")
    )
    logging.info(f"[UPDATE] Result: {result}")
    return result

@app.post("/delete")
async def delete_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[DELETE] Request: {data}")
    result = memory.delete(
        memory_id=data.get("memory_id")
    )
    logging.info(f"[DELETE] Result: {result}")
    return result

@app.post("/graph")
async def graph_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[GRAPH] Request: {data}")
    # Example: implement graph queries as needed
    return {"message": "Graph memory endpoint not yet implemented"}

@app.post("/mcp")
async def mcp_endpoint():
    logging.info("[MCP] MCP handshake endpoint called")
    return {"status": "ok", "message": "MCP endpoint ready"}

@app.get("/health")
async def health():
    logging.info("[HEALTH] Health check endpoint called")
    return {"status": "ok"}

@app.get("/v1/ping/")
async def v1_ping():
    """
    Production-ready ping endpoint for mem0ai client and health checks.
    Returns status and key metadata for diagnostics and multi-tenant support.
    """
    return {
        "status": "ok",
        "org_id": os.getenv("MEMORY_ORG_ID", "default-org"),
        "project_id": os.getenv("MEMORY_PROJECT_ID", "default-project"),
        "user_id": os.getenv("MEMORY_USER_ID", "default-user"),
        "version": os.getenv("MEMORY_SERVER_VERSION", "1.0.0"),
        "environment": os.getenv("ONEAGENT_ENV", "production"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Canonical mem0 endpoints for full compatibility
@app.post("/v1/memories/")
async def v1_add_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[V1 ADD] Request: {data}")
    result = memory.add(
        data.get("messages"),
        user_id=data.get("user_id"),
        agent_id=data.get("agent_id"),
        metadata=data.get("metadata")
    )
    logging.info(f"[V1 ADD] Result: {result}")
    return JSONResponse(content=result)

@app.post("/v1/memories/search/")
async def v1_search_memory(request: Request, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[V1 SEARCH] Request: {data}")
    result = memory.search(
        query=data.get("query"),
        user_id=data.get("user_id"),
        agent_id=data.get("agent_id"),
        limit=data.get("limit", 5)
    )
    logging.info(f"[V1 SEARCH] Result: {result}")
    return JSONResponse(content=result)

@app.get("/v1/memories/{memory_id}/")
async def v1_get_memory(memory_id: str = Path(...), _: None = Depends(api_key_dependency)):
    logging.info(f"[V1 GET] memory_id: {memory_id}")
    result = memory.get(memory_id)
    logging.info(f"[V1 GET] Result: {result}")
    return JSONResponse(content=result)

@app.put("/v1/memories/{memory_id}/")
async def v1_update_memory(memory_id: str = Path(...), request: Request = None, _: None = Depends(api_key_dependency)):
    data = await request.json()
    logging.info(f"[V1 UPDATE] memory_id: {memory_id}, data: {data}")
    result = memory.update(memory_id=memory_id, data=data.get("text"))
    logging.info(f"[V1 UPDATE] Result: {result}")
    return JSONResponse(content=result)

@app.delete("/v1/memories/{memory_id}/")
async def v1_delete_memory(memory_id: str = Path(...), _: None = Depends(api_key_dependency)):
    logging.info(f"[V1 DELETE] memory_id: {memory_id}")
    result = memory.delete(memory_id=memory_id)
    logging.info(f"[V1 DELETE] Result: {result}")
    return JSONResponse(content=result)

# --- GLOBAL REQUEST LOGGING MIDDLEWARE FOR DEBUGGING ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    body = await request.body()
    logging.info(f"[HTTP] {request.method} {request.url.path} | Body: {body.decode('utf-8', errors='ignore')}")
    response = await call_next(request)
    logging.info(f"[HTTP] {request.method} {request.url.path} | Status: {response.status_code}")
    return response

# --- GLOBAL ERROR HANDLER MIDDLEWARE FOR DEBUGGING ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logging.error(f"[ERROR] {request.method} {request.url.path} | Exception: {exc}\n{tb}")
    return JSONResponse(status_code=500, content={"error": str(exc), "trace": tb})

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logging.error(f"[HTTP ERROR] {request.method} {request.url.path} | Status: {exc.status_code} | Detail: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

@app.exception_handler(FastAPIRequestValidationError)
async def validation_exception_handler(request: Request, exc: FastAPIRequestValidationError):
    logging.error(f"[VALIDATION ERROR] {request.method} {request.url.path} | {exc.errors()}")
    return JSONResponse(status_code=422, content={"error": "Validation error", "details": exc.errors()})
