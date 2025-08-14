// src/services/eventService.js
import api, { downloadCSV, uploadFlyer as uploadFlyerApi } from './api';
import axios from 'axios';

// helper to add ?admin=1
const adminParams = (admin) => (admin ? { admin: 1 } : undefined);

/* ─────────────────────────────  EVENTS  ───────────────────────────── */
export async function listEvents({ admin = false, when = 'all', sort = 'eventDate' } = {}) {
  const params = { when, sort, ...(admin ? { admin: 1 } : {}) };
  const { data } = await api.get('/api/events', { params });
  return data;
}

export async function createEvent(payload, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.post('/api/events', payload, { params });
  return data;
}

export async function updateEvent(eventId, payload, { admin = false } = {}) {
  const params = admin ? { admin: 1 } : undefined;
  const out = { ...payload };
  if (out.status !== undefined) out.status = String(out.status).toLowerCase();
  const { data } = await api.put(`/api/events/${eventId}`, out, { params });
  return data;
}

export async function deleteEvent(eventId, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.delete(`/api/events/${eventId}`, { params });
  return data;
}

export async function reorderEvents(order, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.put('/api/events/reorder', { order }, { params });
  return data;
}

export async function exportEventsCSV({ admin = false } = {}) {
  const params = adminParams(admin);
  return downloadCSV('/api/events/export', { params, filename: 'events.csv' });
}

// Backend has no GET /events/:id; derive from list()
export async function getEvent(eventId, { admin = false } = {}) {
  const all = await listEvents({ admin, when: 'all' });
  return all.find(e => Number(e.eventId) === Number(eventId)) || null;
}

// Aliases used around the app
export const fetchEvent = getEvent;
export async function fetchEventPublic(eventId) {  // public view (open/closed only)
  return getEvent(eventId, { admin: false });
}
export async function fetchEventAdmin(eventId) {   // admin view (all statuses)
  return getEvent(eventId, { admin: true });
}

/* ───────────────────────────  QUESTIONS  ─────────────────────────── */
export async function fetchQuestions(eventId, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.get(`/api/events/${eventId}/questions`, { params });
  return data;
}

export async function fetchQuestionOptions(eventId, questionId) {
  if (!questionId || !Number.isInteger(questionId)) return [];
  const { data } = await api.get(`/api/events/${eventId}/questions/${questionId}/options`);
  return data;
}

export async function createQuestion(eventId, payload, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.post(`/api/events/${eventId}/questions`, payload, { params });
  return data;
}

export async function updateQuestion(eventId, questionId, payload, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.put(`/api/events/${eventId}/questions/${questionId}`, payload, { params });
  return data;
}

export async function deleteQuestion(eventId, questionId, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.delete(`/api/events/${eventId}/questions/${questionId}`, { params });
  return data;
}

// If you have options endpoints, keep these; otherwise they can remain unused.
export async function addQuestionOption(eventId, questionId, optionText) {
  const { data } = await api.post(
    `/api/events/${eventId}/questions/${questionId}/options`,
    { optionText } // ✅ must match backend validator
  );
  return data; // should include { id, questionId, optionText }
}

export async function updateQuestionOption(eventId, questionId, optionId, optionText) {
  const { data } = await api.put(
    `/api/events/${eventId}/questions/${questionId}/options/${optionId}`,
    { optionText } // ✅ must match backend validator
  );
  return data; // { updated: 1 } or { success: true }
}
export async function deleteQuestionOption(eventId, questionId, optionId) {
  const { data } = await api.delete(
    `/api/events/${eventId}/questions/${questionId}/options/${optionId}`
  );
  return data; // { deleted: 1 } or { success: true }
}
/* ──────────────────────────  RESPONSES (admin)  ────────────────────────── */
export async function fetchEventResponses(eventId, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.get(`/api/events/${eventId}/responses`, { params });
  return data;
}

export async function fetchResponseDetail(eventId, responseId, { admin = false } = {}) {
  const params = adminParams(admin);
  const { data } = await api.get(`/api/events/${eventId}/responses/${responseId}`, { params });
  return data;
}

/* ─────────────────────  RESPONSES (public token view)  ─────────────────── */
export async function fetchResponseByToken(eventId, responseId, token) {
  const headers = { 'x-edit-token': token };
  const { data } = await api.get(`/api/events/${eventId}/responses/${responseId}/view`, { headers });
  return data;
}

// Some UIs expect this name — alias it to the function above
export { fetchResponseByToken as getResponseByToken };

/** Participant-centric list (built from admin list) */
export async function fetchParticipantDetails(eventId, { admin = false } = {}) {
  const rows = await fetchEventResponses(eventId, { admin });
  return rows.map(r => ({
    submissionId: r.submissionId,
    responseId: r.responseId,
    eventId: r.eventId,
    createdAt: r.createdAt,
    firstName: r.participant?.firstName ?? '',
    lastName:  r.participant?.lastName  ?? '',
    email:     r.participant?.email     ?? '',
    phone:     r.participant?.phone     ?? '',
    answers:   r.answers ?? [],
  }));
}

/* ────────────────────────────  UPLOADS  ──────────────────────────── */
export const uploadFlyer = uploadFlyerApi;

/* ─────  RESPONSE create/edit/delete (legacy imports expect from this file) ───── */
export async function submitResponse(eventId, {
  firstName,
  lastName,
  email,
  phone,
  homeNumber,
  street,
  apartment,
  city,
  state,
  zipcode,
  answers
}) {
  const { data } = await api.post(
    `/api/events/${eventId}/responses`,
    {
      firstName,
      lastName,
      email,
      phone,
      homeNumber,
      street,
      apartment,
      city,
      state,
      zipcode,
      answers
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}