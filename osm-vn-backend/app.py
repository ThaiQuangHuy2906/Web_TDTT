from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# Import utilities
from utils.ai_models import AIModels
from utils.poi_analyzer import POIAnalyzer

load_dotenv()

app = FastAPI(
    title="OSM-VN AI Backend",
    description="AI-powered backend for OSM-VN map application",
    version="1.0.0"
)

# CORS - Allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI models (load once at startup)
ai_models = AIModels()
poi_analyzer = POIAnalyzer()

# ============================================
# PYDANTIC MODELS (Request/Response schemas)
# ============================================

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    location: Optional[dict] = None  # {lat, lon, name}

class ChatResponse(BaseModel):
    reply: str
    suggestions: Optional[List[str]] = None

class POIRecommendRequest(BaseModel):
    user_history: List[str]  # List of visited POI types
    current_location: dict  # {lat, lon}
    preferences: Optional[dict] = {}

class POIRecommendResponse(BaseModel):
    recommendations: List[dict]  # [{name, type, score, reason}]

class POIDescriptionRequest(BaseModel):
    poi_name: str
    poi_type: str
    location: Optional[str] = None

class POIDescriptionResponse(BaseModel):
    description: str
    highlights: List[str]

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
def read_root():
    return {
        "service": "OSM-VN AI Backend",
        "status": "running",
        "endpoints": [
            "/chat",
            "/recommend-poi",
            "/describe-poi",
            "/health"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": ai_models.is_loaded(),
        "version": "1.0.0"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    AI Chatbot for travel assistance
    """
    try:
        reply = ai_models.generate_chat_response(
            message=request.message,
            history=request.history,
            location=request.location
        )
        
        suggestions = ai_models.extract_suggestions(reply)
        
        return ChatResponse(
            reply=reply,
            suggestions=suggestions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-poi", response_model=POIRecommendResponse)
async def recommend_poi_endpoint(request: POIRecommendRequest):
    """
    Smart POI recommendations based on user history
    """
    try:
        recommendations = poi_analyzer.get_recommendations(
            user_history=request.user_history,
            current_location=request.current_location,
            preferences=request.preferences
        )
        
        return POIRecommendResponse(recommendations=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/describe-poi", response_model=POIDescriptionResponse)
async def describe_poi_endpoint(request: POIDescriptionRequest):
    """
    Generate AI description for a POI
    """
    try:
        description, highlights = ai_models.generate_poi_description(
            poi_name=request.poi_name,
            poi_type=request.poi_type,
            location=request.location
        )
        
        return POIDescriptionResponse(
            description=description,
            highlights=highlights
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NGROK INTEGRATION (Expose API to internet)
# ============================================

def start_ngrok():
    """Start ngrok tunnel"""
    from pyngrok import ngrok

    print("🔄 Đang reset ngrok...")
    ngrok.kill() # Giết chết mọi tiến trình ngrok cũ trước khi chạy cái mới

    auth_token = os.getenv("NGROK_AUTH_TOKEN")
    if not auth_token:
        print("⚠️  NGROK_AUTH_TOKEN not set. API will only be accessible locally.")
        return None
    
    try:
        ngrok.set_auth_token(auth_token)
        port = int(os.getenv("PORT", 7860))
        
        # Start tunnel
        public_url = ngrok.connect(port, bind_tls=True)
        print(f"✅ ngrok tunnel active at: {public_url}")
        print(f"📋 Use this URL in your React app: {public_url}")
        
        return str(public_url)
    except Exception as e:
        print(f"❌ ngrok error: {e}")
        return None

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    # Start ngrok tunnel
    public_url = start_ngrok()
    
    # Save URL to file for easy access
    if public_url:
        with open("ngrok_url.txt", "w") as f:
            f.write(public_url)
        print(f"💾 URL saved to ngrok_url.txt")
    
    # Start FastAPI server
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)