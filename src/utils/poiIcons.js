import L from 'leaflet'

const EMOJI = {
  atm: '💳',
  bank: '🏦',
  cafe: '☕',
  restaurant: '🍽️',
  pharmacy: '💊',
  hospital: '🏥',
  fuel: '⛽',
  school: '🏫',
  place_of_worship: '⛪',
  parking: '🅿️',
  electronics: '🔌',
  mobile_phone: '📱',
  marketplace: '🛒',
  clinic: '🩺',
  dentist: '🦷',
  charging_station: '🔋',
  toilets: '🚻',
  cinema: '🎬',
  theatre: '🎭',
  fitness_centre: '🏋️',
  swimming_pool: '🏊',
  stadium: '🏟️',
  pitch: '🏑',
  park: '🌳',
  playground: '🛝',
  viewpoint: '📸',
  museum: '🏛️',
  zoo: '🦁',
  hotel: '🏨',
  guest_house: '🏠',
  university: '🎓',
  library: '📚',
  bus_stop: '🚌',
  train_station: '🚆',
  subway_entrance: '🚇',
  fountain: '⛲',
  drinking_water: '🚰',
  default: '📍',
}

export function getPoiIcon(type = 'default', dark = false, selected = false, highlight = false) {
  const emoji = EMOJI[type] || EMOJI.default
  const bg = selected
    ? (dark ? '#2a3345' : '#eaf2ff')
    : (dark ? '#1f2937' : '#ffffff')
  const border = (selected || highlight)
    ? (dark ? '#3b82f6' : '#2563eb')
    : (dark ? '#374151' : '#e5e7eb')
  const scale = highlight ? 1.35 : (selected ? 1.25 : 1.0);
  const shadow = highlight ? '0 0 12px rgba(37,99,235,0.5)' : 'none';

  return L.divIcon({
    className: 'poi-emoji',
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${28 * scale}px;height:${28 * scale}px;border-radius:${14 * scale}px;
      background:${bg};border:1px solid ${border};
      font-size:${16 * scale}px;
      box-shadow:${shadow};
      transition:all .15s cubic-bezier(0.18,0.89,0.32,1.28);
    ">${emoji}</div>`,
    iconSize: [28 * scale, 28 * scale],
    iconAnchor: [14 * scale, 14 * scale],
    popupAnchor: [0, -12],
  })
}
