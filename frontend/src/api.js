// frontend/src/api.js
export async function fetchEvents(admin=false) {
    const res = await fetch(`/api/events${admin ? '?admin=1' : ''}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  