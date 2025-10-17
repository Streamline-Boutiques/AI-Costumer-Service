from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.responses import JSONResponse, Response
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
from passlib.context import CryptContext
import asyncio
import aiohttp
import json

# ========================================
# Setup and Configuration
# ========================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

print("🚀 Backend starting...")

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL")
if not mongo_url:
    print("❌ Missing MONGO_URL in environment variables.")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "testdb")]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"

app = FastAPI(title="AI Customer Service API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ========================================
# Models
# ========================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    provider: str = "google"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Establishment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    address: str
    phone: str
    email: str
    hours: dict
    menu_items: List[dict] = []
    services: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DemoSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    establishment_data: dict
    messages: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessage(BaseModel):
    session_id: str
    message: str
    is_voice: bool = False


class DemoSessionCreate(BaseModel):
    establishment_name: str
    establishment_type: str
    address: str
    phone: str
    email: str
    hours: dict
    menu_items: List[dict] = []
    services: List[str] = []


# ========================================
# Routes
# ========================================

@api_router.get("/")
async def root():
    return {"message": "AI Customer Service API running!"}


@api_router.get("/health")
async def health_check():
    print("✅ /health endpoint hit!")
    return JSONResponse({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()})


@api_router.get("/debug/origin")
async def debug_origin(request: Request):
    origin = request.headers.get("origin")
    host = request.headers.get("host")
    print(f"🧩 DEBUG Origin: {origin}, Host: {host}")
    return {"origin": origin, "host": host}


@api_router.post("/demo/session", response_model=DemoSession)
async def create_demo_session(session_data: DemoSessionCreate):
    print("🧠 Creating demo session")
    session = DemoSession(establishment_data=session_data.model_dump(), messages=[])
    doc = session.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.demo_sessions.insert_one(doc)
    return session


@api_router.post("/demo/chat")
async def demo_chat(chat_data: ChatMessage):
    session = await db.demo_sessions.find_one({"id": chat_data.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    est = session["establishment_data"]
    text = chat_data.message.lower()

    if "reservation" in text or "book" in text:
        reply = f"I can help you reserve a table at {est['establishment_name']}! What day and time?"
    elif "menu" in text:
        if est["menu_items"]:
            reply = f"Here are some items: {', '.join([i['name'] for i in est['menu_items'][:3]])}."
        else:
            reply = "Our menu is varied — what kind of food are you in the mood for?"
    else:
        reply = f"Hello! I'm the assistant for {est['establishment_name']}. How can I help?"

    await db.demo_sessions.update_one(
        {"id": chat_data.session_id},
        {"$push": {"messages": {"$each": [
            {"role": "user", "content": chat_data.message},
            {"role": "assistant", "content": reply}
        ]}}}
    )
    return {"response": reply, "session_id": chat_data.session_id}


# ========================================
# Realtime OpenAI Chat Bridge
# ========================================

OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview"

@app.websocket("/realtime")
async def realtime_chat(websocket: WebSocket):
    await websocket.accept()
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        await websocket.send_text(json.dumps({"error": "Missing OPENAI_API_KEY"}))
        await websocket.close()
        return

    headers = {"Authorization": f"Bearer {openai_key}", "OpenAI-Beta": "realtime=v1"}
    url = f"wss://api.openai.com/v1/realtime?model={OPENAI_REALTIME_MODEL}"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(url, headers=headers) as openai_ws:
                async def client_to_openai():
                    async for msg in websocket.iter_text():
                        await openai_ws.send_str(msg)

                async def openai_to_client():
                    async for msg in openai_ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await websocket.send_text(msg.data)
                        elif msg.type == aiohttp.WSMsgType.BINARY:
                            await websocket.send_bytes(msg.data)

                await asyncio.gather(client_to_openai(), openai_to_client())

    except Exception as e:
        print(f"[Realtime] Error: {e}")
        await websocket.close()

# ========================================
# CORS (Full fix)
# ========================================

print("✅ Starting server with improved CORS handling")

CORS_REGEX = r"https://ai-costumer-service-[a-z0-9]+-streamline-boutiques-projects\.vercel\.app"
CORS_STATIC = [
    "http://localhost:3000",
    "https://localhost:3000",
]
print(f"✅ CORS Regex: {CORS_REGEX}")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_REGEX,
    allow_origins=["*"],  # TEMPORARY for testing — we’ll tighten this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def ensure_cors_headers(request, call_next):
    origin = request.headers.get("origin", "")
    is_allowed = (
        origin.startswith("https://ai-costumer-service-")
        and origin.endswith(".vercel.app")
    ) or origin in CORS_STATIC

    if request.method == "OPTIONS":
        response = Response(status_code=200)
    else:
        response = await call_next(request)

    if is_allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"

    print(f"🌍 Origin: {origin or 'N/A'} -> {'✅ ALLOWED' if is_allowed else '❌ BLOCKED'}")
    return response


# ========================================
# Include Routes + Logging
# ========================================

app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
