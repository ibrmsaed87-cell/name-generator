from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import random
import requests
import json
import re
import base64
from io import BytesIO
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class SavedName(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_favorite: bool = False

class SavedNameCreate(BaseModel):
    name: str
    category: str

class GenerateNameRequest(BaseModel):
    type: str  # ai, sector, abbreviated, compound, smart_random, geographic, length_based, personality
    language: str  # ar, en
    sector: Optional[str] = None
    length: Optional[int] = None
    personality: Optional[str] = None
    location: Optional[str] = None
    keywords: Optional[List[str]] = None
    count: Optional[int] = 5

class DomainCheckRequest(BaseModel):
    name: str

class LogoImageRequest(BaseModel):
    company_name: str
    style: Optional[str] = "modern"
    colors: Optional[List[str]] = ["blue", "white"]

async def generate_logo_image_free(company_name: str, style: str, colors: List[str]) -> dict:
    """Generate logo image using free Pollinations.ai API"""
    try:
        # Create detailed prompt for logo generation
        color_str = ", ".join(colors)
        
        # Enhanced prompt for better logo generation
        if "ar" in company_name or any(ord(char) > 127 for char in company_name):
            # Arabic company name
            prompt = f"professional business logo design, company name '{company_name}', {style} style, {color_str} colors, minimalist, vector style, clean background, high quality, svg style, corporate branding"
        else:
            # English company name  
            prompt = f"professional business logo design for '{company_name}', {style} style, {color_str} colors, minimalist, vector style, clean background, high quality, svg style, corporate branding"
        
        # Use Pollinations.ai free API (no API key required)
        # This is a completely free service
        pollinations_url = f"https://image.pollinations.ai/prompt/{requests.utils.quote(prompt)}?width=512&height=512&model=flux&enhance=true"
        
        # Download the generated image
        response = requests.get(pollinations_url, timeout=30)
        
        if response.status_code == 200:
            # Convert image to base64 for React Native compatibility
            image_base64 = base64.b64encode(response.content).decode('utf-8')
            image_data_url = f"data:image/png;base64,{image_base64}"
            
            return {
                "success": True,
                "image_url": pollinations_url,
                "image_base64": image_data_url,
                "prompt": prompt
            }
        else:
            # Fallback: generate text-based logo description
            return {
                "success": False,
                "error": f"Image generation failed with status {response.status_code}",
                "fallback_description": f"لوغو احترافي لشركة {company_name} بأسلوب {style} مع ألوان {', '.join(colors)}"
            }
            
    except Exception as e:
        print(f"Logo image generation error: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback_description": f"لوغو احترافي لشركة {company_name}"
        }

# Name generation data
SECTORS_AR = [
    "التكنولوجيا", "التجارة الإلكترونية", "الصحة", "التعليم", "العقارات",
    "السياحة", "المطاعم", "الأزياء", "التمويل", "الاستشارات",
    "البناء", "النقل", "الطاقة", "الإعلام", "الرياضة"
]

SECTORS_EN = [
    "Technology", "E-commerce", "Healthcare", "Education", "Real Estate",
    "Tourism", "Restaurant", "Fashion", "Finance", "Consulting",
    "Construction", "Transportation", "Energy", "Media", "Sports"
]

PERSONALITY_TRAITS_AR = [
    "قوي", "مبدع", "موثوق", "سريع", "ذكي", "عصري", "أنيق", "محترف",
    "دقيق", "مبتكر", "شامل", "متطور", "فعال", "متميز", "رائد"
]

PERSONALITY_TRAITS_EN = [
    "Strong", "Creative", "Reliable", "Fast", "Smart", "Modern", "Elegant", "Professional",
    "Precise", "Innovative", "Comprehensive", "Advanced", "Efficient", "Distinguished", "Pioneer"
]

PREFIXES_AR = ["الـ", "نور", "دار", "بيت", "مؤسسة", "شركة", "مجموعة", "مركز"]
SUFFIXES_AR = ["تك", "برو", "ماكس", "بلس", "سولوشن", "سيستم", "لاب", "ورك"]

PREFIXES_EN = ["Pro", "Smart", "Digital", "Global", "Prime", "Elite", "Ultra", "Neo"]
SUFFIXES_EN = ["Tech", "Pro", "Max", "Plus", "Solutions", "Systems", "Lab", "Works"]

LOCATIONS_AR = [
    "الرياض", "جدة", "الدمام", "مكة", "المدينة", "الخليج", "العربية", "الشرق",
    "الغرب", "الشمال", "الجنوب", "الوسط"
]

LOCATIONS_EN = [
    "Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Gulf", "Arabia", "East",
    "West", "North", "South", "Central"
]

class NameGenerator:
    def __init__(self):
        self.llm_key = os.environ.get('EMERGENT_LLM_KEY')
        
    async def generate_ai_names(self, language: str, sector: Optional[str] = None, keywords: Optional[List[str]] = None, count: int = 5) -> List[str]:
        """Generate names using AI"""
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=f"name_gen_{uuid.uuid4()}",
                system_message="You are a creative business name generator. Generate only the names requested, no explanations."
            ).with_model("openai", "gpt-4o-mini")
            
            if language == "ar":
                prompt = f"أنشئ {count} أسماء شركات إبداعية باللغة العربية"
                if sector:
                    prompt += f" في قطاع {sector}"
                if keywords:
                    prompt += f" تتضمن كلمات: {', '.join(keywords)}"
                prompt += ". اكتب الأسماء فقط، كل اسم في سطر منفصل، بدون ترقيم أو رموز."
            else:
                prompt = f"Generate {count} creative company names in English"
                if sector:
                    prompt += f" for {sector} sector"
                if keywords:
                    prompt += f" incorporating: {', '.join(keywords)}"
                prompt += ". Write only the names, each on a new line, no numbering or symbols."
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Extract names from response
            names = [name.strip() for name in response.split('\n') if name.strip()]
            return names[:count]
        except Exception as e:
            print(f"AI generation error: {e}")
            return self._fallback_names(language, count)
    
    def generate_sector_names(self, language: str, sector: str, count: int = 5) -> List[str]:
        """Generate names based on sector"""
        names = []
        prefixes = PREFIXES_AR if language == "ar" else PREFIXES_EN
        suffixes = SUFFIXES_AR if language == "ar" else SUFFIXES_EN
        
        for _ in range(count):
            if language == "ar":
                name = f"{random.choice(prefixes)}{sector} {random.choice(suffixes)}"
            else:
                name = f"{sector} {random.choice(suffixes)}"
            names.append(name)
        
        return names
    
    def generate_abbreviated_names(self, language: str, keywords: Optional[List[str]] = None, count: int = 5) -> List[str]:
        """Generate abbreviated names"""
        names = []
        
        if keywords and len(keywords) >= 2:
            for _ in range(count):
                # Take first letters of keywords
                abbrev = "".join([word[0].upper() for word in keywords[:3]])
                if language == "ar":
                    name = f"شركة {abbrev}"
                else:
                    name = f"{abbrev} Corp"
                names.append(name)
        else:
            # Default abbreviations
            default_abbrevs = ["ABC", "XYZ", "PQR", "MNO", "DEF"] if language == "en" else ["أ ب ج", "س ص ض", "ق ك ل", "م ن ه", "ت ث ج"]
            for abbrev in default_abbrevs[:count]:
                if language == "ar":
                    name = f"مجموعة {abbrev}"
                else:
                    name = f"{abbrev} Group"
                names.append(name)
        
        return names
    
    def generate_compound_names(self, language: str, count: int = 5) -> List[str]:
        """Generate compound names"""
        names = []
        prefixes = PREFIXES_AR if language == "ar" else PREFIXES_EN
        suffixes = SUFFIXES_AR if language == "ar" else SUFFIXES_EN
        
        for _ in range(count):
            name = f"{random.choice(prefixes)}{random.choice(suffixes)}"
            names.append(name)
        
        return names
    
    def generate_smart_random_names(self, language: str, count: int = 5) -> List[str]:
        """Generate smart random names"""
        names = []
        vowels = "اeiou" if language == "ar" else "aeiou"
        consonants = "بتثجحخدذرزسشصضطظعغفقكلمنهوي" if language == "ar" else "bcdfghjklmnpqrstvwxyz"
        
        for _ in range(count):
            length = random.randint(5, 8)
            name = ""
            for i in range(length):
                if i % 2 == 0:
                    name += random.choice(consonants)
                else:
                    name += random.choice(vowels)
            
            if language == "ar":
                name = f"شركة {name.capitalize()}"
            else:
                name = name.capitalize()
                
            names.append(name)
        
        return names
    
    def generate_geographic_names(self, language: str, location: Optional[str] = None, count: int = 5) -> List[str]:
        """Generate geographic names"""
        names = []
        locations = LOCATIONS_AR if language == "ar" else LOCATIONS_EN
        
        if location:
            locations = [location]
        
        for _ in range(count):
            loc = random.choice(locations)
            suffixes = SUFFIXES_AR if language == "ar" else SUFFIXES_EN
            
            if language == "ar":
                name = f"{loc} {random.choice(suffixes)}"
            else:
                name = f"{loc} {random.choice(suffixes)}"
            
            names.append(name)
        
        return names
    
    def generate_length_based_names(self, language: str, length: int = 6, count: int = 5) -> List[str]:
        """Generate names based on specific length"""
        names = []
        
        for _ in range(count):
            if language == "ar":
                # Arabic name generation with specific length
                chars = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
                name = "".join(random.choice(chars) for _ in range(min(length, 8)))
                name = f"مؤسسة {name}"
            else:
                # English name generation
                chars = "abcdefghijklmnopqrstuvwxyz"
                name = "".join(random.choice(chars) for _ in range(length))
                name = name.capitalize()
            
            names.append(name)
        
        return names
    
    def generate_personality_names(self, language: str, personality: str, count: int = 5) -> List[str]:
        """Generate names based on personality"""
        names = []
        traits = PERSONALITY_TRAITS_AR if language == "ar" else PERSONALITY_TRAITS_EN
        
        if personality not in traits:
            personality = random.choice(traits)
        
        for _ in range(count):
            if language == "ar":
                name = f"{personality} {random.choice(['تك', 'برو', 'سولوشن'])}"
            else:
                name = f"{personality} {random.choice(['Tech', 'Pro', 'Solutions'])}"
            
            names.append(name)
        
        return names
    
    def _fallback_names(self, language: str, count: int) -> List[str]:
        """Fallback names when AI fails"""
        if language == "ar":
            fallback = ["الرائد تك", "النجمة برو", "الإبداع سولوشن", "التميز جروب", "الابتكار لاب"]
        else:
            fallback = ["Pioneer Tech", "Star Pro", "Creative Solutions", "Excellence Group", "Innovation Lab"]
        
        return fallback[:count]

