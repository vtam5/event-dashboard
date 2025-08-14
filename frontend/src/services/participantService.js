// Uses your responseService first; falls back to common HTTP routes if needed.
import * as Responses from './responseService';

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function getJson(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

function toRow(r, i = 0) {
  return {
    id: r.id ?? i,
    name: r.participantName || r.name || '',
    email: r.participantEmail || r.email || '',
    submittedAt: r.createdAt || r.submittedAt || null,
    answersCount: Array.isArray(r.answers) ? r.answers.length : (r.answerCount ?? 0),
  };
}

/**
 * Returns array of { id, name, email, submittedAt, answersCount }
 */
export async function listParticipants(eventId) {
  // 1) Prefer your responseService functions (matches your codebase)
  const svc = Responses.fetchResponsesAdmin || Responses.fetchResponses;
  if (typeof svc === 'function') {
    try {
      // many of your services accept a params object
      let data = await svc({ eventId, admin: true });
      // if that throws because it expects a positional arg, try again
      if (!data) data = await svc(eventId);
      return (data || []).map(toRow);
    } catch (_) {
      /* fall through to HTTP tries */
    }
  }

  // 2) Try common REST shapes your backend might expose
  try {
    const rs = await getJson(`${BASE}/api/events/${eventId}/responses?admin=1`);
    return (rs || []).map(toRow);
  } catch (_) {}

  // 3) Last fallback (what you just saw 404): keep as a final attempt
  const rs = await getJson(`${BASE}/api/responses?admin=1&eventId=${encodeURIComponent(eventId)}`);
  return (rs || []).map(toRow);
}
