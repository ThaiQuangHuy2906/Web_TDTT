from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
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
        self.model_name = "google/flan-t5-small"  # T5 is Seq2Seq, NOT CausalLM
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

            # IMPORTANT: Flan-T5 → AutoModelForSeq2SeqLM
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                dtype=torch.float16 if self.device == "cuda" else torch.float32
            ).to(self.device)

            # Ensure pad_token exists
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            print(f"✅ Model loaded: {self.model_name}")
            self.loaded = True

        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            self.loaded = False
    
    def is_loaded(self) -> bool:
        return self.loaded
    

    # ===================== CHATBOT =====================

    def generate_chat_response(
        self, 
        message: str, 
        history: List[dict] = None,
        location: dict = None
    ) -> str:

        if not self.loaded:
            return "Xin lỗi, AI chatbot chưa sẵn sàng."
        
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
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            response = response.replace(prompt, "").strip()
            
            if not response or len(response) < 10:
                response = self._generate_fallback_response(message, location)
            
            return response
        
        except Exception as e:
            print(f"❌ Chat generation error: {e}")
            return self._generate_fallback_response(message, location)


    # ===================== POI DESCRIPTION =====================

    def generate_poi_description(
        self,
        poi_name: str,
        poi_type: str,
        location: Optional[str] = None
    ) -> Tuple[str, List[str]]:

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
            
            highlights = self._extract_highlights(poi_type, description)
            
            if not description or len(description) < 20:
                return self._generate_fallback_description(poi_name, poi_type)
            
            return description, highlights
        
        except Exception as e:
            print(f"❌ Description generation error: {e}")
            return self._generate_fallback_description(poi_name, poi_type)


    # ===================== SUGGESTIONS EXTRACTION =====================

    def extract_suggestions(self, text: str) -> List[str]:
        suggestions = []
        
        patterns = [
            r'\d+\.\s*(.+)',
            r'[-•]\s*(.+)',
            r'Try\s+(.+)',
            r'Visit\s+(.+)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            suggestions.extend([m.strip() for m in matches])
        
        return list(dict.fromkeys(suggestions))[:3]
    

    # ===================== HELPERS =====================

    def _build_context(self, history: List[dict], location: dict) -> str:
        if not history:
            return "No previous conversation."
        
        context = ""
        for msg in history[-3:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            context += f"{role.capitalize()}: {content}\n"
        
        return context
    

    def _generate_fallback_response(self, message: str, location: dict) -> str:
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["eat", "food", "restaurant", "ăn"]):
            return f"Tôi gợi ý bạn tìm các nhà hàng gần {location.get('name', 'vị trí hiện tại')}. Hãy thử bộ lọc 'Nhà hàng' hoặc 'Cà phê'!"
        
        elif any(word in message_lower for word in ["visit", "go", "see", "tham quan"]):
            return "Bạn có thể khám phá công viên, bảo tàng hoặc địa điểm nổi bật gần đây!"
        
        elif any(word in message_lower for word in ["hotel", "stay", "sleep", "khách sạn"]):
            return "Hãy thử tìm kiếm 'khách sạn' hoặc 'nhà nghỉ' trong thanh tìm kiếm!"
        
        else:
            return f"Xin chào! Tôi có thể giúp bạn tìm địa điểm ở {location.get('name', 'Việt Nam')}."


    def _generate_fallback_description(self, poi_name: str, poi_type: str) -> Tuple[str, List[str]]:
        type_map = {
            "restaurant": ("Nhà hàng phục vụ ẩm thực đa dạng", ["Ẩm thực", "Không gian thoải mái"]),
            "cafe": ("Quán cà phê lý tưởng để thư giãn", ["Đồ uống", "Không gian yên tĩnh"]),
            "park": ("Công viên xanh mát phù hợp dạo chơi", ["Thiên nhiên", "Thư giãn"]),
            "museum": ("Bảo tàng lưu giữ di sản văn hóa", ["Lịch sử", "Giáo dục"]),
        }
        
        desc, highlights = type_map.get(poi_type, (
            f"{poi_name} là một điểm đến thú vị tại Việt Nam.",
            ["Đáng tham quan"]
        ))
        
        return desc, highlights
    

    def _extract_highlights(self, poi_type: str, description: str) -> List[str]:
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
