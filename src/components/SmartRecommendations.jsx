import { useState, useEffect } from 'react';
import { getPOIRecommendations } from '../api/backend';

export default function SmartRecommendations({ 
  dark = false, 
  origin = null,
  pois = [],
  onSelectType 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  // Extract user history from recent POIs
  const getUserHistory = () => {
    if (!pois || pois.length === 0) return [];
    
    // Get types from recent POIs
    const types = pois.map(poi => poi.type).filter(Boolean);
    
    // Return unique types (max 10 most recent)
    return [...new Set(types)].slice(0, 10);
  };

  // Load recommendations
  const loadRecommendations = async () => {
    if (!origin) {
      setRecommendations([]);
      return;
    }

    const userHistory = getUserHistory();
    if (userHistory.length === 0) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const currentLocation = {
        lat: origin[0],
        lon: origin[1],
      };

      // This will use fallback if backend is offline
      const results = await getPOIRecommendations(
        userHistory,
        currentLocation,
        { budget: 'medium' }
      );

      setRecommendations(results || []);
      
    } catch (err) {
      console.error('❌ Recommendations error:', err);
      setError(true);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when POIs change (but debounced)
  useEffect(() => {
    // Only load if we have some POI history
    if (pois.length >= 2 && origin) {
      const timer = setTimeout(() => {
        loadRecommendations();
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    } else {
      setRecommendations([]);
    }
  }, [pois.length, origin]);

  // Don't show if no recommendations and not loading
  if (!loading && recommendations.length === 0 && !error) {
    return null;
  }

  if (!expanded) {
    // Compact view
    return (
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 10,
          zIndex: 999,
          background: dark ? '#1e1e1e' : '#fff',
          padding: 10,
          borderRadius: 8,
          border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(true)}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          color: dark ? '#e5e7eb' : '#111',
        }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {loading 
              ? 'Đang phân tích...' 
              : error
              ? 'Thử lại'
              : `${recommendations.length} gợi ý cho bạn`}
          </span>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 10,
        zIndex: 999,
        width: 320,
        maxHeight: 400,
        background: dark ? '#1e1e1e' : '#fff',
        borderRadius: 12,
        border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 12,
          background: dark ? '#2a2a2a' : '#f9fafb',
          borderBottom: `1px solid ${dark ? '#333' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <div style={{ 
              fontWeight: 600, 
              fontSize: 14,
              color: dark ? '#e5e7eb' : '#111',
            }}>
              Gợi ý thông minh
            </div>
            <div style={{ 
              fontSize: 12, 
              opacity: 0.7,
              color: dark ? '#9ca3af' : '#6b7280',
            }}>
              {error ? 'Chế độ offline' : 'Dựa trên sở thích của bạn'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: dark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ×
        </button>
      </div>

      {/* Recommendations List */}
      <div
        style={{
          maxHeight: 320,
          overflowY: 'auto',
          padding: 8,
        }}
      >
        {loading && (
          <div style={{ 
            padding: 20, 
            textAlign: 'center',
            color: dark ? '#9ca3af' : '#6b7280',
          }}>
            ⏳ Đang phân tích...
          </div>
        )}

        {error && !loading && (
          <div style={{
            padding: 12,
            margin: 8,
            borderRadius: 8,
            background: dark ? '#7f1d1d' : '#fee2e2',
            color: dark ? '#fca5a5' : '#dc2626',
            fontSize: 13,
            textAlign: 'center',
          }}>
            ⚠️ AI offline - hiển thị gợi ý cơ bản
          </div>
        )}

        {recommendations.map((rec, index) => (
          <div
            key={index}
            onClick={() => {
              onSelectType?.(rec.type);
              setExpanded(false);
            }}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
              background: dark ? '#2a2a2a' : '#f9fafb',
              border: `1px solid ${dark ? '#333' : '#e5e7eb'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = dark ? '#333' : '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = dark ? '#2a2a2a' : '#f9fafb';
              e.currentTarget.style.borderColor = dark ? '#333' : '#e5e7eb';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: 14,
                color: dark ? '#e5e7eb' : '#111',
              }}>
                {rec.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {rec.score}
              </div>
            </div>
            <div style={{ 
              fontSize: 12, 
              color: dark ? '#9ca3af' : '#6b7280',
              lineHeight: 1.4,
            }}>
              {rec.reason}
            </div>
          </div>
        ))}

        {recommendations.length === 0 && !loading && !error && (
          <div style={{ 
            padding: 20, 
            textAlign: 'center',
            color: dark ? '#9ca3af' : '#6b7280',
          }}>
            Tìm kiếm thêm để nhận gợi ý!
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 8,
          borderTop: `1px solid ${dark ? '#333' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={loadRecommendations}
          disabled={loading || pois.length < 2}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: loading || pois.length < 2
              ? (dark ? '#404040' : '#d1d5db')
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading || pois.length < 2 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Đang tải...' : '🔄 Làm mới gợi ý'}
        </button>
      </div>
    </div>
  );
}