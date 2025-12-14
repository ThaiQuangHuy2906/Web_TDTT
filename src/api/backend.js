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
        console.log('🔍 Checking backend health at:', `${BACKEND_URL}/health`);
        const response = await axios.get(`${BACKEND_URL}/health`, {
            timeout: 5000,
            validateStatus: (status) => status === 200,
            params: { _t: Date.now() } // Cache buster
        });

        console.log('✅ Health check response:', response.data);
        backendAvailable = response.data.status === 'healthy';
        lastHealthCheck = now;

        console.log(`✅ Backend is ${backendAvailable ? 'ONLINE' : 'OFFLINE'}`);
        return backendAvailable;

    } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        console.warn('⚠️ Error details:', { code: error.code, response: error.response?.status });
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
        return generateSmartFallback(message, location);
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
        return generateSmartFallback(message, location);
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

    // Smart responses based on keywords
    if (msg.includes('quán ăn') || msg.includes('nhà hàng') || msg.includes('chỗ nào ăn') || msg.includes('ngon')) {
        return {
            reply: `🍴 Tôi gợi ý bạn tìm kiếm "restaurant" để xem các nhà hàng gần bạn. Bạn có thể lọc theo đánh giá và khoảng cách!`,
            suggestions: ['Tìm nhà hàng gần đây', 'Quán cà phê nào ngon?', 'Địa điểm tham quan']
        };
    }

    if (msg.includes('cà phê') || msg.includes('cafe') || msg.includes('coffee')) {
        return {
            reply: `☕ Bạn muốn tìm quán cà phê? Hãy thử tìm kiếm "cafe" hoặc nhấn vào nút bộ lọc để xem các quán cà phê xung quanh!`,
            suggestions: ['Tìm cafe gần đây', 'Siêu thị ở đâu?', 'Nhà hàng nào ngon?']
        };
    }

    if (msg.includes('siêu thị') || msg.includes('supermarket') || msg.includes('mua sắm')) {
        return {
            reply: `🛍️ Tôi có thể giúp bạn tìm siêu thị gần nhất! Hãy tìm kiếm "supermarket" hoặc dùng bộ lọc.`,
            suggestions: ['Tìm siêu thị gần', 'Công viên ở đâu?', 'Bệnh viện gần nhất']
        };
    }

    if (msg.includes('bệnh viện') || msg.includes('hospital') || msg.includes('y tế')) {
        return {
            reply: `🏥 Tìm bệnh viện gần bạn nhất bằng cách tìm kiếm "hospital" hoặc dùng bộ lọc!`,
            suggestions: ['Tìm bệnh viện gần', 'Nhà thuốc ở đâu?', 'ATM gần nhất']
        };
    }

    if (msg.includes('công viên') || msg.includes('park') || msg.includes('chỗ chơi')) {
        return {
            reply: `🌳 Tìm công viên và không gian xanh gần bạn! Hãy tìm kiếm "park" hoặc dùng bộ lọc.`,
            suggestions: ['Địa điểm du lịch', 'Nhà hàng gần đây', 'Khách sạn nào tốt?']
        };
    }

    if (msg.includes('khách sạn') || msg.includes('hotel') || msg.includes('chỗ ở')) {
        return {
            reply: `🏨 Tìm khách sạn phù hợp với bạn! Hãy tìm kiếm "hotel" và xem đánh giá.`,
            suggestions: ['Khách sạn gần đây', 'Nhà hàng nào ngon?', 'ATM ở đâu?']
        };
    }

    if (msg.includes('đường') || msg.includes('route') || msg.includes('đi đến') || msg.includes('hướng dẫn')) {
        return {
            reply: `🗺️ Để xem hướng dẫn đi, hãy click vào một địa điểm trong danh sách. Tôi sẽ hiển thị đường đi tối ưu và thời gian!`,
            suggestions: ['Tìm quán cà phê', 'Vị trí của tôi', 'Nhà hàng gần đây']
        };
    }

    // Check location context
    if (location) {
        return {
            reply: `📍 Tôi thấy bạn đang ở gần ${location.name || 'vị trí hiện tại'}. Bạn cần tìm gì? Tôi có thể gợi ý nhà hàng, quán cà phê, siêu thị, hoặc các địa điểm khác!`,
            suggestions: ['Tìm nhà hàng gần', 'Quán cafe nào ngon?', 'Siêu thị ở đâu?']
        };
    }

    // Default friendly response
    const responses = [
        {
            reply: `👋 Xin chào! Tôi có thể giúp bạn tìm:
• Nhà hàng, quán ăn
• Quán cà phê
• Siêu thị, cửa hàng
• Bệnh viện, nhà thuốc
• Công viên, địa điểm du lịch
• Khách sạn, ATM, và nhiều hơn!`,
            suggestions: ['Tìm quán ăn gần', 'Quán cafe ở đâu?', 'Địa điểm tham quan']
        },
        {
            reply: `🎉 Tôi là trợ lý AI của OSM-VN! Bạn có thể hỏi tôi về:
• Nhà hàng và quán ăn ngon
• Quán cà phê gần đây
• Siêu thị và cửa hàng tiện lợi
• Các địa điểm du lịch

Hãy thử hỏi tôi!`,
            suggestions: ['Nhà hàng nào ngon?', 'Tìm cafe', 'Siêu thị gần nhất']
        }
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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