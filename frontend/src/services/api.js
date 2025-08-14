// src/services/api.js
import axios from 'axios';

function buildBaseURL() {
  let raw = (import.meta?.env?.VITE_API_BASE || '').trim();

  // Default to localhost:3000 if nothing set
  if (!raw) return 'http://localhost:3000';

  // If user put ":3000" → make it "http(s)://<host>:3000"
  if (raw.startsWith(':')) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}${raw}`;
  }

  // If user put "localhost:3000" → add protocol
  if (!/^https?:\/\//i.test(raw)) {
    const { protocol } = window.location;
    return `${protocol}//${raw}`;
  }

  return raw;
}

export const BASE_URL = buildBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

export default api;

// ---- Helpers ----
export const downloadCSV = async (path, { params, filename = 'download.csv' } = {}) => {
  const res = await api.get(path, { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Generic public upload: POST /api/upload  -> { path: "/uploads/..." }
export const uploadPublicFile = async (file, fieldName = 'file') => {
  const form = new FormData();
  form.append(fieldName, file);
  const res = await api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { path }
};

// Event-specific upload (kept for screens that still use it, e.g. EventEditor)
export const uploadFlyer = async (eventId, file) => {
  const form = new FormData();
  form.append('flyer', file);
  const res = await api.post(`/api/events/${eventId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { flyerPath }
};