# Initialize name generator
name_generator = NameGenerator()

# Routes
@api_router.get("/")
async def root():
    return {"message": "Spinel Name Generator API"}

@api_router.post("/generate-names")
async def generate_names(request: GenerateNameRequest):
    """Generate company names based on criteria"""
    try:
        names = []
        
        if request.type == "ai":
            names = await name_generator.generate_ai_names(
                request.language, request.sector, request.keywords, request.count
            )
        elif request.type == "sector":
            if not request.sector:
                raise HTTPException(status_code=400, detail="Sector is required for sector-based generation")
            names = name_generator.generate_sector_names(request.language, request.sector, request.count)
        elif request.type == "abbreviated":
            names = name_generator.generate_abbreviated_names(request.language, request.keywords, request.count)
        elif request.type == "compound":
            names = name_generator.generate_compound_names(request.language, request.count)
        elif request.type == "smart_random":
            names = name_generator.generate_smart_random_names(request.language, request.count)
        elif request.type == "geographic":
            names = name_generator.generate_geographic_names(request.language, request.location, request.count)
        elif request.type == "length_based":
            if not request.length:
                request.length = 6
            names = name_generator.generate_length_based_names(request.language, request.length, request.count)
        elif request.type == "personality":
            if not request.personality:
                traits = PERSONALITY_TRAITS_AR if request.language == "ar" else PERSONALITY_TRAITS_EN
                request.personality = random.choice(traits)
            names = name_generator.generate_personality_names(request.language, request.personality, request.count)
        else:
            raise HTTPException(status_code=400, detail="Invalid generation type")
        
        return {"names": names, "type": request.type, "language": request.language}
    
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/check-domain")
async def check_domain(request: DomainCheckRequest):
    """Check domain availability"""
    try:
        # Clean the domain name for better results
        domain_name = (request.name.lower()
                      .replace(" ", "")
                      .replace("شركة", "")
                      .replace("مؤسسة", "")
                      .replace("مجموعة", "")
                      .replace("company", "")
                      .replace("group", "")
                      .replace("corp", "")
                      .strip())
        
        # If domain contains Arabic characters, create English equivalent
        if any(ord(char) > 127 for char in domain_name):
            # Simple transliteration for common Arabic words
            transliterations = {
                'تقنية': 'tech',
                'الابتكار': 'innovation', 
                'الرائد': 'leader',
                'الرقمي': 'digital',
                'سمارت': 'smart',
                'سولوشن': 'solution',
                'تكنولوجيا': 'technology',
                'حلول': 'solutions'
            }
            
            english_name = domain_name
            for arabic, english in transliterations.items():
                english_name = english_name.replace(arabic, english)
            
            # If still contains Arabic, use generic name
            if any(ord(char) > 127 for char in english_name):
                english_name = f"company{random.randint(100, 999)}"
                
            domain_name = english_name
        
        # Check multiple TLDs
        tlds = [".com", ".net", ".org", ".co", ".io", ".sa", ".ae"]
        results = []
        
        for tld in tlds:
            full_domain = f"{domain_name}{tld}"
            try:
                # Simple DNS lookup to check if domain exists
                import socket
                socket.gethostbyname(full_domain)
                available = False
            except socket.gaierror:
                # Domain doesn't resolve, likely available
                available = True
            except Exception:
                # Default to available if we can't check
                available = True
            
            # Set more realistic pricing based on TLD
            prices = {
                ".com": "12-15 USD/year",
                ".net": "13-16 USD/year", 
                ".org": "12-14 USD/year",
                ".co": "30-35 USD/year",
                ".io": "50-60 USD/year",
                ".sa": "25-30 USD/year",
                ".ae": "40-50 USD/year"
            }
            
            results.append({
                "domain": full_domain,
                "available": available,
                "price": prices.get(tld, "15-25 USD/year") if available else None
            })
        
        return {"domain_name": domain_name, "results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-logo")
