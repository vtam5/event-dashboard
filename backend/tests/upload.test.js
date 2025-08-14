// tests/upload.test.js
const request = require('supertest');
const app     = require('../server');
const pool    = require('../db');

let eventId;

beforeAll(async () => {
  // Clean everything so we start from a blank slate
  await pool.query('DELETE FROM Answers');
  await pool.query('DELETE FROM QuestionOptions');
  await pool.query('DELETE FROM Questions');
  await pool.query('DELETE FROM Responses');
  await pool.query('DELETE FROM Participants');
  await pool.query('DELETE FROM Events');

  // Create a new event to attach uploads to
  const res = await request(app)
    .post('/api/events')
    .send({ name: 'U Event', date: '2026-01-01' });
  eventId = res.body.eventId;
});

describe('Upload API', () => {
  test('POST no file → 400', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/upload`);
    expect(res.status).toBe(400);
  });

  test('POST with file → 200 + flyerPath', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/upload`)
      .attach('flyer', Buffer.from('fake-image-bytes'), 'flyer.png');
    expect(res.status).toBe(200);
    // flyerPath should start with the uploads/ prefix and include "event-"
    expect(res.body.flyerPath).toMatch(/^uploads\/event-/);
  });
});

afterAll(async () => {
  // Close the DB pool when done
  await pool.end();
});
