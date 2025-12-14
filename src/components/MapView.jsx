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
        <Popup className={popupClass}>
          <div style={{
            padding: 4,
            minWidth: 150,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
            }}>
              <span style={{
                fontSize: 18,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              }}>📍</span>
              Vị trí của bạn
            </div>
            <div style={{
              fontSize: 12,
              opacity: 0.8,
            }}>
              {(origin ?? center)[0].toFixed(5)}, {(origin ?? center)[1].toFixed(5)}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Marker POI */}
      {pois.map(p => {
        const typeColors = {
          restaurant: '#ef4444',
          cafe: '#f97316',
          hotel: '#8b5cf6',
          hospital: '#10b981',
          park: '#22c55e',
          supermarket: '#f59e0b',
          museum: '#a855f7',
          bank: '#06b6d4',
          default: '#3b82f6',
        };
        const typeColor = typeColors[p.type] || typeColors.default;

        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lon]}
            icon={getPoiIcon(p.type, dark, p.id === selectedPoiId, p.id === hoveredPoiId)}
          >
            <Popup className={popupClass}>
              <div style={{ minWidth: 200, padding: 4 }}>
                {/* Header with gradient */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 10,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${typeColor} 0%, ${typeColor}cc 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: `0 2px 8px ${typeColor}40`,
                    flexShrink: 0,
                  }}>
                    {p.type === 'restaurant' ? '🍽️' :
                      p.type === 'cafe' ? '☕' :
                        p.type === 'hotel' ? '🏨' :
                          p.type === 'hospital' ? '🏥' :
                            p.type === 'park' ? '🌳' :
                              p.type === 'supermarket' ? '🛒' :
                                p.type === 'museum' ? '🏛️' :
                                  p.type === 'bank' ? '🏦' : '📍'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}>
                      {p.name || '(Không rõ tên)'}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: `${typeColor}20`,
                      color: typeColor,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {p.type || 'amenity'}
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.address && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ opacity: 0.6 }}>📍</span>
                      <span style={{ opacity: 0.9 }}>{p.address}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ opacity: 0.6 }}>📏</span>
                    <span style={{ fontWeight: 600, color: typeColor }}>{p.distanceText}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

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
