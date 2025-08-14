// src/hooks/useSavedResponse.js
export function useSavedResponse(eventId) {
  const key = `resp:${eventId}`;
  const get = () => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
  };
  const set = (obj) => localStorage.setItem(key, JSON.stringify(obj));
  const clear = () => localStorage.removeItem(key);
  return { get, set, clear };
}

// Non-hook helpers if you just want functions
export const savedResponse = {
  get(eventId) {
    try { return JSON.parse(localStorage.getItem(`resp:${eventId}`) || 'null'); }
    catch { return null; }
  },
  set(eventId, obj) {
    localStorage.setItem(`resp:${eventId}`, JSON.stringify(obj));
  },
  clear(eventId) {
    localStorage.removeItem(`resp:${eventId}`);
  },
  link(eventId) {
    const raw = this.get(eventId);
    if (!raw) return null;
    const { submissionId, editToken } = raw;
    return `/events/${eventId}/edit?rid=${submissionId}&token=${encodeURIComponent(editToken)}`;
  }
};
