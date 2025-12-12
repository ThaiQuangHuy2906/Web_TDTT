import React, { useMemo } from 'react'
import { POI_TYPES } from '../constants/poiTypes.js'

export default function FilterBar({ selectedTypes = [], onChange }) {
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

  return (
    <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <button onClick={() => toggleAll(true)} style={btn()}>Chọn tất cả</button>
        <button onClick={() => toggleAll(false)} style={btn()}>Bỏ tất cả</button>
      </div>

      {POI_TYPES.map(group => (
        <div key={group.group} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{group.group}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {group.items.map(it => (
              <label key={it.key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(it.key)}
                  onChange={e => setChecked(it.key, e.target.checked)}
                />
                {it.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const btn = () => ({
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f3f4f6',
  cursor: 'pointer',
  fontSize: 12
})
