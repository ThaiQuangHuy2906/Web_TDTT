import axios from 'axios';

const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Lấy thời tiết hiện tại từ OpenWeatherMap theo lat/lon.
 *
 * Trả về object chuẩn hoá:
 * {
 *   temp,        // nhiệt độ hiện tại (°C)
 *   feelsLike,   // cảm giác như (°C)
 *   description, // mô tả (tiếng Việt)
 *   icon,        // mã icon, ví dụ "10d"
 *   humidity,    // %
 *   windSpeed,   // m/s
 *   windDeg,     // hướng gió (độ)
 *   clouds,      // % mây
 *   time,        // Date
 *   raw,         // dữ liệu gốc từ API
 * }
 */
export async function getCurrentWeather(lat, lon) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) {
        const err = new Error('Missing OpenWeatherMap API key');
        err.code = 'NO_API_KEY';
        throw err;
    }

    const res = await axios.get(OWM_URL, {
        params: {
            lat,
            lon,
            appid: apiKey,
            units: 'metric', // °C
            lang: 'vi',      // mô tả tiếng Việt
        },
    });

    const d = res.data;
    const w = d.weather?.[0] || {};
    const main = d.main || {};
    const wind = d.wind || {};
    const clouds = d.clouds || {};

    return {
        temp: main.temp,
        feelsLike: main.feels_like,
        description: w.description,
        icon: w.icon,
        humidity: main.humidity,
        windSpeed: wind.speed,
        windDeg: wind.deg,
        clouds: clouds.all,
        time: d.dt ? new Date(d.dt * 1000) : null,
        raw: d,
    };
}
