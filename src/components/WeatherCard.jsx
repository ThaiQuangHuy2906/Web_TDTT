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
        padding: 16,
        borderRadius: 16,
        border: `1px solid ${dark ? 'rgba(64, 64, 64, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
        background: dark
            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
        color: dark ? '#e5e7eb' : '#111827',
        fontSize: 14,
        boxShadow: dark
            ? '0 4px 16px rgba(0, 0, 0, 0.3)'
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(8px)',
    };

    // Chưa cấu hình API key
    if (error === 'NO_API_KEY') {
        return (
            <div style={cardStyle}>
                ⚠ Chưa cấu hình <code>VITE_WEATHER_API_KEY</code> cho OpenWeatherMap.
            </div>
        );
    }

    // Đang tải
    if (loading) {
        return <div style={cardStyle}>🌦 Đang tải thời tiết cho vị trí này…</div>;
    }

    // Lỗi fetch (network, quota, v.v.)
    if (error === 'FETCH_ERROR') {
        return <div style={cardStyle}>⚠ Không lấy được dữ liệu thời tiết hiện tại.</div>;
    }

    // Không có dữ liệu (ví dụ chưa chọn vị trí)
    if (!weather) {
        return <div style={cardStyle}>Chưa có dữ liệu thời tiết.</div>;
    }

    const timeText = weather.time
        ? weather.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : null;

    const iconUrl = weather.icon
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : null;

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {iconUrl && (
                    <img
                        src={iconUrl}
                        alt={weather.description || 'weather icon'}
                        style={{ width: 40, height: 40 }}
                    />
                )}
                <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                        {Math.round(weather.temp)}°C
                    </div>
                    <div style={{ textTransform: 'capitalize' }}>
                        {weather.description || 'Thời tiết hiện tại'}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 4 }}>
                Cảm giác như {Math.round(weather.feelsLike)}°C
            </div>

            <div style={{ marginTop: 2 }}>
                Độ ẩm: {weather.humidity}% • Gió: {weather.windSpeed} m/s
                {typeof weather.clouds === 'number' && ` • Mây: ${weather.clouds}%`}
            </div>

            {timeText && (
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.8 }}>
                    Cập nhật lúc {timeText}
                </div>
            )}
        </div>
    );
}
