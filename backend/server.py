from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'carelens_secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "patient"  # patient or doctor
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class DoctorProfile(BaseModel):
    specialization: str
    qualification: str
    experience_years: int
    hospital_name: Optional[str] = None
    address: str
    city: str
    state: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: str
    available: bool = True
    consultation_fee: Optional[int] = None
    languages: List[str] = ["English", "Tamil"]

class BPRecord(BaseModel):
    systolic: int
    diastolic: int
    pulse: Optional[int] = None
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    language: str = "English"
    session_id: Optional[str] = None

class AmbulanceRequest(BaseModel):
    lat: float
    lng: float
    patient_name: str
    phone: str
    emergency_type: str = "general"
    notes: Optional[str] = None

# ============ AUTH HELPERS ============

def create_token(user_id: str, role: str):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hashed,
        "role": data.role,
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email, "role": data.role}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"], "phone": user.get("phone")}

# ============ HOSPITALS ============

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@api_router.get("/hospitals/nearby")
async def get_nearby_hospitals(lat: float, lng: float, radius: float = 50):
    hospitals = await db.hospitals.find({}, {"_id": 0}).to_list(1000)
    results = []
    for h in hospitals:
        dist = haversine(lat, lng, h["lat"], h["lng"])
        if dist <= radius:
            h["distance_km"] = round(dist, 1)
            results.append(h)
    results.sort(key=lambda x: x["distance_km"])
    return results

@api_router.get("/hospitals")
async def get_all_hospitals():
    hospitals = await db.hospitals.find({}, {"_id": 0}).to_list(1000)
    return hospitals

@api_router.get("/hospitals/by-city")
async def get_hospitals_by_city(city: str):
    hospitals = await db.hospitals.find({"city": {"$regex": city, "$options": "i"}}, {"_id": 0}).to_list(100)
    return {"city": city, "count": len(hospitals), "hospitals": hospitals}

# ============ DOCTOR PROFILE ============

@api_router.post("/doctors/profile")
async def create_doctor_profile(profile: DoctorProfile, user=Depends(get_current_user)):
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create profiles")
    
    profile_doc = profile.model_dump()
    profile_doc["user_id"] = user["id"]
    profile_doc["doctor_name"] = user["name"]
    profile_doc["email"] = user["email"]
    profile_doc["id"] = str(uuid.uuid4())
    profile_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    profile_doc["rating"] = 4.5
    profile_doc["reviews_count"] = 0
    
    existing = await db.doctor_profiles.find_one({"user_id": user["id"]})
    if existing:
        await db.doctor_profiles.update_one({"user_id": user["id"]}, {"$set": profile_doc})
    else:
        await db.doctor_profiles.insert_one(profile_doc)
    
    return {"message": "Profile saved", "profile_id": profile_doc["id"]}

@api_router.get("/doctors/profile")
async def get_my_doctor_profile(user=Depends(get_current_user)):
    profile = await db.doctor_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.get("/doctors")
async def get_all_doctors():
    doctors = await db.doctor_profiles.find({"available": True}, {"_id": 0}).to_list(100)
    return doctors

@api_router.get("/doctors/nearby")
async def get_nearby_doctors(lat: float, lng: float, radius: float = 30):
    doctors = await db.doctor_profiles.find({"available": True, "lat": {"$exists": True}}, {"_id": 0}).to_list(100)
    results = []
    for d in doctors:
        if d.get("lat") and d.get("lng"):
            dist = haversine(lat, lng, d["lat"], d["lng"])
            if dist <= radius:
                d["distance_km"] = round(dist, 1)
                results.append(d)
    results.sort(key=lambda x: x["distance_km"])
    return results

# ============ BP MONITORING ============

@api_router.post("/bp/record")
async def add_bp_record(record: BPRecord, user=Depends(get_current_user)):
    doc = record.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["id"]
    doc["recorded_at"] = datetime.now(timezone.utc).isoformat()
    
    if record.systolic < 90:
        doc["status"] = "low"
    elif record.systolic <= 120 and record.diastolic <= 80:
        doc["status"] = "normal"
    elif record.systolic <= 139 or record.diastolic <= 89:
        doc["status"] = "elevated"
    else:
        doc["status"] = "high"
    
    await db.bp_records.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/bp/records")
