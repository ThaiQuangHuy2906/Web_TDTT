// Lịch sử tìm kiếm lưu trong localStorage
const KEY = 'search_history_v1'
const LIMIT = 20

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function addHistory(query) {
  const q = (query || '').trim()
  if (!q) return loadHistory()
  const current = loadHistory().filter(x => x.toLowerCase() !== q.toLowerCase())
  current.unshift(q)                      // thêm lên đầu
  const next = current.slice(0, LIMIT)    // giới hạn
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeHistory(query) {
  const q = (query || '').trim()
  const next = loadHistory().filter(x => x.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearHistory() {
  localStorage.removeItem(KEY)
  return []
}
