import axios from 'axios';

function buildBaseURL() {
  // use VITE_API_BASE (single, canonical)
  let raw = (import.meta.env?.VITE_API_BASE || '').trim();

  // default to backend dev port
  if (!raw) return 'http://localhost:3000';

  // support ":3000" shorthand
  if (raw.startsWith(':')) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}${raw}`;
  }

  // add protocol if missing
  if (!/^https?:\/\//i.test(raw)) {
    const { protocol } = window.location;
    return `${protocol}//${raw}`;
  }

  return raw;
}

export const BASE_URL = buildBaseURL();
console.log('[api] BASE_URL =', BASE_URL); // you can remove after confirming

const api = axios.create({
  baseURL: '',              // <- use proxy
  withCredentials: false,
});
export default api;

// Helpers (unchanged)
export const downloadCSV = async (path, { params, filename = 'download.csv' } = {}) => {
  const res = await api.get(path, { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const uploadPublicFile = async (file, fieldName = 'file') => {
  const form = new FormData();
  form.append(fieldName, file);
  const res = await api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadFlyer = async (eventId, file) => {
  const form = new FormData();
  form.append('flyer', file);
  const res = await api.post(`/api/events/${eventId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