async def generate_logo(request: LogoImageRequest):
    """Generate logo using AI"""
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"logo_gen_{uuid.uuid4()}",
            system_message="You are a creative logo design assistant. Provide detailed logo descriptions."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Create a detailed description for a logo design for company: {request.company_name}
Style: {request.style}
Colors: {', '.join(request.colors)}

Provide a detailed description including:
1. Logo concept and symbolism
2. Typography suggestions
3. Color scheme details
4. Layout and composition
5. Suitable file formats

Format the response as a JSON with keys: concept, typography, colors, layout, formats"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # For now, return the description. In a real app, you'd integrate with image generation APIs
        return {
            "company_name": request.company_name,
            "logo_description": response,
            "preview_url": None,  # Would be actual logo URL in production
            "download_formats": ["PNG", "SVG", "JPG", "AI"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-logo-image")
async def generate_logo_image(request: LogoImageRequest):
    """Generate actual logo image using AI"""
    try:
        result = await generate_logo_image_free(
            request.company_name,
            request.style,
            request.colors
        )
        
        return {
            "company_name": request.company_name,
            "style": request.style,
            "colors": request.colors,
            "result": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/save-name", response_model=SavedName)
async def save_name(name_data: SavedNameCreate):
    """Save a generated name"""
    saved_name = SavedName(**name_data.dict())
    await db.saved_names.insert_one(saved_name.dict())
    return saved_name

@api_router.get("/saved-names", response_model=List[SavedName])
async def get_saved_names():
    """Get all saved names"""
    names = await db.saved_names.find().to_list(1000)
    return [SavedName(**name) for name in names]

@api_router.delete("/saved-names/{name_id}")
async def delete_saved_name(name_id: str):
    """Delete a saved name"""
    result = await db.saved_names.delete_one({"id": name_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Name not found")
    return {"message": "Name deleted successfully"}

@api_router.put("/saved-names/{name_id}/favorite")
async def toggle_favorite(name_id: str):
    """Toggle favorite status of a saved name"""
    name = await db.saved_names.find_one({"id": name_id})
    if not name:
        raise HTTPException(status_code=404, detail="Name not found")
    
    new_favorite_status = not name.get("is_favorite", False)
    await db.saved_names.update_one(
        {"id": name_id},
        {"$set": {"is_favorite": new_favorite_status}}
    )
    
    return {"message": "Favorite status updated", "is_favorite": new_favorite_status}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()