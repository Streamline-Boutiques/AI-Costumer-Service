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

@app.websocket("/realtime")
async def realtime_chat(websocket: WebSocket):
    """Relay between frontend and OpenAI Realtime API"""
    await websocket.accept()
    openai_key = os.getenv("OPENAI_API_KEY")

    if not openai_key:
        await websocket.send_text(json.dumps({"error": "Missing OPENAI_API_KEY"}))
        await websocket.close()
        return

    try:
        async with websockets.connect(
            "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
            extra_headers={"Authorization": f"Bearer {openai_key}"}
        ) as upstream:

            async def client_to_openai():
                async for msg in websocket.iter_text():
                    await upstream.send(msg)

            async def openai_to_client():
                async for msg in upstream:
                    await websocket.send(msg)

            await asyncio.gather(client_to_openai(), openai_to_client())

    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
        await websocket.close()

# ========================================
# App Setup
# ========================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
