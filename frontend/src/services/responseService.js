// frontend/src/services/responseService.js
import api from './api';
import { savedResponse } from '../hooks/useSavedResponse';

// ------- CRUD (admin list optional) -------
export const listResponses = (eventId, { admin = false } = {}) =>
  api
    .get(`/api/events/${eventId}/responses`, {
      params: admin ? { admin: 1 } : undefined
    })
    .then(r => r.data);

// ------- CREATE (normalized payload for backend) -------
export async function createResponse(eventId, payload) {
  // payload is expected from public form in "flat" shape, so normalize
  const participant = {
    firstName:  (payload.firstName  || '').trim(),
    lastName:   (payload.lastName   || '').trim(),
    email:      (payload.email      || '').trim(),
    phone:      (payload.phone      || '').trim(),
    homeNumber: (payload.homeNumber || '').trim(),
    street:     (payload.street     || '').trim(),
    apartment:  (payload.apartment  || '').trim(),
    city:       (payload.city       || '').trim(),
    state:      (payload.state      || '').trim(),
    zipcode:    (payload.zipcode    || '').trim(),
  };

  const answers = Array.isArray(payload.answers) ? payload.answers : [];

  const { data } = await api.post(
    `/api/events/${eventId}/responses`,
    { participant, answers }, // backend expects { participant, answers }
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Optionally store token for later edits (public)
  if (data?.editToken) {
    savedResponse.set(eventId, data);
  }

  return data; // { submissionId, editToken, ... }
}

// ------- UPDATE -------
export const updateResponse = async (
  eventId,
  responseId,
  payload,
  { admin = false, token } = {}
) => {
  const headers = {};
  const params = admin ? { admin: 1 } : undefined;

  if (!admin) {
    const t = token || savedResponse.get(eventId)?.editToken;
    if (t) headers['x-edit-token'] = t;
  }

  const { data } = await api.put(
    `/api/events/${eventId}/responses/${responseId}`,
    payload,
    { headers, params }
  );
  return data;
};

// ------- DELETE -------
export const deleteResponse = async (
  eventId,
  responseId,
  { admin = false, token } = {}
) => {
  const headers = {};
  const params = admin ? { admin: 1 } : undefined;

  if (!admin) {
    const t = token || savedResponse.get(eventId)?.editToken;
    if (t) headers['x-edit-token'] = t;
  }

  const { data } = await api.delete(
    `/api/events/${eventId}/responses/${responseId}`,
    { headers, params }
  );

  if (data?.success && !admin) {
    savedResponse.clear(eventId);
  }

  return data;
};
