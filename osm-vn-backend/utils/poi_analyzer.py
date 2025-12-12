from typing import List, Dict
from collections import Counter
import numpy as np

class POIAnalyzer:
    """
    Analyze user POI history and generate smart recommendations
    """
    
    def __init__(self):
        # POI type relationships (collaborative filtering)
        self.type_similarity = {
            "restaurant": ["cafe", "bakery", "fast_food"],
            "cafe": ["restaurant", "bakery", "park"],
            "park": ["playground", "viewpoint", "cafe"],
            "museum": ["viewpoint", "theatre", "library"],
            "hotel": ["guest_house", "restaurant", "cafe"],
            "supermarket": ["convenience", "marketplace", "bakery"],
            "hospital": ["pharmacy", "clinic", "dentist"],
        }
        
        # POI type scores (popularity/importance)
        self.type_scores = {
            "restaurant": 1.0,
            "cafe": 0.9,
            "park": 0.8,
            "museum": 0.7,
            "supermarket": 0.85,
            "hospital": 0.6,
            "bank": 0.5,
        }
    
    def get_recommendations(
        self,
        user_history: List[str],
        current_location: Dict,
        preferences: Dict = None
    ) -> List[Dict]:
        """
        Generate POI recommendations based on user history
        
        Args:
            user_history: List of POI types user visited (e.g., ["cafe", "restaurant", "park"])
            current_location: {lat, lon}
            preferences: Optional user preferences
        
        Returns:
            List of recommended POI types with scores and reasons
        """
        if not user_history:
            return self._get_default_recommendations()
        
        # Count frequency of each type
        type_counts = Counter(user_history)
        
        # Calculate recommendation scores
        recommendations = {}
        
        # 1. Recommend similar types based on history
        for poi_type, count in type_counts.items():
            similar_types = self.type_similarity.get(poi_type, [])
            
            for similar_type in similar_types:
                if similar_type not in recommendations:
                    recommendations[similar_type] = {
                        "score": 0.0,
                        "reasons": []
                    }
                
                # Score based on how often user visited the original type
                similarity_score = count * 0.3
                recommendations[similar_type]["score"] += similarity_score
                recommendations[similar_type]["reasons"].append(
                    f"Vì bạn thường đến {poi_type}"
                )
        
        # 2. Boost popular types
        for poi_type in recommendations.keys():
            base_score = self.type_scores.get(poi_type, 0.5)
            recommendations[poi_type]["score"] += base_score * 0.2
        
        # 3. Apply preferences if provided
        if preferences:
            budget = preferences.get("budget", "medium")
            if budget == "low":
                if "fast_food" in recommendations:
                    recommendations["fast_food"]["score"] *= 1.2
            elif budget == "high":
                if "restaurant" in recommendations:
                    recommendations["restaurant"]["score"] *= 1.3
        
        # Convert to list and sort by score
        result = []
        for poi_type, data in recommendations.items():
            result.append({
                "type": poi_type,
                "score": round(data["score"], 2),
                "reason": ". ".join(list(set(data["reasons"]))[:2]),  # Max 2 reasons
                "name": self._get_type_display_name(poi_type)
            })
        
        # Sort by score descending
        result.sort(key=lambda x: x["score"], reverse=True)
        
        # Return top 5
        return result[:5]
    
    def _get_default_recommendations(self) -> List[Dict]:
        """
        Default recommendations for new users
        """
        return [
            {
                "type": "restaurant",
                "score": 1.0,
                "reason": "Địa điểm phổ biến nhất",
                "name": "Nhà hàng"
            },
            {
                "type": "cafe",
                "score": 0.9,
                "reason": "Thích hợp để thư giãn",
                "name": "Cà phê"
            },
            {
                "type": "park",
                "score": 0.8,
                "reason": "Không gian xanh mát",
                "name": "Công viên"
            },
            {
                "type": "supermarket",
                "score": 0.7,
                "reason": "Tiện lợi mua sắm",
                "name": "Siêu thị"
            },
            {
                "type": "museum",
                "score": 0.6,
                "reason": "Khám phá văn hóa",
                "name": "Bảo tàng"
            }
        ]
    
    def _get_type_display_name(self, poi_type: str) -> str:
        """
        Map POI type to Vietnamese display name
        """
        name_map = {
            "restaurant": "Nhà hàng",
            "cafe": "Cà phê",
            "fast_food": "Fast food",
            "bakery": "Bánh ngọt",
            "park": "Công viên",
            "museum": "Bảo tàng",
            "hospital": "Bệnh viện",
            "pharmacy": "Nhà thuốc",
            "supermarket": "Siêu thị",
            "bank": "Ngân hàng",
            "atm": "ATM",
            "fuel": "Trạm xăng",
            "hotel": "Khách sạn",
            "viewpoint": "Điểm ngắm cảnh",
            "playground": "Sân chơi",
            "library": "Thư viện",
        }
        
        return name_map.get(poi_type, poi_type.replace("_", " ").title())