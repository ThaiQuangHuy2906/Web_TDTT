import React from 'react';

/**
 * Props:
 *  - weather: object | null (dữ liệu từ getCurrentWeather)
 *  - loading: boolean
 *  - error: 'NO_API_KEY' | 'FETCH_ERROR' | null
 *  - dark: boolean
 */
export default function WeatherCard({ weather, loading, error, dark }) {
    const cardStyle = {
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        background: dark
            ? 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#ffffff',
        fontSize: 13,
        boxShadow: dark
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(139, 92, 246, 0.3)',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
    };

    const overlayStyle = {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
    };

    const errorCardStyle = {
        ...cardStyle,
        background: dark
            ? 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)'
            : 'linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)',
        color: dark ? '#fca5a5' : '#991b1b',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
    };

    // Chưa cấu hình API key
    if (error === 'NO_API_KEY') {
        return (
            <div style={errorCardStyle}>
                <div style={overlayStyle}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Chưa cấu hình API</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                            Thêm <code style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '2px 6px',
                                borderRadius: 4
                            }}>VITE_WEATHER_API_KEY</code>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Đang tải
    if (loading) {
        return (
            <div style={cardStyle}>
                <div style={overlayStyle}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28, animation: 'pulse 2s infinite' }}>🌦️</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>Đang tải thời tiết...</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Vui lòng chờ</div>
                    </div>
                </div>
            </div>
        );
    }

    // Lỗi fetch (network, quota, v.v.)
    if (error === 'FETCH_ERROR') {
        return (
            <div style={errorCardStyle}>
                <div style={overlayStyle}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>⚠️</span>
                    <span>Không lấy được dữ liệu thời tiết</span>
                </div>
            </div>
        );
    }

    // Không có dữ liệu
    if (!weather) {
        return (
            <div style={{
                ...cardStyle,
                background: dark ? '#1e293b' : '#f1f5f9',
                color: dark ? '#94a3b8' : '#64748b',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🌍</span>
                    <span>Chọn vị trí để xem thời tiết</span>
                </div>
            </div>
        );
    }

    const timeText = weather.time
        ? weather.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : null;

    const iconUrl = weather.icon
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : null;

    return (
        <div style={cardStyle}>
            <div style={overlayStyle}></div>

            {/* Main Weather Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {iconUrl && (
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        padding: 4,
                    }}>
                        <img
                            src={iconUrl}
                            alt={weather.description || 'weather icon'}
                            style={{ width: 48, height: 48, display: 'block' }}
                        />
                    </div>
                )}
                <div>
                    <div style={{
                        fontSize: 32,
                        fontWeight: 700,
                        lineHeight: 1,
                        marginBottom: 4,
                    }}>
                        {Math.round(weather.temp)}°C
                    </div>
                    <div style={{
                        textTransform: 'capitalize',
                        fontSize: 14,
                        opacity: 0.9,
                    }}>
                        {weather.description || 'Thời tiết hiện tại'}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 12,
                opacity: 0.9,
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: 20,
                }}>
                    🌡️ Cảm giác như {Math.round(weather.feelsLike)}°C
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: 20,
                }}>
                    💧 {weather.humidity}%
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: 20,
                }}>
                    💨 {weather.windSpeed} m/s
                </div>
                {typeof weather.clouds === 'number' && (
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '4px 10px',
                        borderRadius: 20,
                    }}>
                        ☁️ {weather.clouds}%
                    </div>
                )}
            </div>

            {/* Update Time */}
            {timeText && (
                <div style={{
                    marginTop: 10,
                    fontSize: 11,
                    opacity: 0.7,
                    textAlign: 'right',
                }}>
                    Cập nhật lúc {timeText}
                </div>
            )}
        </div>
    );
}
