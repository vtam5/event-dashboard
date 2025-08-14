import api from './api'

export const listQuestions = (eventId) =>
  api.get(`/api/events/${eventId}/questions`).then(r => r.data)

export const createQuestion = (eventId, payload) =>
  api.post(`/api/events/${eventId}/questions`, payload).then(r => r.data)

export const updateQuestion = (eventId, questionId, payload) =>
  api.put(`/api/events/${eventId}/questions/${questionId}`, payload).then(r => r.data)

export const deleteQuestion = (eventId, questionId) =>
  api.delete(`/api/events/${eventId}/questions/${questionId}`).then(r => r.data)