async def get_bp_records(user=Depends(get_current_user)):
    records = await db.bp_records.find({"user_id": user["id"]}, {"_id": 0}).sort("recorded_at", -1).to_list(100)
    return records

# ============ AI CHAT ============

LANGUAGE_PROMPTS = {
    "English": "Respond in English.",
    "Hindi": "Respond in Hindi (हिंदी).",
    "Bengali": "Respond in Bengali (বাংলা).",
    "Telugu": "Respond in Telugu (తెలుగు).",
    "Marathi": "Respond in Marathi (मराठी).",
    "Tamil": "Respond in Tamil (தமிழ்).",
    "Gujarati": "Respond in Gujarati (ગુજરાતી).",
    "Kannada": "Respond in Kannada (ಕನ್ನಡ).",
    "Malayalam": "Respond in Malayalam (മലയാളം).",
    "Punjabi": "Respond in Punjabi (ਪੰਜਾਬੀ).",
    "Odia": "Respond in Odia (ଓଡ଼ିଆ).",
    "Assamese": "Respond in Assamese (অসমীয়া).",
    "Urdu": "Respond in Urdu (اردو).",
    "Sanskrit": "Respond in Sanskrit (संस्कृतम्).",
    "Sindhi": "Respond in Sindhi (سنڌي)."
}

@api_router.post("/chat/message")
async def chat_with_ai(data: ChatMessage, user=Depends(get_current_user)):
    session_id = data.session_id or f"chat_{user['id']}_{str(uuid.uuid4())[:8]}"
    lang_prompt = LANGUAGE_PROMPTS.get(data.language, "Respond in English.")
    
    system_msg = f"""You are CareLens AI, a friendly and interactive healthcare assistant for rural India. 
{lang_prompt}
You help patients with:
- Symptom analysis and health guidance
- Understanding their health reports
- Blood pressure and vital signs interpretation
- Finding nearby hospitals and doctors
- Emergency first aid guidance
- General health tips and preventive care

Be warm, empathetic, and use simple language. If symptoms seem serious, strongly recommend visiting a doctor immediately.
Keep responses concise but helpful. Use culturally appropriate examples.
IMPORTANT: You are NOT a replacement for a real doctor. Always recommend professional consultation for serious concerns."""

    # Get chat history for context
    history = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(20)

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_msg
        )
        chat.with_model("openai", "gpt-5.2")

        # Replay history
        for msg in history:
            if msg["role"] == "user":
                chat.messages.append({"role": "user", "content": msg["content"]})
            else:
                chat.messages.append({"role": "assistant", "content": msg["content"]})

        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)

        # Save messages
        ts = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "user_id": user["id"],
            "role": "user",
            "content": data.message,
            "language": data.language,
            "timestamp": ts
        })
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "user_id": user["id"],
            "role": "assistant",
            "content": response,
            "language": data.language,
            "timestamp": ts
        })

        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/chat/history")
async def get_chat_history(session_id: Optional[str] = None, user=Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if session_id:
        query["session_id"] = session_id
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("timestamp", 1).to_list(100)
    return messages

@api_router.get("/chat/sessions")
async def get_chat_sessions(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {"_id": "$session_id", "last_message": {"$last": "$content"}, "timestamp": {"$last": "$timestamp"}, "count": {"$sum": 1}}},
        {"$sort": {"timestamp": -1}},
        {"$limit": 20}
    ]
    sessions = await db.chat_messages.aggregate(pipeline).to_list(20)
    return [{"session_id": s["_id"], "last_message": s["last_message"][:60], "timestamp": s["timestamp"], "message_count": s["count"]} for s in sessions]

# ============ AMBULANCE ============

