const pad = (n) => String(n).padStart(2, '0')

// "YYYY-MM-DD"
function toYMD(val) {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

// "HH:mm"
function toHM(val) {
  if (!val) return ''
  const m = /^(\d{2}):(\d{2})/.exec(String(val))
  if (m) return `${m[1]}:${m[2]}`
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// "YYYY-MM-DDTHH:mm"
function toLocalDateTime(val) {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

// Map legacy isPublished → status if needed
function inferStatus(ev = {}) {
  if (ev.status) return String(ev.status).toLowerCase()
  const ip = String(ev.isPublished || '').toLowerCase()
  if (ip === 'public' || ip === 'published' || ip === 'true') return 'open'
  if (ip === 'draft' || ip === 'false') return 'private'
  return 'private'
}

export function toFormState(ev = {}) {
  return {
    name: ev.name || '',
    date: toYMD(ev.date),
    time: toHM(ev.time),
    endTime: toHM(ev.endTime),
    location: ev.location || '',
    description: ev.description || '',
    flyerPath: ev.flyerPath || '',
    // NEW: status (select in form)
    status: inferStatus(ev),
    allowResponseEdit: !!ev.allowResponseEdit,
    capacityLimit: typeof ev.capacityLimit === 'number' ? ev.capacityLimit : '',
    emailConfirmation: !!ev.emailConfirmation,
    closeOn: toLocalDateTime(ev.closeOn),
  }
}

export function toPayload(values) {
  return {
    name: values.name,
    date: values.date || null,
    time: values.time || null,
    endTime: values.endTime || null,
    location: values.location || null,
    description: values.description || null,
    flyerPath: values.flyerPath || null,
    // NEW: status goes to backend; we no longer send isPublished
    status: values.status || 'private',
    allowResponseEdit: !!values.allowResponseEdit,
    capacityLimit: values.capacityLimit === '' ? null : Number(values.capacityLimit),
    emailConfirmation: !!values.emailConfirmation,
    closeOn: values.closeOn || null,
  }
}
