// backend/middleware/ensureEventOpen.js
const pool = require('../db');

function isPastByDateTime(ev) {
  // Optional extra close gate: if you want date/time to auto-disable edits
  if (!ev.date) return false;
  const today = new Date(); const [y,m,d] = String(ev.date).split('-').map(Number);
  const base = new Date(y, m-1, d);
  const nowS = today.getTime();
  const endS =
    ev.endTime ? new Date(y, m-1, d, ...ev.endTime.split(':').map(Number)).getTime()
    : ev.time   ? new Date(y, m-1, d, ...ev.time.split(':').map(Number)).getTime()
    : null;
  return endS != null ? nowS > endS : nowS > base.getTime();
}

module.exports = async function ensureEventOpen(req, res, next) {
  try {
    const { eventId } = req.params;
    const [[ev]] = await pool.query(
      'SELECT status, closeOn, date, time, endTime, capacityLimit FROM Events WHERE eventId = ?',
      [eventId]
    );
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    if (String(ev.status || '').toLowerCase() !== 'open') {
      return res.status(403).json({ error: 'Event is not open' });
    }
    if (ev.closeOn && new Date(ev.closeOn).getTime() <= Date.now()) {
      return res.status(403).json({ error: 'Form closed' });
    }
    if (isPastByDateTime(ev)) {
      return res.status(403).json({ error: 'Event has ended' });
    }
    next();
  } catch (err) { next(err); }
};
