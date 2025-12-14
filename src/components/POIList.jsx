import React from 'react'

// Skeleton loading component
function SkeletonCard({ dark }) {
    const shimmerStyle = {
        background: dark
            ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
            : 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 8,
    };

    return (
        <div style={{
            borderRadius: 14,
            padding: 14,
            background: dark ? '#1e293b' : '#ffffff',
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            marginBottom: 10,
        }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...shimmerStyle, width: 44, height: 44, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ ...shimmerStyle, height: 16, width: '70%', marginBottom: 8 }} />
                    <div style={{ ...shimmerStyle, height: 12, width: '40%' }} />
                </div>
                <div style={{ ...shimmerStyle, width: 28, height: 28, borderRadius: '50%' }} />
            </div>
        </div>
    );
}

export default function POIList({ pois = [], onClickItem, onHoverItem, selectedPoiId, dark, loading = false }) {
    // Show skeleton when loading
    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <SkeletonCard key={i} dark={dark} />
                ))}
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    if (!pois.length) {
        return (
            <div style={{
                padding: 24,
                textAlign: 'center',
                color: dark ? '#64748b' : '#94a3b8',
                background: dark ? '#1e293b' : '#f8fafc',
                borderRadius: 12,
                border: `1px dashed ${dark ? '#334155' : '#e2e8f0'}`,
            }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
                <div style={{ fontWeight: 500 }}>Chưa có dữ liệu POI</div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    Chọn vị trí trên bản đồ để xem các điểm quan tâm
                </div>
            </div>
        )
    }

    const getTypeColor = (type) => {
        const colors = {
            restaurant: '#ef4444',
            cafe: '#f97316',
            hotel: '#8b5cf6',
            hospital: '#10b981',
            school: '#3b82f6',
            bank: '#06b6d4',
            atm: '#14b8a6',
            pharmacy: '#ec4899',
            supermarket: '#f59e0b',
            park: '#22c55e',
            museum: '#a855f7',
            default: '#6366f1',
        }
        return colors[type] || colors.default
    }

    const getTypeIcon = (type) => {
        const icons = {
            restaurant: '🍽️',
            cafe: '☕',
            hotel: '🏨',
            hospital: '🏥',
            school: '🏫',
            bank: '🏦',
            atm: '💳',
            pharmacy: '💊',
            supermarket: '🛒',
            park: '🌳',
            museum: '🏛️',
            fuel: '⛽',
            default: '📍',
        }
        return icons[type] || icons.default
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pois.map((p, i) => {
                const selected = p.id === selectedPoiId
                const typeColor = getTypeColor(p.type)
                const typeIcon = getTypeIcon(p.type)

                return (
                    <div
                        key={p.id}
                        onClick={() => onClickItem?.(p)}
                        onMouseEnter={() => onHoverItem?.(p.id)}
                        onMouseLeave={() => onHoverItem?.(null)}
                        style={{
                            borderRadius: 14,
                            padding: 14,
                            background: selected
                                ? (dark
                                    ? 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)'
                                    : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)')
                                : (dark ? '#1e293b' : '#ffffff'),
                            border: `1.5px solid ${selected ? '#3b82f6' : (dark ? '#334155' : '#e2e8f0')}`,
                            color: dark ? '#f1f5f9' : '#1e293b',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: selected
                                ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                                : '0 1px 3px rgba(0, 0, 0, 0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseOver={(e) => {
                            if (!selected) {
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!selected) {
                                e.currentTarget.style.borderColor = dark ? '#334155' : '#e2e8f0';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                            }
                        }}
                    >
                        {/* Gradient accent line */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            background: `linear-gradient(180deg, ${typeColor} 0%, ${typeColor}88 100%)`,
                            borderRadius: '4px 0 0 4px',
                        }} />

                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 10,
                            marginLeft: 8,
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    lineHeight: 1.3,
                                    marginBottom: 6,
                                }}>
                                    {typeIcon} {p.name || '(Không rõ tên)'}
                                </div>

                                {/* Type Badge */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 20,
                                    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    fontSize: 11,
                                    color: dark ? '#94a3b8' : '#64748b',
                                    marginBottom: 4,
                                }}>
                                    {p.type || 'amenity'}
                                </div>

                                {p.address && (
                                    <div style={{
                                        fontSize: 12,
                                        color: dark ? '#94a3b8' : '#64748b',
                                        marginTop: 4,
                                    }}>
                                        📍 {p.address}
                                    </div>
                                )}
                            </div>

                            {/* Distance & Rank */}
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: selected
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                        : (dark ? '#334155' : '#e2e8f0'),
                                    color: selected ? '#fff' : (dark ? '#94a3b8' : '#64748b'),
                                    fontSize: 12,
                                    fontWeight: 600,
                                    marginBottom: 6,
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#3b82f6',
                                }}>
                                    {p.distanceText}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
