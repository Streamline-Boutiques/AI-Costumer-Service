    from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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
import websockets
import json

# ========================================
# Setup and Configuration
# ========================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="AI Customer Service API", version="1.0.0")

# Create router with prefix
api_router = APIRouter(prefix="/api")

# ========================================
# Data Models
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

class EstablishmentCreate(BaseModel):
    name: str
    type: str
    address: str
    phone: str
    email: str
    hours: dict
    menu_items: List[dict] = []
    services: List[str] = []

class EstablishmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hours: Optional[dict] = None
    menu_items: Optional[List[dict]] = None
    services: Optional[List[str]] = None

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
# Helper Functions
# ========================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========================================
# Core Routes
# ========================================

@api_router.get("/")
async def root():
    return {"message": "AI Customer Service API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ----------------------------------------
# DEMO ROUTES
# ----------------------------------------

@api_router.post("/demo/session", response_model=DemoSession)
async def create_demo_session(session_data: DemoSessionCreate):
    session = DemoSession(establishment_data=session_data.model_dump(), messages=[])
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.demo_sessions.insert_one(doc)
    return session

@api_router.post("/demo/chat")
async def demo_chat(chat_data: ChatMessage):
    session = await db.demo_sessions.find_one({"id": chat_data.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    establishment = session['establishment_data']
    user_message = chat_data.message.lower()

    if "reservation" in user_message or "book" in user_message:
        ai_response = f"I can help you reserve a table at {establishment['establishment_name']}! What day and time would you prefer?"
    elif "menu" in user_message:
        if establishment['menu_items']:
            ai_response = f"Here are some items: {', '.join([i['name'] for i in establishment['menu_items'][:3]])}."
        else:
            ai_response = "Our menu is varied — what kind of food are you in the mood for?"
    else:
        ai_response = f"Hello! I'm the assistant for {establishment['establishment_name']}. How can I help you today?"

    user_msg = {"role": "user", "content": chat_data.message, "timestamp": datetime.now(timezone.utc).isoformat()}
    ai_msg = {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}

    await db.demo_sessions.update_one({"id": chat_data.session_id}, {"$push": {"messages": {"$each": [user_msg, ai_msg]}}})
    return {"response": ai_response, "session_id": chat_data.session_id}

# ----------------------------------------
# AUTH ROUTES
# ----------------------------------------

@api_router.post("/auth/google")
async def google_auth():
    return {"message": "Google auth integration coming soon"}

@api_router.get("/auth/me")
async def get_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# ----------------------------------------
# ESTABLISHMENT ROUTES
# ----------------------------------------

@api_router.get("/establishments", response_model=List[Establishment])
async def get_user_establishments(current_user: User = Depends(get_current_user)):
    establishments = await db.establishments.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    for e in establishments:
        e["created_at"] = datetime.fromisoformat(e["created_at"])
        e["updated_at"] = datetime.fromisoformat(e["updated_at"])
    return establishments

@api_router.post("/establishments", response_model=Establishment)
async def create_establishment(establishment_data: EstablishmentCreate, current_user: User = Depends(get_current_user)):
    est = Establishment(user_id=current_user.id, **establishment_data.model_dump())
    doc = est.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.establishments.insert_one(doc)
    return est

# ========================================
# Realtime OpenAI Chat (NEW)
# ========================================

from fastapi import WebSocket
import aiohttp
import asyncio
import json
import os

OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview"
MAX_RETRIES = 3  # reconnect attempts

@app.websocket("/realtime")
async def realtime_chat(websocket: WebSocket):
    """
    Realtime WebSocket bridge between the browser and OpenAI's Realtime API.
    Supports text + binary streaming, and includes auto-reconnect handling.
    """
    await websocket.accept()
    openai_key = os.getenv("OPENAI_API_KEY")

    if not openai_key:
        await websocket.send_text(json.dumps({"error": "Missing OPENAI_API_KEY"}))
        await websocket.close()
        return

    headers = {
        "Authorization": f"Bearer {openai_key}",
        "OpenAI-Beta": "realtime=v1",
    }
    openai_url = f"wss://api.openai.com/v1/realtime?model={OPENAI_REALTIME_MODEL}"

    async def openai_bridge():
        for attempt in range(MAX_RETRIES):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.ws_connect(openai_url, headers=headers) as openai_ws:

                        async def from_client():
                            try:
                                while True:
                                    msg = await websocket.receive()
                                    if msg["type"] == "websocket.disconnect":
                                        await openai_ws.close()
                                        break
                                    if msg["type"] == "websocket.receive":
                                        data = msg.get("bytes")
                                        if data:
                                            await openai_ws.send_bytes(data)
                                        else:
                                            text = msg.get("text")
                                            if text:
                                                await openai_ws.send_str(text)
                            except Exception as e:
                                print("Client connection closed:", e)

                        async def from_openai():
                            async for msg in openai_ws:
                                if msg.type == aiohttp.WSMsgType.TEXT:
                                    await websocket.send_text(msg.data)
                                elif msg.type == aiohttp.WSMsgType.BINARY:
                                    await websocket.send_bytes(msg.data)

                        await asyncio.gather(from_client(), from_openai())

                        # if we exit normally, break out of retry loop
                        break  

            except Exception as e:
                print(f"[Realtime] Connection error (attempt {attempt+1}/{MAX_RETRIES}):", e)
                await asyncio.sleep(2)  # backoff before retry

        else:
            await websocket.send_text(json.dumps({
                "error": "Failed to connect to OpenAI Realtime API after multiple attempts."
            }))
            await websocket.close()

    await openai_bridge()


# ========================================
# App Setup
# ========================================

app.include_router(api_router)

# Handle CORS more explicitly for Vercel
frontend_origin = os.environ.get("FRONTEND_URL") or os.environ.get("CORS_ORIGINS")

if frontend_origin:
    allowed_origins = [o.strip() for o in frontend_origin.split(",") if o.strip()]
else:
    # fallback for local testing
    allowed_origins = [
        "http://localhost:3000",
        "https://localhost:3000",
    ]

print(f"✅ Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
