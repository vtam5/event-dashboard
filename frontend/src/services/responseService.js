// frontend/src/services/responseService.js
import api, { downloadCSV } from './api'

// ------- CRUD -------
export const listResponses = (eventId) =>
  api.get(`/api/events/${eventId}/responses`).then(r => r.data)

export const createResponse = (eventId, payload) =>
  api.post(`/api/events/${eventId}/responses`, payload).then(r => r.data)

export const updateResponse = (eventId, responseId, payload) =>
  api.put(`/api/events/${eventId}/responses/${responseId}`, payload).then(r => r.data)

export const deleteResponse = (eventId, responseId) =>
  api.delete(`/api/events/${eventId}/responses/${responseId}`).then(r => r.data)

// ------- CSV (events list, for Admin dashboard) -------
export const exportEventsCSV = async () => {
  try {
    await downloadCSV(`/api/events/export`, { filename: 'events.csv' })
  } catch {
    await downloadCSV(`/api/events`, { filename: 'events.csv' })
  }
}

// ------- Pretty CSV (one row per submission; question text as columns) -------
export async function exportResponsesCSVPretty(eventId) {
  // 1) questions (for headers + stable order)
  const questions = await api.get(`/api/events/${eventId}/questions`).then(r => r.data || [])
  const qOrder = questions.map(q => ({
    id: String(q.questionId ?? q.id),
    text: q.questionText || `Question ${q.questionId ?? q.id}`
  }))

  // 2) responses
  const responses = await api.get(`/api/events/${eventId}/responses`).then(r => r.data || [])

  // 3) headers
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    ...qOrder.map(q => q.text)
  ].map(csvEscape)

  // 4) rows
  const rows = responses.map(resp => {
    const firstName = resp.firstName ?? resp.participantFirstName ?? ''
    const lastName  = resp.lastName  ?? resp.participantLastName  ?? ''
    const email     = resp.email     ?? resp.participantEmail     ?? ''

    const ansMap = {}
    ;(resp.answers || []).forEach(a => {
      const qid = String(a.questionId ?? a.id)
      ansMap[qid] = a.answerText ?? ''
    })

    const cells = [
      csvEscape(firstName),
      csvEscape(lastName),
      csvEscape(email),
      ...qOrder.map(q => csvEscape(ansMap[q.id] || ''))
    ]
    return cells.join(',')
  })

  // 5) download
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `responses-${eventId}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// helper: escape CSV safely
function csvEscape(val) {
  if (val == null) return ''
  const s = String(val).replace(/\r?\n/g, ' ').trim()
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"`
                       : s
}
