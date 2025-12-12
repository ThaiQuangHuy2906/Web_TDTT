import axios from 'axios';
import { overpassSelectorsFromTypes } from '../constants/poiTypes.js';
import { haversineDistance, formatDistance } from '../utils/distance.js';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

// Cache theo từng bán kính
const CACHE = new Map();
const CACHE_TTL = 60000; // 60 giây

// Tạo câu query cho Overpass API
function buildUnionAround(lat, lon, radius, selectors) {
  const parts = [];
  selectors.forEach(sel => {
    const tag = sel.includes('=') ? `[${sel}]` : `[${sel}]`;
    parts.push(
      `node${tag}(around:${radius},${lat},${lon});`,
      `way${tag}(around:${radius},${lat},${lon});`,
      `relation${tag}(around:${radius},${lat},${lon});`
    );
  });
  return parts.join('\n');
}

function buildQuery(lat, lon, radius, types) {
  const selectors = overpassSelectorsFromTypes(types);
  const fallback = [
    'amenity=cafe', 'amenity=restaurant', 'amenity=fast_food', 'amenity=bank',
    'amenity=atm', 'amenity=pharmacy', 'amenity=hospital', 'amenity=clinic',
    'shop=supermarket', 'amenity=fuel'
  ];
  const used = selectors?.length ? selectors : fallback;
  const union = buildUnionAround(lat, lon, radius, used);

  return `
[out:json][timeout:25];
(
  ${union}
);
out center tags 200;
  `;
}

// Hàm chính: tìm POI theo bán kính tăng dần + tối ưu
export async function fetchPOIsAdaptive([lat, lon], types = [], signal) {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)},${types.sort().join(',')}`;
  const cacheHit = CACHE.get(key);
  if (cacheHit && Date.now() - cacheHit.time < CACHE_TTL) {
    return cacheHit.data;
  }

  const radii = [1000, 3000, 5000, 10000];

  for (const r of radii) {
    try {
      const query = buildQuery(lat, lon, r, types);
      const res = await axios.post(OVERPASS, query, {
        headers: { 'Content-Type': 'text/plain' },
        signal,
        timeout: 20000,
      });

      const elements = res.data?.elements || [];
      const items = elements
        .map(el => {
          const c = el.center || el;
          const name = el.tags?.name || el.tags?.brand || el.tags?.operator || null;
          const address = [
            el.tags?.addr_housenumber,
            el.tags?.addr_street,
            el.tags?.addr_suburb,
            el.tags?.addr_city,
            el.tags?.addr_district
          ]
            .filter(Boolean)
            .join(', ');

          return {
            id: `${el.type}/${el.id}`,
            lat: c.lat,
            lon: c.lon,
            name,
            address: address || null,
            type: detectTypeFromTags(el.tags),
            tags: el.tags || {},
          };
        })
        .filter(p => p.lat && p.lon);

      items.forEach(p => {
        const d = haversineDistance(lat, lon, p.lat, p.lon);
        p.distance = d;
        p.distanceText = formatDistance(d);
      });

      const top5 = items.sort((a, b) => a.distance - b.distance).slice(0, 5);
      if (top5.length) {
        const result = { items: top5, radius: r };
        CACHE.set(key, { time: Date.now(), data: result });
        return result;
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.warn('⏹ Request cancelled');
        return { items: [], radius: null };
      }
      throw err;
    }
  }

  const empty = { items: [], radius: null };
  CACHE.set(key, { time: Date.now(), data: empty });
  return empty;
}

// Nhận diện loại POI để gắn icon
function detectTypeFromTags(tags = {}) {
  const kv = (k, v) => tags[k] === v;
  if (kv('amenity', 'atm')) return 'atm';
  if (kv('amenity', 'bank')) return 'bank';
  if (kv('amenity', 'cafe')) return 'cafe';
  if (kv('amenity', 'restaurant')) return 'restaurant';
  if (kv('amenity', 'fast_food')) return 'fast_food';
  if (kv('amenity', 'pharmacy')) return 'pharmacy';
  if (kv('amenity', 'hospital')) return 'hospital';
  if (kv('amenity', 'clinic')) return 'clinic';
  if (kv('amenity', 'fuel')) return 'fuel';
  if (kv('shop', 'supermarket')) return 'supermarket';
  if (kv('shop', 'convenience')) return 'convenience';
  if (kv('shop', 'bakery')) return 'bakery';
  if (kv('leisure', 'park')) return 'park';
  if (kv('tourism', 'museum')) return 'museum';
  if (kv('tourism', 'viewpoint')) return 'viewpoint';
  if (kv('highway', 'bus_stop')) return 'bus_stop';
  if (kv('railway', 'station')) return 'train_station';
  if (kv('railway', 'subway_entrance')) return 'subway_entrance';
  if (kv('amenity', 'charging_station')) return 'charging_station';
  if (kv('amenity', 'parking')) return 'parking';
  return 'default';
}