@api_router.post("/ambulance/request")
async def request_ambulance(data: AmbulanceRequest, user=Depends(get_current_user)):
    req_doc = data.model_dump()
    req_doc["id"] = str(uuid.uuid4())
    req_doc["user_id"] = user["id"]
    req_doc["status"] = "dispatched"
    req_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    req_doc["eta_minutes"] = 8
    await db.ambulance_requests.insert_one(req_doc)
    return {k: v for k, v in req_doc.items() if k != "_id"}

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    count = await db.hospitals.count_documents({})
    if count > 0:
        return {"message": f"Already seeded {count} hospitals"}
    
    hospitals = [
        # Kovilpatti area
        {"id": str(uuid.uuid4()), "name": "Government Hospital Kovilpatti", "type": "Government", "city": "Kovilpatti", "state": "Tamil Nadu", "address": "Main Road, Kovilpatti", "lat": 9.1742, "lng": 77.8697, "phone": "+91 4632 222333", "emergency": True, "ambulance": True, "specialties": ["General Medicine", "Emergency", "Pediatrics"], "rating": 4.0, "beds": 200, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "Sri Meenakshi Hospital", "type": "Private", "city": "Kovilpatti", "state": "Tamil Nadu", "address": "Bypass Road, Kovilpatti", "lat": 9.1785, "lng": 77.8620, "phone": "+91 4632 234567", "emergency": True, "ambulance": True, "specialties": ["Cardiology", "Orthopedics", "General Surgery"], "rating": 4.3, "beds": 100, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "Apollo Clinic Kovilpatti", "type": "Private", "city": "Kovilpatti", "state": "Tamil Nadu", "address": "Bazaar Street, Kovilpatti", "lat": 9.1710, "lng": 77.8750, "phone": "+91 4632 245678", "emergency": False, "ambulance": False, "specialties": ["General Medicine", "Dermatology", "ENT"], "rating": 4.5, "beds": 30, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "KMC Primary Health Centre", "type": "Government", "city": "Kovilpatti", "state": "Tamil Nadu", "address": "North Street, Kovilpatti", "lat": 9.1800, "lng": 77.8680, "phone": "+91 4632 256789", "emergency": True, "ambulance": False, "specialties": ["General Medicine", "Maternity"], "rating": 3.8, "beds": 50, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Tuticorin
        {"id": str(uuid.uuid4()), "name": "Government Medical College Hospital", "type": "Government", "city": "Thoothukudi", "state": "Tamil Nadu", "address": "Palayamkottai Road, Thoothukudi", "lat": 8.7642, "lng": 78.1348, "phone": "+91 461 2334455", "emergency": True, "ambulance": True, "specialties": ["Multi-Specialty", "Trauma Center", "ICU"], "rating": 4.2, "beds": 500, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "CSI Hospital Thoothukudi", "type": "Private", "city": "Thoothukudi", "state": "Tamil Nadu", "address": "Beach Road, Thoothukudi", "lat": 8.7800, "lng": 78.1200, "phone": "+91 461 2345678", "emergency": True, "ambulance": True, "specialties": ["Cardiology", "Neurology", "Oncology"], "rating": 4.4, "beds": 250, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Madurai
        {"id": str(uuid.uuid4()), "name": "Meenakshi Mission Hospital", "type": "Private", "city": "Madurai", "state": "Tamil Nadu", "address": "Lake Area, Madurai", "lat": 9.9252, "lng": 78.1198, "phone": "+91 452 2588800", "emergency": True, "ambulance": True, "specialties": ["Heart Surgery", "Kidney Transplant", "Neurosurgery"], "rating": 4.7, "beds": 600, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "Government Rajaji Hospital", "type": "Government", "city": "Madurai", "state": "Tamil Nadu", "address": "Panagal Road, Madurai", "lat": 9.9195, "lng": 78.1270, "phone": "+91 452 2532535", "emergency": True, "ambulance": True, "specialties": ["Emergency", "General Surgery", "Orthopedics", "Pediatrics"], "rating": 4.1, "beds": 1200, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Chennai
        {"id": str(uuid.uuid4()), "name": "Apollo Hospitals Chennai", "type": "Private", "city": "Chennai", "state": "Tamil Nadu", "address": "Greams Lane, Chennai", "lat": 13.0627, "lng": 80.2536, "phone": "+91 44 28296000", "emergency": True, "ambulance": True, "specialties": ["Multi-Specialty", "Heart Surgery", "Organ Transplant"], "rating": 4.8, "beds": 700, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "AIIMS Chennai", "type": "Government", "city": "Chennai", "state": "Tamil Nadu", "address": "East Coast Road, Chennai", "lat": 12.9900, "lng": 80.2200, "phone": "+91 44 22543000", "emergency": True, "ambulance": True, "specialties": ["All Specialties", "Research", "Teaching Hospital"], "rating": 4.6, "beds": 800, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Coimbatore
        {"id": str(uuid.uuid4()), "name": "PSG Hospitals", "type": "Private", "city": "Coimbatore", "state": "Tamil Nadu", "address": "Peelamedu, Coimbatore", "lat": 11.0244, "lng": 77.0022, "phone": "+91 422 2570170", "emergency": True, "ambulance": True, "specialties": ["Cardiology", "Orthopedics", "Neurology"], "rating": 4.5, "beds": 400, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        {"id": str(uuid.uuid4()), "name": "Kovai Medical Center", "type": "Private", "city": "Coimbatore", "state": "Tamil Nadu", "address": "Avanashi Road, Coimbatore", "lat": 11.0168, "lng": 76.9558, "phone": "+91 422 4323800", "emergency": True, "ambulance": True, "specialties": ["Multi-Specialty", "Heart Surgery", "Liver Transplant"], "rating": 4.6, "beds": 550, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Tirunelveli
        {"id": str(uuid.uuid4()), "name": "Tirunelveli Medical College Hospital", "type": "Government", "city": "Tirunelveli", "state": "Tamil Nadu", "address": "High Ground, Tirunelveli", "lat": 8.7139, "lng": 77.7567, "phone": "+91 462 2572736", "emergency": True, "ambulance": True, "specialties": ["General Medicine", "Surgery", "Gynecology"], "rating": 4.0, "beds": 800, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Mumbai
        {"id": str(uuid.uuid4()), "name": "Lilavati Hospital", "type": "Private", "city": "Mumbai", "state": "Maharashtra", "address": "Bandra West, Mumbai", "lat": 19.0509, "lng": 72.8294, "phone": "+91 22 26751000", "emergency": True, "ambulance": True, "specialties": ["Cardiology", "Neurosurgery", "Oncology"], "rating": 4.7, "beds": 300, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Delhi
        {"id": str(uuid.uuid4()), "name": "AIIMS New Delhi", "type": "Government", "city": "New Delhi", "state": "Delhi", "address": "Ansari Nagar, New Delhi", "lat": 28.5672, "lng": 77.2100, "phone": "+91 11 26588500", "emergency": True, "ambulance": True, "specialties": ["All Specialties", "Research", "Super Specialty"], "rating": 4.9, "beds": 2500, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Bangalore
        {"id": str(uuid.uuid4()), "name": "Narayana Health City", "type": "Private", "city": "Bangalore", "state": "Karnataka", "address": "Bommasandra, Bangalore", "lat": 12.8160, "lng": 77.6750, "phone": "+91 80 71222222", "emergency": True, "ambulance": True, "specialties": ["Heart Surgery", "Cancer Care", "Kidney Transplant"], "rating": 4.8, "beds": 3000, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Hyderabad
        {"id": str(uuid.uuid4()), "name": "NIMS Hyderabad", "type": "Government", "city": "Hyderabad", "state": "Telangana", "address": "Punjagutta, Hyderabad", "lat": 17.4100, "lng": 78.4700, "phone": "+91 40 23390774", "emergency": True, "ambulance": True, "specialties": ["Multi-Specialty", "Trauma", "Burn Center"], "rating": 4.3, "beds": 1500, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
        # Kolkata
        {"id": str(uuid.uuid4()), "name": "SSKM Hospital", "type": "Government", "city": "Kolkata", "state": "West Bengal", "address": "AJC Bose Road, Kolkata", "lat": 22.5397, "lng": 88.3426, "phone": "+91 33 22041101", "emergency": True, "ambulance": True, "specialties": ["General Medicine", "Surgery", "Orthopedics"], "rating": 4.1, "beds": 1800, "image": "https://images.unsplash.com/photo-1697120508416-89675565948d?w=400"},
    ]
    
    await db.hospitals.insert_many(hospitals)
    
    # Seed some doctor profiles
    doctors = [
        {"id": str(uuid.uuid4()), "user_id": "seed_doc_1", "doctor_name": "Dr. Anitha Krishnan", "email": "anitha@care.com", "specialization": "General Medicine", "qualification": "MBBS, MD", "experience_years": 12, "hospital_name": "Government Hospital Kovilpatti", "address": "Main Road, Kovilpatti", "city": "Kovilpatti", "state": "Tamil Nadu", "lat": 9.1742, "lng": 77.8697, "phone": "+91 98765 43210", "available": True, "consultation_fee": 200, "languages": ["Tamil", "English"], "rating": 4.6, "reviews_count": 45, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "seed_doc_2", "doctor_name": "Dr. Rajesh Kumar", "email": "rajesh@care.com", "specialization": "Cardiology", "qualification": "MBBS, DM Cardiology", "experience_years": 18, "hospital_name": "Sri Meenakshi Hospital", "address": "Bypass Road, Kovilpatti", "city": "Kovilpatti", "state": "Tamil Nadu", "lat": 9.1785, "lng": 77.8620, "phone": "+91 98765 43211", "available": True, "consultation_fee": 500, "languages": ["Tamil", "English", "Hindi"], "rating": 4.8, "reviews_count": 120, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "seed_doc_3", "doctor_name": "Dr. Priya Selvam", "email": "priya@care.com", "specialization": "Pediatrics", "qualification": "MBBS, DCH", "experience_years": 8, "hospital_name": "Apollo Clinic Kovilpatti", "address": "Bazaar Street, Kovilpatti", "city": "Kovilpatti", "state": "Tamil Nadu", "lat": 9.1710, "lng": 77.8750, "phone": "+91 98765 43212", "available": True, "consultation_fee": 300, "languages": ["Tamil", "English"], "rating": 4.5, "reviews_count": 67, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "seed_doc_4", "doctor_name": "Dr. Mohammed Farook", "email": "farook@care.com", "specialization": "Orthopedics", "qualification": "MBBS, MS Ortho", "experience_years": 15, "hospital_name": "Meenakshi Mission Hospital", "address": "Lake Area, Madurai", "city": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198, "phone": "+91 98765 43213", "available": True, "consultation_fee": 400, "languages": ["Tamil", "English", "Urdu"], "rating": 4.7, "reviews_count": 89, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "seed_doc_5", "doctor_name": "Dr. Lakshmi Narayanan", "email": "lakshmi@care.com", "specialization": "Gynecology", "qualification": "MBBS, DGO, MD", "experience_years": 20, "hospital_name": "Government Rajaji Hospital", "address": "Panagal Road, Madurai", "city": "Madurai", "state": "Tamil Nadu", "lat": 9.9195, "lng": 78.1270, "phone": "+91 98765 43214", "available": True, "consultation_fee": 350, "languages": ["Tamil", "English", "Malayalam"], "rating": 4.9, "reviews_count": 200, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.doctor_profiles.insert_many(doctors)
    return {"message": f"Seeded {len(hospitals)} hospitals and {len(doctors)} doctors"}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    bp_count = await db.bp_records.count_documents({"user_id": user["id"]})
    chat_count = await db.chat_messages.count_documents({"user_id": user["id"], "role": "user"})
    latest_bp = await db.bp_records.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("recorded_at", -1)])
    return {
        "bp_readings": bp_count,
        "ai_consultations": chat_count,
        "latest_bp": latest_bp,
        "hospitals_nearby": 0
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
