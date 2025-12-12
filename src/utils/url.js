// src/utils/url.js
export function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const obj = {}
  for (const [k, v] of params.entries()) obj[k] = v
  return obj
}

export function writeQuery(obj) {
  const params = new URLSearchParams(window.location.search)
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === '') params.delete(k)
    else params.set(k, v)
  })
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}
