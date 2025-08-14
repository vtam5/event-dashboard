/**
 * controllers/eventController.js
 * CRUD + list/sort/reorder + CSV export for Events,
 * using status: 'private' | 'open' | 'closed' | 'archived'
 */

const pool = require('../db');
const { Parser } = require('json2csv');

// ---- helpers ---------------------------------------------------------------

// Build WHERE from admin/when filters.
function buildWhere({ isAdmin, when }) {
  const parts = [];

  // Public should only see open/closed
  if (!isAdmin) {
    parts.push(`e.status IN ('open','closed')`);
  }

  // Back-compat: allow old 'upcoming'/'past', plus new 'active'/'archived'/'all'
  const w = String(when || (isAdmin ? 'all' : 'upcoming')).toLowerCase();

  if (w === 'archived') {
    parts.push(`e.status = 'archived'`);
  } else if (w === 'active') {
    parts.push(`e.status IN ('private','open','closed')`);
  } else if (w === 'past') {
    parts.push(`(
      e.date < CURDATE()
      OR (
        e.date = CURDATE()
        AND (
          (e.endTime IS NOT NULL AND CURTIME() > e.endTime)
          OR (e.endTime IS NULL AND e.time IS NOT NULL AND CURTIME() > e.time)
        )
      )
    )`);
  } else if (w === 'upcoming') {
    parts.push(`NOT (
      e.date < CURDATE()
      OR (
        e.date = CURDATE()
        AND (
          (e.endTime IS NOT NULL AND CURTIME() > e.endTime)
          OR (e.endTime IS NULL AND e.time IS NOT NULL AND CURTIME() > e.time)
        )
      )
    )`);
  } // when=all → no extra filter

  return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
}

// ---- 1) List events --------------------------------------------------------
exports.listEvents = async (req, res, next) => {
  try {
    const isAdmin =
      req.query.admin === true ||
      req.query.admin === 1 ||
      req.query.admin === '1';

    const sortKey = String(req.query.sort || 'eventDate').toLowerCase();
    const when = String(req.query.when || (isAdmin ? 'all' : 'upcoming')).toLowerCase();

    // ⚠️ No auto-close / auto-archive here (read endpoints must not mutate DB)
    const where = buildWhere({ isAdmin, when });

    let orderBy = `e.date ASC, e.time ASC`;
    if (sortKey === 'alpha')   orderBy = `e.name COLLATE utf8mb4_unicode_ci ASC`;
    if (sortKey === 'created') orderBy = `e.eventId DESC`;
    if (sortKey === 'custom')  orderBy = `e.sortOrder ASC`;

    const sql = `
      SELECT
        e.eventId, e.name, e.date, e.time, e.endTime, e.location, e.description,
        e.flyerPath, e.status, e.allowResponseEdit,
        e.capacityLimit, e.closeOn, e.emailConfirmation, e.sortOrder,
        COUNT(DISTINCT r.submissionId) AS responsesCount,
        (e.capacityLimit IS NOT NULL AND COUNT(DISTINCT r.submissionId) >= e.capacityLimit) AS capacityFull,
        (e.closeOn IS NOT NULL AND NOW() > e.closeOn) AS closeOnPassed,
        (
          e.date < CURDATE() OR (
            e.date = CURDATE() AND (
              (e.endTime IS NOT NULL AND CURTIME() > e.endTime)
              OR (e.endTime IS NULL AND e.time IS NOT NULL AND CURTIME() > e.time)
            )
          )
        ) AS isPast
      FROM Events e
      LEFT JOIN Responses r ON r.eventId = e.eventId
      ${where}
      GROUP BY e.eventId
      ORDER BY ${orderBy}
    `;

    const [rows] = await pool.query(sql);

    const normalized = rows.map(r => {
      const responsesCount = Number(r.responsesCount) || 0;
      const capacityFull = !!r.capacityFull;
      const closeOnPassed = !!r.closeOnPassed;
      const isPast = !!r.isPast;
      const statusLower = String(r.status || '').toLowerCase();

      // Only submittable when explicitly open and not otherwise blocked
      const submittable =
        statusLower === 'open' && !capacityFull && !closeOnPassed && !isPast;

      return {
        ...r,
        responsesCount,
        capacityFull,
        closeOnPassed,
        isPast,
        submittable,
        displayStatus: statusLower
      };
    });

    res.json(normalized);
  } catch (err) {
    next(err);
  }
};

