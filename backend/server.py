from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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

# Create the main app without a prefix
app = FastAPI(title="AI Customer Service API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    provider: str = "google"  # google auth
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Establishment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str  # restaurant, bar, etc.
    address: str
    phone: str
    email: str
    hours: dict  # {"monday": "9:00-22:00", ...}
    menu_items: List[dict] = []  # [{"name": "...", "price": "...", "description": "..."}]
    services: List[str] = []  # ["reservations", "takeout", "delivery"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DemoSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    establishment_data: dict
    messages: List[dict] = []  # chat history
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

# Helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@api_router.get("/")
async def root():
    return {"message": "AI Customer Service API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Demo routes
@api_router.post("/demo/session", response_model=DemoSession)
async def create_demo_session(session_data: DemoSessionCreate):
    """Create a new demo session with establishment data"""
    session = DemoSession(
        establishment_data=session_data.model_dump(),
        messages=[]
    )
    
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    result = await db.demo_sessions.insert_one(doc)
    return session

@api_router.post("/demo/chat")
async def demo_chat(chat_data: ChatMessage):
    """Process chat message in demo session"""
    # Get session data
    session = await db.demo_sessions.find_one({"id": chat_data.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # For now, return a mock AI response
    # This will be replaced with actual OpenAI integration
    establishment = session['establishment_data']
    
    # Simple response logic based on message content
    user_message = chat_data.message.lower()
    
    if "reservation" in user_message or "book" in user_message:
        ai_response = f"I'd be happy to help you make a reservation at {establishment['establishment_name']}. We're open {list(establishment['hours'].values())[0] if establishment['hours'] else 'daily'}. What day and time would you prefer?"
    elif "menu" in user_message or "food" in user_message:
        if establishment['menu_items']:
            ai_response = f"Here are some popular items from our menu: {', '.join([item['name'] for item in establishment['menu_items'][:3]])}. Would you like to hear more about any specific dish?"
        else:
            ai_response = "I can tell you about our delicious menu options. What type of cuisine are you interested in?"
    elif "hours" in user_message or "open" in user_message:
        if establishment['hours']:
            hours_text = ", ".join([f"{day}: {hours}" for day, hours in establishment['hours'].items()])
            ai_response = f"Our hours are: {hours_text}. We'd love to have you visit!"
        else:
            ai_response = "We're open daily to serve you. Please call us for specific hours or to make a reservation."
    else:
        ai_response = f"Hello! I'm the AI assistant for {establishment['establishment_name']}. I can help you with reservations, menu information, hours, and answer any questions about our {establishment['establishment_type']}. How can I assist you today?"
    
    # Add messages to session
    user_msg = {
        "role": "user", 
        "content": chat_data.message, 
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_voice": chat_data.is_voice
    }
    
    ai_msg = {
        "role": "assistant", 
        "content": ai_response, 
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Update session with new messages
    await db.demo_sessions.update_one(
        {"id": chat_data.session_id},
        {"$push": {"messages": {"$each": [user_msg, ai_msg]}}}
    )
    
    return {"response": ai_response, "session_id": chat_data.session_id}

@api_router.get("/demo/session/{session_id}", response_model=DemoSession)
async def get_demo_session(session_id: str):
    """Get demo session data and chat history"""
    session = await db.demo_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Convert datetime string back to datetime object
    if isinstance(session['created_at'], str):
        session['created_at'] = datetime.fromisoformat(session['created_at'])
    
    return DemoSession(**session)

# Auth routes (will be implemented with Google OAuth)
@api_router.post("/auth/google")
async def google_auth():
    """Google OAuth authentication - to be implemented"""
    return {"message": "Google auth integration coming soon"}

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Dashboard routes (protected)
@api_router.get("/establishments", response_model=List[Establishment])
async def get_user_establishments(current_user: User = Depends(get_current_user)):
    """Get all establishments for current user"""
    establishments = await db.establishments.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for est in establishments:
        if isinstance(est['created_at'], str):
            est['created_at'] = datetime.fromisoformat(est['created_at'])
        if isinstance(est['updated_at'], str):
            est['updated_at'] = datetime.fromisoformat(est['updated_at'])
    
    return establishments

@api_router.post("/establishments", response_model=Establishment)
async def create_establishment(establishment_data: EstablishmentCreate, current_user: User = Depends(get_current_user)):
    """Create new establishment"""
    establishment = Establishment(
        user_id=current_user.id,
        **establishment_data.model_dump()
    )
    
    doc = establishment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.establishments.insert_one(doc)
    return establishment

@api_router.get("/establishments/{establishment_id}", response_model=Establishment)
async def get_establishment(establishment_id: str, current_user: User = Depends(get_current_user)):
    """Get specific establishment"""
    establishment = await db.establishments.find_one(
        {"id": establishment_id, "user_id": current_user.id}, 
        {"_id": 0}
    )
    if not establishment:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    if isinstance(establishment['created_at'], str):
        establishment['created_at'] = datetime.fromisoformat(establishment['created_at'])
    if isinstance(establishment['updated_at'], str):
        establishment['updated_at'] = datetime.fromisoformat(establishment['updated_at'])
    
    return Establishment(**establishment)

@api_router.put("/establishments/{establishment_id}", response_model=Establishment)
async def update_establishment(establishment_id: str, update_data: EstablishmentUpdate, current_user: User = Depends(get_current_user)):
    """Update establishment"""
    # Check if establishment exists and belongs to user
    existing = await db.establishments.find_one(
        {"id": establishment_id, "user_id": current_user.id}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.establishments.update_one(
            {"id": establishment_id},
            {"$set": update_dict}
        )
    
    # Return updated establishment
    updated = await db.establishments.find_one({"id": establishment_id}, {"_id": 0})
    
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Establishment(**updated)

@api_router.delete("/establishments/{establishment_id}")
async def delete_establishment(establishment_id: str, current_user: User = Depends(get_current_user)):
    """Delete establishment"""
    result = await db.establishments.delete_one(
        {"id": establishment_id, "user_id": current_user.id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    return {"message": "Establishment deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from fastapi import WebSocket
import websockets
import json
import asyncio

@app.websocket("/realtime")
async def realtime_chat(websocket: WebSocket):
    await websocket.accept()
    openai_key = os.getenv("OPENAI_API_KEY")

    if not openai_key:
        await websocket.send_text(json.dumps({"error": "Missing OPENAI_API_KEY"}))
        await websocket.close()
        return

    # Connect to OpenAI Realtime API
    async with websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        extra_headers={"Authorization": f"Bearer {openai_key}"}
    ) as upstream:

        async def client_to_openai():
            async for message in websocket.iter_text():
                await upstream.send(message)

        async def openai_to_client():
            async for message in upstream:
                await websocket.send(message)

        await asyncio.gather(client_to_openai(), openai_to_client())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
