from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
from typing import List, Optional, Tuple
import re

class AIModels:
    """
    Wrapper for AI models used in OSM-VN backend
    Using lightweight models suitable for HuggingFace free tier
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔧 Initializing AI models on {self.device}...")
        
        # Use lightweight Vietnamese-friendly model
        # Alternative: "VietAI/vit5-base" for better Vietnamese support
        self.model_name = "google/flan-t5-small"  # 80MB, fast inference
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            ).to(self.device)
            
            print(f"✅ Model loaded: {self.model_name}")
            self.loaded = True
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            self.loaded = False
    
    def is_loaded(self) -> bool:
        return self.loaded
    
    def generate_chat_response(
        self, 
        message: str, 
        history: List[dict] = None,
        location: dict = None
    ) -> str:
        """
        Generate chatbot response for travel queries
        """
        if not self.loaded:
            return "Xin lỗi, AI chatbot chưa sẵn sàng."
        
        # Build context-aware prompt
        context = self._build_context(history, location)
        
        prompt = f"""You are a helpful travel assistant for Vietnam.
User location: {location.get('name', 'Unknown') if location else 'Unknown'}

Previous conversation:
{context}

User: {message}
Assistant:"""
        
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=150,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Clean up response
            response = response.replace(prompt, "").strip()
            
            # Fallback if model gives empty response
            if not response or len(response) < 10:
                response = self._generate_fallback_response(message, location)
            
            return response
        
        except Exception as e:
            print(f"❌ Chat generation error: {e}")
            return self._generate_fallback_response(message, location)
    
    def generate_poi_description(
        self,
        poi_name: str,
        poi_type: str,
        location: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """
        Generate description and highlights for a POI
        """
        if not self.loaded:
            return self._generate_fallback_description(poi_name, poi_type)
        
        prompt = f"""Generate a short travel description for this place in Vietnam:
Name: {poi_name}
Type: {poi_type}
Location: {location or 'Vietnam'}

Description (2-3 sentences):"""
        
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=100,
                    temperature=0.8,
                    do_sample=True
                )
            
            description = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            description = description.replace(prompt, "").strip()
            
            # Extract highlights (simple keyword extraction)
            highlights = self._extract_highlights(poi_type, description)
            
            if not description or len(description) < 20:
                return self._generate_fallback_description(poi_name, poi_type)
            
            return description, highlights
        
        except Exception as e:
            print(f"❌ Description generation error: {e}")
            return self._generate_fallback_description(poi_name, poi_type)
    
    def extract_suggestions(self, text: str) -> List[str]:
        """
        Extract actionable suggestions from AI response
        """
        suggestions = []
        
        # Look for bullet points or numbered lists
        patterns = [
            r'\d+\.\s*(.+)',  # Numbered lists
            r'[-•]\s*(.+)',   # Bullet points
            r'Try\s+(.+)',    # "Try X"
            r'Visit\s+(.+)',  # "Visit X"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            suggestions.extend([m.strip() for m in matches])
        
        # Return top 3 unique suggestions
        return list(dict.fromkeys(suggestions))[:3]
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    def _build_context(self, history: List[dict], location: dict) -> str:
        if not history:
            return "No previous conversation."
        
        context = ""
        for msg in history[-3:]:  # Last 3 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            context += f"{role.capitalize()}: {content}\n"
        
        return context
    
    def _generate_fallback_response(self, message: str, location: dict) -> str:
        """Simple rule-based fallback when AI fails"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["eat", "food", "restaurant", "ăn"]):
            return f"Tôi gợi ý bạn tìm các nhà hàng gần {location.get('name', 'vị trí hiện tại')}. Hãy thử bộ lọc 'Nhà hàng' hoặc 'Cà phê' trên bản đồ!"
        
        elif any(word in message_lower for word in ["visit", "go", "see", "tham quan"]):
            return "Bạn có thể khám phá các điểm tham quan, công viên, hoặc bảo tàng gần đây. Sử dụng bộ lọc 'Giải trí & Thể thao' để xem thêm!"
        
        elif any(word in message_lower for word in ["hotel", "stay", "sleep", "khách sạn"]):
            return "Để tìm nơi nghỉ ngơi, hãy tìm kiếm 'khách sạn' hoặc 'nhà nghỉ' trên thanh tìm kiếm!"
        
        else:
            return f"Xin chào! Tôi có thể giúp bạn tìm địa điểm ở {location.get('name', 'Việt Nam')}. Hãy hỏi tôi về ăn uống, tham quan, hoặc nơi nghỉ ngơi!"
    
    def _generate_fallback_description(self, poi_name: str, poi_type: str) -> Tuple[str, List[str]]:
        """Simple description when AI fails"""
        type_map = {
            "restaurant": ("Nhà hàng phục vụ ẩm thực đa dạng", ["Ẩm thực", "Không gian thoải mái"]),
            "cafe": ("Quán cà phê lý tưởng để thư giãn", ["Đồ uống", "Wi-Fi", "Không gian yên tĩnh"]),
            "park": ("Công viên xanh mát phù hợp dạo chơi", ["Thiên nhiên", "Thư giãn", "Tập thể dục"]),
            "museum": ("Bảo tàng lưu giữ di sản văn hóa", ["Lịch sử", "Văn hóa", "Giáo dục"]),
        }
        
        desc, highlights = type_map.get(poi_type, (
            f"{poi_name} là một điểm đến thú vị tại Việt Nam.",
            ["Đáng tham quan"]
        ))
        
        return desc, highlights
    
    def _extract_highlights(self, poi_type: str, description: str) -> List[str]:
        """Extract key highlights from description"""
        keywords = {
            "restaurant": ["delicious", "authentic", "famous", "traditional"],
            "cafe": ["cozy", "modern", "relaxing", "popular"],
            "park": ["beautiful", "green", "peaceful", "nature"],
            "museum": ["historical", "cultural", "ancient", "artifacts"],
        }
        
        highlights = []
        desc_lower = description.lower()
        
        for keyword in keywords.get(poi_type, []):
            if keyword in desc_lower:
                highlights.append(keyword.capitalize())
        
        return highlights[:3] if highlights else ["Đáng tham quan"]