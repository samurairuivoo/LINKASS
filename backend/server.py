from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import uuid
import bcrypt
import httpx
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

SESSION_DAYS = 7
PRESENCE_WINDOW = 45  # seconds


# ----------------------------- Models -----------------------------
class SignupInput(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ServerCreate(BaseModel):
    name: str
    icon: Optional[str] = None


class ChannelCreate(BaseModel):
    name: str
    type: str = "text"


class MessageCreate(BaseModel):
    content: str = ""
    image: Optional[str] = None
    file_name: Optional[str] = None


class JoinInput(BaseModel):
    invite_code: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    status: Optional[str] = None


# ----------------------------- Helpers -----------------------------
def now_utc():
    return datetime.now(timezone.utc)


def new_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def public_user(doc) -> dict:
    last = doc.get("last_seen")
    online = False
    if last:
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        online = (now_utc() - last).total_seconds() < PRESENCE_WINDOW
    return {
        "user_id": doc["user_id"],
        "name": doc["name"],
        "email": doc["email"],
        "picture": doc.get("picture"),
        "status": doc.get("status", ""),
        "online": online,
    }


async def create_session(user_id: str, response: Response) -> str:
    token = secrets.token_urlsafe(32)
    expires = now_utc() + timedelta(days=SESSION_DAYS)
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "expires_at": expires.isoformat(),
        "created_at": now_utc().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=token, httponly=True, secure=True,
        samesite="none", path="/", max_age=SESSION_DAYS * 24 * 3600,
    )
    return token


