import React from 'react'

export default function POIList({ pois = [], onClickItem, onHoverItem, selectedPoiId, dark }) {
    if (!pois.length) {
        return (
            <div
                style={{
                    color: dark ? '#ffffff' : '#111111',
                    fontSize: 13,
                    padding: '4px 2px',
                }}
            >
                Chưa có dữ liệu POI.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pois.map((p, i) => {
                const selected = p.id === selectedPoiId
                return (
                    <div
                        key={p.id}
                        onClick={() => onClickItem?.(p)}
                        onMouseEnter={() => onHoverItem?.(p.id)}
                        onMouseLeave={() => onHoverItem?.(null)}
                        style={{
                            border: `1px solid ${selected ? '#2563eb' : dark ? '#444' : '#e5e7eb'}`,
                            borderRadius: 8,
                            padding: 8,
                            background: selected
                                ? (dark ? '#2a3345' : '#eaf2ff')
                                : (dark ? '#1e1e1e' : '#fff'),
                            color: dark ? '#f1f1f1' : '#111',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ fontWeight: 600 }}>
                            {i + 1}. {p.name || '(Không rõ tên)'}
                        </div>
                        <div style={{ fontSize: 12, color: '#555' }}>Loại: {p.type || 'amenity'}</div>
                        {p.address && (
                            <div style={{ fontSize: 12, color: '#555' }}>Địa chỉ: {p.address}</div>
                        )}
                        <div style={{ fontSize: 12, color: '#555' }}>Khoảng cách: {p.distanceText}</div>
                    </div>
                )
            })}
        </div>
    )
}
