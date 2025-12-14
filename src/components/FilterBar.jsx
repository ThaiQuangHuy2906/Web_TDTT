import React, { useMemo } from 'react'
import { POI_TYPES } from '../constants/poiTypes.js'

export default function FilterBar({ selectedTypes = [], onChange, dark = false }) {
  const setChecked = (key, checked) => {
    const next = new Set(selectedTypes)
    checked ? next.add(key) : next.delete(key)
    onChange?.(Array.from(next))
  }

  const allKeys = useMemo(() => {
    const arr = []
    POI_TYPES.forEach(g => g.items.forEach(it => arr.push(it.key)))
    return arr
  }, [])

  const toggleAll = (on) => onChange?.(on ? allKeys : [])

  const btnStyle = (active = false) => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    background: active
      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
      : (dark ? '#334155' : '#f1f5f9'),
    color: active ? '#fff' : (dark ? '#e2e8f0' : '#475569'),
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
  })

  const checkboxStyle = {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    fontSize: 13,
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: dark ? '#e2e8f0' : '#334155',
  }

  return (
    <div style={{
      marginTop: 12,
      maxHeight: 250,
      overflowY: 'auto',
      padding: 4,
    }}>
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        padding: '0 4px',
      }}>
        <button
          onClick={() => toggleAll(true)}
          style={btnStyle(selectedTypes.length === allKeys.length)}
        >
          ✓ Chọn tất cả
        </button>
        <button
          onClick={() => toggleAll(false)}
          style={btnStyle(selectedTypes.length === 0)}
        >
          ✕ Bỏ tất cả
        </button>
        <span style={{
          marginLeft: 'auto',
          fontSize: 12,
          color: dark ? '#94a3b8' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 600,
          }}>
            {selectedTypes.length}
          </span>
          đã chọn
        </span>
      </div>

      {/* Filter Groups */}
      {POI_TYPES.map(group => (
        <div key={group.group} style={{ marginBottom: 12 }}>
          <div style={{
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 13,
            color: dark ? '#94a3b8' : '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            paddingLeft: 4,
          }}>
            {group.group}
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}>
            {group.items.map(it => {
              const isChecked = selectedTypes.includes(it.key)
              return (
                <label
                  key={it.key}
                  style={{
                    ...checkboxStyle,
                    background: isChecked
                      ? (dark
                        ? 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)'
                        : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)')
                      : (dark ? '#1e293b' : '#f8fafc'),
                    border: `1px solid ${isChecked ? '#3b82f6' : (dark ? '#334155' : '#e2e8f0')}`,
                    boxShadow: isChecked ? '0 2px 6px rgba(59, 130, 246, 0.15)' : 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={e => setChecked(it.key, e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: '#3b82f6',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontWeight: isChecked ? 500 : 400 }}>
                    {it.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
