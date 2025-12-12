import axios from 'axios'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export async function searchLocation(query) {
    const params = {
        q: query,
        format: 'json',
        addressdetails: 1,
        countrycodes: 'vn',
        limit: 1,
        polygon_geojson: 0,
        email: 'tqhuy2435@clc.fitus.edu.vn',
    }
    const res = await axios.get(NOMINATIM, {
        params,
        headers: { 'Accept-Language': 'vi', 'User-Agent': 'edu-map-demo/1.0' }
    })
    const data = res.data
    if (!Array.isArray(data) || data.length === 0) return null
    return data[0]
}
