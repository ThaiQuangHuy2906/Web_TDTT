import { useState, useEffect, useCallback } from 'react';
import { getPOIRecommendations } from '../api/backend';

// Get color and icon for recommendation type
const getTypeStyle = (type) => {
  const styles = {
    restaurant: { color: '#ef4444', icon: '🍽️', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    cafe: { color: '#f97316', icon: '☕', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
    hotel: { color: '#8b5cf6', icon: '🏨', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
    park: { color: '#22c55e', icon: '🌳', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
    supermarket: { color: '#f59e0b', icon: '🛒', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    museum: { color: '#a855f7', icon: '🏛️', gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' },
    hospital: { color: '#10b981', icon: '🏥', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    bank: { color: '#06b6d4', icon: '🏦', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
    default: { color: '#3b82f6', icon: '📍', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  };
  return styles[type] || styles.default;
};

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
  const getUserHistory = useCallback(() => {
    if (!pois || pois.length === 0) return [];

    // Get types from recent POIs
    const types = pois.map(poi => poi.type).filter(Boolean);

    // Return unique types (max 10 most recent)
    return [...new Set(types)].slice(0, 10);
  }, [pois]);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    if (!origin) {
      setRecommendations([]);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const userHistory = getUserHistory();

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
  }, [origin, getUserHistory]);

  // Load on mount and when POIs change (but debounced)
  useEffect(() => {
    // Load if we have some POI history OR just to get default recommendations
    if (origin) {
      const timer = setTimeout(() => {
        loadRecommendations();
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    } else {
      setRecommendations([]);
    }
  }, [origin, loadRecommendations]);

  // Don't show if no recommendations and not loading
  if (!loading && recommendations.length === 0 && !error && !expanded) {
    return null;
  }

  if (!expanded) {
    // Compact view - Gradient floating button
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 16,
          zIndex: 999,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          padding: '10px 14px',
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => setExpanded(true)}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#fff',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            💡
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {loading
                ? 'Đang phân tích...'
                : error
                  ? 'Xem gợi ý'
                  : `${recommendations.length} gợi ý`}
            </div>
            <div style={{
              fontSize: 11,
              opacity: 0.85,
              marginTop: 2,
            }}>
              Nhấn để xem
            </div>
          </div>
          <div style={{
            marginLeft: 6,
            fontSize: 16,
          }}>→</div>
        </div>
      </div>
    );
  }

  // Expanded view - Beautiful card with gradient header
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 16,
        zIndex: 999,
        width: 300,
        maxHeight: 'calc(100vh - 150px)',
        background: dark ? '#0f172a' : '#ffffff',
        borderRadius: 16,
        border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
        boxShadow: dark
          ? '0 20px 50px rgba(0,0,0,0.6)'
          : '0 20px 50px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Gradient Header */}
      <div
        style={{
          padding: '14px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          right: 40,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
            }}>
              💡
            </div>
            <div>
              <div style={{
                fontWeight: 700,
                fontSize: 18,
                color: '#fff',
              }}>
                Gợi ý thông minh
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 4,
              }}>
                {error ? '⚡ Chế độ offline' : pois.length > 0 ? '✨ Dựa trên sở thích của bạn' : '🎯 Gợi ý phổ biến'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      <div
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        {loading && (
          <div style={{
            padding: 30,
            textAlign: 'center',
            color: dark ? '#64748b' : '#94a3b8',
          }}>
            <div style={{
              fontSize: 32,
              marginBottom: 10,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>⏳</div>
            <div style={{ fontWeight: 500 }}>Đang phân tích...</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>AI đang tìm kiếm gợi ý tốt nhất</div>
          </div>
        )}

        {error && !loading && (
          <div style={{
            padding: 14,
            margin: 4,
            borderRadius: 12,
            background: dark
              ? 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: dark ? '#fca5a5' : '#dc2626',
            fontSize: 13,
            textAlign: 'center',
            border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`,
          }}>
            ⚠️ AI offline - hiển thị gợi ý cơ bản
          </div>
        )}

        {recommendations.map((rec, index) => {
          const typeStyle = getTypeStyle(rec.type);
          return (
            <div
              key={index}
              onClick={() => {
                onSelectType?.(rec.type);
                setExpanded(false);
              }}
              style={{
                padding: 0,
                marginBottom: 12,
                borderRadius: 16,
                background: dark ? '#1e293b' : '#ffffff',
                border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: dark
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${typeStyle.color}33`;
                e.currentTarget.style.borderColor = typeStyle.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = dark
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = dark ? '#334155' : '#e2e8f0';
              }}
            >
              {/* Color accent bar */}
              <div style={{
                height: 4,
                background: typeStyle.gradient,
              }} />

              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: typeStyle.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${typeStyle.color}40`,
                  }}>
                    {typeStyle.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: dark ? '#f1f5f9' : '#1e293b',
                        lineHeight: 1.3,
                      }}>
                        {rec.name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          padding: '5px 12px',
                          borderRadius: 20,
                          background: typeStyle.gradient,
                          color: '#fff',
                          fontWeight: 700,
                          boxShadow: `0 2px 8px ${typeStyle.color}50`,
                          flexShrink: 0,
                        }}
                      >
                        {rec.score}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: dark ? '#94a3b8' : '#64748b',
                      lineHeight: 1.5,
                      marginTop: 6,
                    }}>
                      {rec.reason}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {recommendations.length === 0 && !loading && !error && (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: dark ? '#64748b' : '#94a3b8',
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
              filter: 'grayscale(0.3)',
            }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Tìm kiếm để nhận gợi ý!</div>
            <div style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>
              AI sẽ phân tích và đề xuất địa điểm phù hợp
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 16,
          borderTop: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
          display: 'flex',
          justifyContent: 'center',
          background: dark ? '#0f172a' : '#f8fafc',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadRecommendations();
          }}
          disabled={loading || !origin}
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            border: 'none',
            background: loading || !origin
              ? (dark ? '#334155' : '#e2e8f0')
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            color: loading || !origin ? (dark ? '#64748b' : '#94a3b8') : '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !origin ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: loading || !origin ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.4)',
            width: '100%',
          }}
          onMouseOver={(e) => {
            if (!loading && origin) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading && origin) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
            }
          }}
        >
          {loading ? '⏳ Đang tải...' : '🔄 Làm mới gợi ý'}
        </button>
      </div>
    </div>
  );
}