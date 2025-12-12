import axios from 'axios';

// ============================================
// BACKEND API CLIENT - WITH IMPROVED FALLBACK
// ============================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7860';

const backendClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 15000, // Increased to 15s
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
    },
    {
        type: "museum",
        score: 0.7,
        reason: "Khám phá văn hóa",
        name: "Bảo tàng"
    }
];

// ============================================
// HEALTH CHECK WITH RETRY
// ============================================

let backendAvailable = null; // null = unknown, true/false = checked
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

async function checkHealth() {
    // Don't check too frequently
    const now = Date.now();
    if (backendAvailable !== null && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
        return backendAvailable;
    }

    try {
        console.log('🔍 Checking backend health...');
        const response = await axios.get(`${BACKEND_URL}/health`, { 
            timeout: 3000 
        });
        
        backendAvailable = response.data.status === 'healthy';
        lastHealthCheck = now;
        
        console.log(`✅ Backend is ${backendAvailable ? 'ONLINE' : 'OFFLINE'}`);
        return backendAvailable;
        
    } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        backendAvailable = false;
        lastHealthCheck = now;
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
        console.log('💬 Using fallback response (backend offline)');
        return {
            reply: generateSmartFallback(message, location),
            suggestions: []
        };
    }

    try {
        console.log('📤 Sending chat request to backend...');
        
        const response = await backendClient.post('/chat', {
            message,
            history,
            location,
        });
        
        backendAvailable = true;
        console.log('✅ Chat response received from backend');
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Chat API error:', error.message);
        
        // Mark backend as offline
        backendAvailable = false;
        lastHealthCheck = Date.now();
        
        // Return smart fallback
        console.log('💬 Using fallback response');
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
        console.log('💡 Using fallback recommendations (backend offline)');
        return FALLBACK_RECOMMENDATIONS;
    }

    try {
        console.log('📤 Requesting POI recommendations...');
        
        const response = await backendClient.post('/recommend-poi', {
            user_history: userHistory,
            current_location: currentLocation,
            preferences,
        });
        
        backendAvailable = true;
        console.log('✅ Recommendations received from backend');
        
        return response.data.recommendations;
        
    } catch (error) {
        console.error('❌ Recommendation API error:', error.message);
        
        backendAvailable = false;
        lastHealthCheck = Date.now();
        
        console.log('💡 Using fallback recommendations');
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
        console.log('📤 Requesting POI description...');
        
        const response = await backendClient.post('/describe-poi', {
            poi_name: poiName,
            poi_type: poiType,
            location,
        });
        
        backendAvailable = true;
        console.log('✅ Description received from backend');
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Description API error:', error.message);
        
        backendAvailable = false;
        lastHealthCheck = Date.now();
        
        return {
            description: `${poiName} là một ${poiType} tại ${location || 'Việt Nam'}.`,
            highlights: ['Đáng tham quan']
        };
    }
}

/**
 * Health check (manually trigger)
 */
export async function checkBackendHealth() {
    return await checkHealth();
}

/**
 * Get backend status without triggering check
 */
export function getBackendStatus() {
    return {
        available: backendAvailable,
        lastCheck: lastHealthCheck,
        url: BACKEND_URL
    };
}

// ============================================
// SMART FALLBACK GENERATOR
// ============================================

function generateSmartFallback(message, location) {
    const msg = message.toLowerCase();
    const loc = location?.name || 'Việt Nam';
    
    // Food related
    if (msg.includes('ăn') || msg.includes('eat') || msg.includes('food') || 
        msg.includes('restaurant') || msg.includes('nhà hàng') || msg.includes('quán')) {
        return `🍽️ Bạn muốn tìm địa điểm ăn uống gần ${loc}? Hãy thử:\n\n` +
               `1. Sử dụng bộ lọc "Nhà hàng" hoặc "Cà phê"\n` +
               `2. Tìm kiếm trực tiếp tên quán bạn muốn đến\n` +
               `3. Xem danh sách POI gần đây ở sidebar`;
    }
    
    // Tourism
    if (msg.includes('tham quan') || msg.includes('visit') || msg.includes('go') || 
        msg.includes('see') || msg.includes('du lịch')) {
        return `📸 Khám phá ${loc} với các địa điểm thú vị!\n\n` +
               `Thử tìm kiếm:\n` +
               `• Công viên (parks)\n` +
               `• Bảo tàng (museums)\n` +
               `• Điểm ngắm cảnh (viewpoints)\n\n` +
               `Dùng bộ lọc để lọc theo loại địa điểm!`;
    }
    
    // Shopping
    if (msg.includes('mua') || msg.includes('shop') || msg.includes('buy') || 
        msg.includes('market') || msg.includes('chợ') || msg.includes('siêu thị')) {
        return `🛍️ Tìm nơi mua sắm gần ${loc}:\n\n` +
               `• Siêu thị (supermarket)\n` +
               `• Chợ (marketplace)\n` +
               `• Cửa hàng tiện lợi (convenience)\n\n` +
               `Sử dụng bộ lọc "Mua sắm" để xem tất cả!`;
    }
    
    // Hotel
    if (msg.includes('khách sạn') || msg.includes('hotel') || msg.includes('stay') || 
        msg.includes('sleep') || msg.includes('ở') || msg.includes('nghỉ')) {
        return `🏨 Tìm nơi lưu trú:\n\n` +
               `1. Tìm kiếm "khách sạn" hoặc "hotel"\n` +
               `2. Hoặc tìm "nhà nghỉ" / "guest house"\n` +
               `3. Xem trên bản đồ để chọn vị trí phù hợp`;
    }
    
    // Transport
    if (msg.includes('xe') || msg.includes('bus') || msg.includes('taxi') || 
        msg.includes('transport') || msg.includes('đi lại')) {
        return `🚌 Tìm phương tiện di chuyển:\n\n` +
               `• Trạm xe bus (bus_stop)\n` +
               `• Ga tàu (train_station)\n` +
               `• Metro (subway_entrance)\n\n` +
               `Dùng bộ lọc "Giao thông" để xem chi tiết!`;
    }

    // Coffee
    if (msg.includes('cà phê') || msg.includes('cafe') || msg.includes('coffee')) {
        return `☕ Tìm quán cà phê gần ${loc}:\n\n` +
               `1. Chọn bộ lọc "Cà phê"\n` +
               `2. Hoặc tìm kiếm tên quán cụ thể\n` +
               `3. Xem danh sách POI để chọn quán gần nhất`;
    }
    
    // Default - helpful greeting
    return `👋 Xin chào! Tôi là trợ lý bản đồ của bạn.\n\n` +
           `Bạn có thể:\n` +
           `✅ Tìm kiếm địa điểm bằng thanh tìm kiếm\n` +
           `✅ Dùng bộ lọc để xem các loại POI\n` +
           `✅ Click vào bản đồ để chọn vị trí\n` +
           `✅ Xem gợi ý thông minh (💡)\n\n` +
           `Hãy thử hỏi: "Tìm quán cà phê" hoặc "Nhà hàng nào ngon?"`;
}

// ============================================
// EXPORT
// ============================================

export default {
    chatWithAI,
    getPOIRecommendations,
    getPOIDescription,
    checkBackendHealth,
    getBackendStatus,
};