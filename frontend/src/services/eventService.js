// src/services/eventService.js
import api, { downloadCSV } from './api'

// ---------- helpers ----------
function normalizeEvent(e = {}) {
  const eventId = e.eventId ?? e.id
  const out = { ...e, eventId }
  delete out.id
  return out
}

// ---------- lists / single ----------
/** List events (admin or public). Supports sort + when. */
export const listEvents = async ({ admin = false, sort, when } = {}) => {
  const params = {}
  if (admin) params.admin = 1
  if (sort)  params.sort  = sort
  if (when)  params.when  = when // 'active' | 'archived' | 'upcoming' | 'past' | 'all'
  const res = await api.get('/api/events', { params })
  return Array.isArray(res.data) ? res.data.map(normalizeEvent) : []
}

/** Legacy: get via list (admin side) */
export const getEvent = async (id, { admin = false } = {}) => {
  const list = await listEvents({ admin, when: admin ? 'all' : 'active' })
  return list.find(e => String(e.eventId) === String(id)) || null
}

/** Explicit single fetchers for clarity */
export const fetchEventAdmin  = async (eventId) => getEvent(eventId, { admin: true })
export const fetchEventPublic = async (eventId) => getEvent(eventId, { admin: false })

// ---------- create / update / delete ----------
export const createEvent = async (payload) => {
  const res = await api.post('/api/events', payload)
  return normalizeEvent(res.data)
}

export async function updateEvent(eventId, payload) {
  const out = { ...payload };
  if (typeof out.isPublished !== 'undefined') {
    const v = String(out.isPublished).toLowerCase();
    out.isPublished = (v === 'public' || v === 'true') ? 'public' : 'draft';
  }
  if (typeof out.status !== 'undefined') {
    const v = String(out.status).toLowerCase();
    out.status = (v === 'open') ? 'open' : 'closed';
  }
  const { data } = await api.put(`/api/events/${eventId}`, out);
  return data;
}

export const deleteEvent = async (id) => {
  const res = await api.delete(`/api/events/${id}`, { params: { admin: 1 } })
  return res.data
}

// ---------- flyer / upload ----------
/** Old helper kept for compatibility with EventEditor uploadFlyer(eventId, file) */
export const uploadFlyer = async (eventId, file) => {
  const form = new FormData()
  form.append('flyer', file)
  const res = await api.post(`/api/events/${eventId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data // { flyerPath }
}

/** New generic upload used by EventFormFields */
export const uploadFile = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post(`/api/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data // { path, flyerPath? }
}

// ---------- ordering / export ----------
export const reorderEvents = async (orderedIds) => {
  const res = await api.put('/api/events/reorder', { order: orderedIds }, { params: { admin: 1 } })
  return res.data
}

export const exportEventsCSV = async () =>
  downloadCSV('/api/events/export', { params: { admin: 1 }, filename: 'events.csv' })

// ---------- responses (participants) ----------
/** Admin-only GET in backend; we always send admin=1 */
export const fetchEventResponses = async (eventId, params = {}) => {
  const res = await api.get(`/api/events/${eventId}/responses`, {
    params: { admin: 1, ...params }
  })
  return res.data || []
}

/** Public submit (single definition) */
export const submitResponse = async (eventId, payload) => {
  const res = await api.post(`/api/events/${eventId}/responses`, payload)
  return res.data // { submissionId }
}

/** Single response detail (for participant drawer / view) */
export const fetchResponseDetail = async (eventId, submissionId) => {
  const res = await api.get(`/api/events/${eventId}/responses/${submissionId}`, {
    params: { admin: 1 }
  })
  return res.data
}

/** Alias to satisfy older imports in ParticipantsDrawer */
export const fetchParticipantDetails = fetchResponseDetail

// ---------- questions CRUD ----------
export const fetchQuestions = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/questions`)
  return res.data || []
}

export const createQuestion = async (eventId, payload) => {
  const res = await api.post(`/api/events/${eventId}/questions`, payload)
  return res.data
}

export const updateQuestion = async (eventId, questionId, payload) => {
  const res = await api.put(`/api/events/${eventId}/questions/${questionId}`, payload)
  return res.data
}

export const deleteQuestion = async (eventId, questionId) => {
  const res = await api.delete(`/api/events/${eventId}/questions/${questionId}`)
  return res.data
}

// options
export const addQuestionOption = async (eventId, questionId, optionText) => {
  const res = await api.post(
    `/api/events/${eventId}/questions/${questionId}/options`,
    { optionText }
  )
  return res.data
}

export const updateQuestionOption = async (eventId, questionId, optionId, optionText) => {
  const res = await api.put(
    `/api/events/${eventId}/questions/${questionId}/options/${optionId}`,
    { optionText }
  )
  return res.data
}

export const deleteQuestionOption = async (eventId, questionId, optionId) => {
  const res = await api.delete(
    `/api/events/${eventId}/questions/${questionId}/options/${optionId}`
  )
  return res.data
}

// ---------- legacy single fetch kept for compatibility ----------
export const fetchEvent = async (eventId) => {
  const res = await api.get(`/api/events`, { params: { admin: 1 } })
  const all = res.data || []
  return all.find(e => String(e.eventId) === String(eventId) || String(e.id) === String(eventId))
}
