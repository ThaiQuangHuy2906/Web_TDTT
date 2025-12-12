import React, { useEffect, useMemo } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup, ZoomControl,
  useMap, useMapEvent, Polyline
} from 'react-leaflet'
import L from 'leaflet'
import { getPoiIcon } from '../utils/poiIcons.js'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker1x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
})

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvent('click', (e) => {
    onMapClick?.([e.latlng.lat, e.latlng.lng])
  })
  return null
}

// Fit bounds để thấy cả origin và POI khi bạn chọn
function FitBoundsOnSelect({ lineStart, selectedPoi }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !selectedPoi || !lineStart) return
    const bounds = L.latLngBounds([lineStart, [selectedPoi.lat, selectedPoi.lon]])
    map.fitBounds(bounds, { padding: [40, 40], animate: true })
  }, [map, selectedPoi, lineStart])
  return null
}

export default function MapView({
  center, origin, zoom, pois,
  onMapClick, selectedPoiId, hoveredPoiId = null, dark = false, route
}) {
  const selectedPoi = useMemo(
    () => pois.find(p => p.id === selectedPoiId) || null,
    [pois, selectedPoiId]
  )

  const lineStart = origin ?? center

  // Polyline đỏ như bạn muốn
  const polyOptions = { color: '#ff0000', weight: 4, opacity: 0.9, dashArray: '6,6' }
  const popupClass = dark ? 'dark-popup' : ''

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      {/* Tile OSM sáng để label không mất */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onMapClick={onMapClick} />
      <ZoomControl position="bottomright" />
      <FlyTo center={center} zoom={zoom} />

      {/* Marker điểm đang chấm (origin) */}
      <Marker position={origin ?? center}>
        <Popup className={popupClass}>📍 Điểm đang chấm</Popup>
      </Marker>

      {/* Marker POI */}
      {pois.map(p => (
        <Marker
          key={p.id}
          position={[p.lat, p.lon]}
          icon={getPoiIcon(p.type, dark, p.id === selectedPoiId, p.id === hoveredPoiId)}
        >
          <Popup className={popupClass}>
            <div style={{ fontWeight: 600 }}>{p.name || '(Không rõ tên)'}</div>
            <div>Loại: {p.type || 'amenity'}</div>
            {p.address && <div>Địa chỉ: {p.address}</div>}
            <div>Khoảng cách: {p.distanceText}</div>
            <div>Tọa độ: {p.lat.toFixed(5)}, {p.lon.toFixed(5)}</div>
          </Popup>
        </Marker>
      ))}

      {/* Đường nối từ origin → POI đã chọn */}
      {selectedPoi && (
        <>
          <Polyline
            positions={[lineStart, [selectedPoi.lat, selectedPoi.lon]]}
            pathOptions={polyOptions}
          />
          <FitBoundsOnSelect lineStart={lineStart} selectedPoi={selectedPoi} />
        </>
      )}

      {/* Vẽ đường đi nếu có */}
      {route && route.coordinates && (
        <Polyline
          positions={route.coordinates}
          pathOptions={{ color: 'red', weight: 4 }}
        />
      )}
    </MapContainer>
  )
}
