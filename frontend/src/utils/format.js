// Pretty "Sep 20, 2025 • 11:00 AM" from a Date or ISO string
export function prettyDateTime(value, opts = {}) {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
  
    const date = d.toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      ...(opts.date || {})
    })
    const time = d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      ...(opts.time || {})
    })
    return `${date} • ${time}`
  }
  
  function parseDateLike(val) {
    if (!val) return null
    if (val instanceof Date) return val
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? null : d
  }
  
  export function formatDate(val, opts = { month: 'short', day: '2-digit', year: 'numeric' }) {
    const d = parseDateLike(val)
    if (!d) return ''
    return new Intl.DateTimeFormat(undefined, opts).format(d)
  }
  
  export function formatTime(val) {
    if (!val) return ''
    // "HH:mm" or "HH:mm:ss"
    const m = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(String(val))
    if (m) {
      const hours = Number(m[1])
      const minutes = Number(m[2])
      const d = new Date()
      d.setHours(hours, minutes, 0, 0)
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d)
    }
    // Fallback: let Date try
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d)
  }
  
  export function formatEventDateTime(dateVal, timeVal) {
    const d = formatDate(dateVal)
    const t = formatTime(timeVal)
    if (d && t) return `${d} • ${t}`
    return d || t || ''
  }
  
  // Aliases
  export const prettyDate = formatDate
  export const prettyTime = formatTime
  