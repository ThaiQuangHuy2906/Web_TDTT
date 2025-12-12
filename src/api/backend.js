import axios from 'axios';

// ============================================
// BACKEND API CLIENT
// ============================================

// IMPORTANT: Update this URL after deploying backend
// Get URL from ngrok_url.txt or HuggingFace Space
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7860';

const backendClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Chat with AI assistant
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Object} location - Current location {lat, lon, name}
 * @returns {Promise<{reply: string, suggestions: string[]}>}
 */
export async function chatWithAI(message, history = [], location = null) {
    try {
        const response = await backendClient.post('/chat', {
            message,
            history,
            location,
        });
        return response.data;
    } catch (error) {
        console.error('Chat API error:', error);
        throw new Error('Không thể kết nối với AI chatbot');
    }
}

/**
 * Get POI recommendations based on user history
 * @param {string[]} userHistory - Array of POI types
 * @param {Object} currentLocation - {lat, lon}
 * @param {Object} preferences - User preferences
 * @returns {Promise<Array>} Recommendations
 */
export async function getPOIRecommendations(userHistory, currentLocation, preferences = {}) {
    try {
        const response = await backendClient.post('/recommend-poi', {
            user_history: userHistory,
            current_location: currentLocation,
            preferences,
        });
        return response.data.recommendations;
    } catch (error) {
        console.error('Recommendation API error:', error);
        throw new Error('Không thể lấy gợi ý POI');
    }
}

/**
 * Generate AI description for a POI
 * @param {string} poiName - POI name
 * @param {string} poiType - POI type
 * @param {string} location - Location name
 * @returns {Promise<{description: string, highlights: string[]}>}
 */
export async function getPOIDescription(poiName, poiType, location = null) {
    try {
        const response = await backendClient.post('/describe-poi', {
            poi_name: poiName,
            poi_type: poiType,
            location,
        });
        return response.data;
    } catch (error) {
        console.error('Description API error:', error);
        throw new Error('Không thể tạo mô tả POI');
    }
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function checkBackendHealth() {
    try {
        const response = await backendClient.get('/health');
        return response.data;
    } catch (error) {
        console.error('Health check failed:', error);
        return { status: 'unavailable' };
    }
}

export default {
    chatWithAI,
    getPOIRecommendations,
    getPOIDescription,
    checkBackendHealth,
};