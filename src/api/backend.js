import axios from 'axios';

// ============================================
// BACKEND API CLIENT - WITH FALLBACK
// ============================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7860';

const backendClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 10000, // Reduce timeout to 10s
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// FALLBACK RESPONSES (When backend unavailable)
// ============================================

const FALLBACK_CHAT_RESPONSES = [
    "Xin lỗi, AI chatbot tạm thời không khả dụng. Bạn có thể thử tìm kiếm địa điểm bằng thanh tìm kiếm!",
    "Hiện tại tôi không thể kết nối với server AI. Hãy thử lại sau nhé! 🤖",
    "Dịch vụ AI đang bảo trì. Bạn vẫn có thể dùng bản đồ và tìm kiếm bình thường!",
];

const FALLBACK_RECOMMENDATIONS = [
    {
        type: "restaurant",
        score: 0.9,
        reason: "Địa điểm phổ biến tại Việt Nam",
        name: "Nhà hàng"
    },
    {
        type: "cafe",
        score: 0.85,
        reason: "Thích hợp để thư giãn",
        name: "Cà phê"
    },
    {
        type: "park",
        score: 0.8,
        reason: "Không gian xanh mát",
        name: "Công viên"
    },
    {
        type: "supermarket",
        score: 0.75,
        reason: "Mua sắm tiện lợi",
        name: "Siêu thị"
    }
];

// ============================================
// HEALTH CHECK WITH RETRY
// ============================================

let backendAvailable = null; // null = unknown, true/false = checked

async function checkHealth() {
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
        backendAvailable = response.data.status === 'healthy';
        return backendAvailable;
    } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        backendAvailable = false;
        return false;
    }
}

// Check on first import
checkHealth();

// ============================================
// API FUNCTIONS WITH FALLBACK
// ============================================

/**
 * Chat with AI assistant
 */
export async function chatWithAI(message, history = [], location = null) {
    // Quick check if backend known to be down
    if (backendAvailable === false) {
        return {
            reply: FALLBACK_CHAT_RESPONSES[Math.floor(Math.random() * FALLBACK_CHAT_RESPONSES.length)],
            suggestions: []
        };
    }

    try {
        const response = await backendClient.post('/chat', {
            message,
            history,
            location,
        });
        
        backendAvailable = true;
        return response.data;
        
    } catch (error) {
        console.error('❌ Chat API error:', error.message);
        backendAvailable = false;
        
        // Return fallback instead of throwing
        return {
            reply: generateSmartFallback(message, location),
            suggestions: []
        };
    }
}

/**
 * Get POI recommendations
 */
export async function getPOIRecommendations(userHistory, currentLocation, preferences = {}) {
    if (backendAvailable === false) {
        return FALLBACK_RECOMMENDATIONS;
    }

    try {
        const response = await backendClient.post('/recommend-poi', {
            user_history: userHistory,
            current_location: currentLocation,
            preferences,
        });
        
        backendAvailable = true;
        return response.data.recommendations;
        
    } catch (error) {
        console.error('❌ Recommendation API error:', error.message);
        backendAvailable = false;
        return FALLBACK_RECOMMENDATIONS;
    }
}

/**
 * Generate AI description for a POI
 */
export async function getPOIDescription(poiName, poiType, location = null) {
    if (backendAvailable === false) {
        return {
            description: `${poiName} là một ${poiType} tại ${location || 'Việt Nam'}.`,
            highlights: ['Đáng tham quan']
        };
    }

    try {
        const response = await backendClient.post('/describe-poi', {
            poi_name: poiName,
            poi_type: poiType,
            location,
        });
        
        backendAvailable = true;
        return response.data;
        
    } catch (error) {
        console.error('❌ Description API error:', error.message);
        backendAvailable = false;
        
        return {
            description: `${poiName} là một ${poiType} tại ${location || 'Việt Nam'}.`,
            highlights: ['Đáng tham quan']
        };
    }
}

/**
 * Health check
 */
export async function checkBackendHealth() {
    return await checkHealth();
}

// ============================================
// SMART FALLBACK GENERATOR
// ============================================

function generateSmartFallback(message, location) {
    const msg = message.toLowerCase();
    const loc = location?.name || 'Việt Nam';
    
    // Food related
    if (msg.includes('ăn') || msg.includes('eat') || msg.includes('food') || msg.includes('restaurant')) {
        return `🍽️ Bạn muốn tìm địa điểm ăn uống gần ${loc}? Hãy thử bộ lọc "Nhà hàng" hoặc "Cà phê" ở trên!`;
    }
    
    // Tourism
    if (msg.includes('tham quan') || msg.includes('visit') || msg.includes('go') || msg.includes('see')) {
        return `📸 Khám phá ${loc} với các địa điểm như công viên, bảo tàng, viewpoint! Dùng bộ lọc để tìm nhé.`;
    }
    
    // Shopping
    if (msg.includes('mua') || msg.includes('shop') || msg.includes('buy') || msg.includes('market')) {
        return `🛍️ Tìm kiếm siêu thị, chợ, trung tâm thương mại gần ${loc} bằng bộ lọc "Mua sắm"!`;
    }
    
    // Hotel
    if (msg.includes('khách sạn') || msg.includes('hotel') || msg.includes('stay') || msg.includes('sleep')) {
        return `🏨 Tìm kiếm "khách sạn" hoặc "nhà nghỉ" trong thanh tìm kiếm để tìm nơi ở!`;
    }
    
    // Transport
    if (msg.includes('xe') || msg.includes('bus') || msg.includes('taxi') || msg.includes('transport')) {
        return `🚌 Hãy tìm trạm xe bus, ga tàu gần ${loc} bằng bộ lọc "Giao thông"!`;
    }
    
    // Default
    return `👋 Xin chào! Hiện tại AI tạm ngưng, nhưng bạn vẫn có thể:\n\n✅ Tìm kiếm địa điểm\n✅ Xem POI trên bản đồ\n✅ Lưu lịch sử tìm kiếm\n\nHãy thử tìm kiếm "${loc}" để bắt đầu!`;
}

// ============================================
// EXPORT
// ============================================

export default {
    chatWithAI,
    getPOIRecommendations,
    getPOIDescription,
    checkBackendHealth,
};