// ---- 2) Create event -------------------------------------------------------
exports.createEvent = async (req, res, next) => {
  try {
    const {
      name,
      date,
      time = null,
      endTime = null,
      location = null,
      description = null,
      flyerPath = null,
      status = 'private',      // default
      allowResponseEdit = 1,   // default editable
      capacityLimit = null,
      closeOn = null,
      emailConfirmation = 0,
    } = req.body || {};

    // sanitize status
    const allowed = new Set(['private','open','closed','archived']);
    const safeStatus = allowed.has(String(status).toLowerCase())
      ? String(status).toLowerCase()
      : 'private';

    const [[{ maxOrder }]] = await pool.query(
      'SELECT COALESCE(MAX(sortOrder), 0) AS maxOrder FROM Events'
    );
    const sortOrder = (maxOrder || 0) + 1;

    const [result] = await pool.query(
      `INSERT INTO Events
         (name, date, time, endTime, location, description, flyerPath,
          status, allowResponseEdit, capacityLimit, closeOn, emailConfirmation, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?, ?)`,
      [
        name, date, time, endTime, location, description, flyerPath,
        safeStatus, allowResponseEdit, capacityLimit, closeOn, emailConfirmation, sortOrder
      ]
    );

    res.status(201).json({ eventId: result.insertId });
  } catch (err) {
    next(err);
  }
};

// ---- 3) Update event -------------------------------------------------------
// ---- 4) Update event -------------------------------------------------------
exports.updateEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);      // <-- match route param :id
    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }

    // Allowed fields from body
    const {
      name,
      date,
      time,
      endTime,                // <-- include endTime
      location,
      description,
      status,                 // <-- use new status field
      allowResponseEdit,
      capacityLimit,
      closeOn,
      emailConfirmation,
      flyerPath,             // if you allow changing flyer path
      sortOrder,
    } = req.body || {};

    // sanitize status if present
    const allowedStatus = new Set(['private', 'open', 'closed', 'archived']);
    const safeStatus =
      typeof status === 'string' && allowedStatus.has(status.toLowerCase())
        ? status.toLowerCase()
        : undefined;

    // Build SET clause
    const fields = [];
    const values = [];
    const push = (col, val) => {
      if (val !== undefined) { fields.push(`${col} = ?`); values.push(val); }
    };

    push('name', name);
    push('date', date);
    push('time', time);
    push('endTime', endTime);
    push('location', location);
    push('description', description);
    push('status', safeStatus);
    push('allowResponseEdit', allowResponseEdit);
    push('capacityLimit', capacityLimit);
    push('closeOn', closeOn);
    push('emailConfirmation', emailConfirmation);
    push('flyerPath', flyerPath);
    push('sortOrder', sortOrder);

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    values.push(eventId);

    const [result] = await pool.query(
      `UPDATE Events SET ${fields.join(', ')} WHERE eventId = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found or no changes made' });
    }

    res.json({ success: true, eventId });
  } catch (err) {
    next(err);
  }
};

// ---- 2) Get single event ---------------------------------------------------
exports.getEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid eventId' });

    const isAdmin =
      req.query.admin === '1' || req.query.admin === 'true' || req.query.admin === 1 || req.query.admin === true;

    // If not admin, only return open/closed (publicly visible)
    const [rows] = await pool.query(
      isAdmin
        ? 'SELECT * FROM Events WHERE eventId = ?'
        : "SELECT * FROM Events WHERE eventId = ? AND status IN ('open','closed')",
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};



// ---- 4) Delete event -------------------------------------------------------
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Events WHERE eventId = ?',
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---- 5) Reorder events -----------------------------------------------------
exports.reorderEvents = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'order must be a non-empty array of IDs'
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < order.length; i++) {
        await conn.query(
          'UPDATE Events SET sortOrder = ? WHERE eventId = ?',
          [i + 1, order[i]]
        );
      }

      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
};

// ---- 6) CSV exports --------------------------------------------------------
async function exportCSVImpl(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT eventId, name, date, time, endTime, location, description, status, createdAt
       FROM Events
       ORDER BY createdAt DESC`
    );

    const cols = ['eventId','name','date','time','endTime','location','description','status','createdAt'];
    const esc = s => s == null
      ? ''
      : /[",\n]/.test(String(s))
        ? `"${String(s).replace(/"/g,'""')}"`
        : String(s);

    const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
    res.type('text/csv').send(csv);
  } catch (err) {
    next(err);
  }
}

exports.exportCSV = exportCSVImpl;
exports.exportEventsCSV = exportCSVImpl;

exports.exportAllEvents = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         eventId, name, date, time, endTime, location,
         status, allowResponseEdit, capacityLimit, closeOn, emailConfirmation,
         sortOrder, createdAt
       FROM Events
       ORDER BY date DESC, time DESC`
    );

    const csv = new Parser({ quote: '' }).parse(rows);
    res
      .header('Content-Type', 'text/csv')
      .attachment('events.csv')
      .send(csv);
  } catch (err) {
    next(err);
  }
};