async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    exp = sess["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc():
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    await db.users.update_one({"user_id": user["user_id"]},
                              {"$set": {"last_seen": now_utc().isoformat()}})
    return user


# ----------------------------- Auth routes -----------------------------
@api_router.post("/auth/signup")
async def signup(data: SignupInput, response: Response):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user_id = new_id("user")
    doc = {
        "user_id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_pw(data.password),
        "picture": None,
        "status": "",
        "provider": "email",
        "created_at": now_utc().isoformat(),
        "last_seen": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    token = await create_session(user_id, response)
    return {"token": token, "user": public_user(doc)}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not user.get("password_hash") or not check_pw(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = await create_session(user["user_id"], response)
    return {"token": token, "user": public_user(user)}


# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session id")
    async with httpx.AsyncClient() as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=15,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    info = r.json()
    email = info["email"].lower()
    user = await db.users.find_one({"email": email})
    if not user:
        user_id = new_id("user")
        user = {
            "user_id": user_id,
            "name": info.get("name") or email.split("@")[0],
            "email": email,
            "password_hash": None,
            "picture": info.get("picture"),
            "status": "",
            "provider": "google",
            "created_at": now_utc().isoformat(),
            "last_seen": now_utc().isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"user_id": user["user_id"]},
                                  {"$set": {"picture": info.get("picture") or user.get("picture")}})
    token = await create_session(user["user_id"], response)
    return {"token": token, "user": public_user(user)}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if upd:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": upd})
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return public_user(fresh)


@api_router.post("/presence/heartbeat")
async def heartbeat(user=Depends(get_current_user)):
    return {"ok": True}


# ----------------------------- Servers -----------------------------
@api_router.post("/servers")
async def create_server(data: ServerCreate, user=Depends(get_current_user)):
    server_id = new_id("srv")
    doc = {
        "server_id": server_id,
        "name": data.name,
        "icon": data.icon,
        "owner_id": user["user_id"],
        "invite_code": secrets.token_urlsafe(6),
        "members": [user["user_id"]],
        "created_at": now_utc().isoformat(),
    }
    await db.servers.insert_one(doc)
    for ch in ["geral", "random"]:
        await db.channels.insert_one({
            "channel_id": new_id("ch"), "server_id": server_id,
            "name": ch, "type": "text", "created_at": now_utc().isoformat(),
        })
    doc.pop("_id", None)
    return doc


@api_router.get("/servers")
async def list_servers(user=Depends(get_current_user)):
    servers = await db.servers.find({"members": user["user_id"]}, {"_id": 0}).to_list(200)
    return servers


@api_router.post("/servers/join")
async def join_server(data: JoinInput, user=Depends(get_current_user)):
    server = await db.servers.find_one({"invite_code": data.invite_code}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Convite inválido")
    await db.servers.update_one({"server_id": server["server_id"]},
                                {"$addToSet": {"members": user["user_id"]}})
    server["members"] = list(set(server["members"] + [user["user_id"]]))
    return server


async def ensure_member(server_id, user):
    server = await db.servers.find_one({"server_id": server_id}, {"_id": 0})
    if not server or user["user_id"] not in server["members"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return server


@api_router.get("/servers/{server_id}")
async def get_server(server_id: str, user=Depends(get_current_user)):
    server = await ensure_member(server_id, user)
    channels = await db.channels.find({"server_id": server_id}, {"_id": 0}).to_list(200)
    member_docs = await db.users.find({"user_id": {"$in": server["members"]}}, {"_id": 0}).to_list(500)
    members = [public_user(m) for m in member_docs]
    return {"server": server, "channels": channels, "members": members}


@api_router.post("/servers/{server_id}/channels")
async def create_channel(server_id: str, data: ChannelCreate, user=Depends(get_current_user)):
    await ensure_member(server_id, user)
    doc = {
        "channel_id": new_id("ch"), "server_id": server_id,
        "name": data.name, "type": data.type, "created_at": now_utc().isoformat(),
    }
    await db.channels.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ----------------------------- Channel messages -----------------------------
async def enrich_messages(msgs):
    ids = list({m["author_id"] for m in msgs})
    authors = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(500)
    amap = {a["user_id"]: public_user(a) for a in authors}
    for m in msgs:
        m["author"] = amap.get(m["author_id"])
    return msgs


@api_router.get("/channels/{channel_id}/messages")
async def get_messages(channel_id: str, user=Depends(get_current_user)):
    ch = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    await ensure_member(ch["server_id"], user)
    msgs = await db.messages.find({"channel_id": channel_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return await enrich_messages(msgs)


@api_router.post("/channels/{channel_id}/messages")
async def post_message(channel_id: str, data: MessageCreate, user=Depends(get_current_user)):
    ch = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    await ensure_member(ch["server_id"], user)
    if not data.content and not data.image:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    doc = {
        "message_id": new_id("msg"), "channel_id": channel_id,
        "author_id": user["user_id"], "content": data.content,
        "image": data.image, "file_name": data.file_name,
        "created_at": now_utc().isoformat(),
    }
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    doc["author"] = public_user(user)
    return doc


# ----------------------------- Direct Messages -----------------------------
def dm_key(a, b):
    return "_".join(sorted([a, b]))


@api_router.get("/dm/conversations")
async def list_dms(user=Depends(get_current_user)):
    convs = await db.dm_conversations.find({"participants": user["user_id"]}, {"_id": 0}).to_list(200)
    result = []
    for c in convs:
        other_id = [p for p in c["participants"] if p != user["user_id"]]
        other = await db.users.find_one({"user_id": other_id[0]}, {"_id": 0}) if other_id else None
        result.append({"dm_key": c["dm_key"], "other": public_user(other) if other else None,
                       "last_at": c.get("last_at")})
    result.sort(key=lambda x: x.get("last_at") or "", reverse=True)
    return result


@api_router.get("/dm/all-users")
async def all_users(user=Depends(get_current_user)):
    users = await db.users.find({"user_id": {"$ne": user["user_id"]}}, {"_id": 0}).to_list(500)
    return [public_user(u) for u in users]


@api_router.get("/dm/{other_id}/messages")
async def get_dm_messages(other_id: str, user=Depends(get_current_user)):
    key = dm_key(user["user_id"], other_id)
    msgs = await db.dm_messages.find({"dm_key": key}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return await enrich_messages(msgs)


@api_router.post("/dm/{other_id}/messages")
async def post_dm(other_id: str, data: MessageCreate, user=Depends(get_current_user)):
    other = await db.users.find_one({"user_id": other_id}, {"_id": 0})
    if not other:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    key = dm_key(user["user_id"], other_id)
    await db.dm_conversations.update_one(
        {"dm_key": key},
        {"$set": {"dm_key": key, "participants": sorted([user["user_id"], other_id]),
                  "last_at": now_utc().isoformat()}},
        upsert=True,
    )
    doc = {
        "message_id": new_id("dm"), "dm_key": key, "author_id": user["user_id"],
        "content": data.content, "image": data.image, "file_name": data.file_name,
        "created_at": now_utc().isoformat(),
    }
    await db.dm_messages.insert_one(doc)
    doc.pop("_id", None)
    doc["author"] = public_user(user)
    return doc


@api_router.get("/")
async def root():
    return {"message": "LinkChat API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
