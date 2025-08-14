const request = require('supertest');
const app     = require('../server');
const pool    = require('../db');

beforeAll(async () => {
  // start with a clean database
  await pool.query('DELETE FROM Answers');
  await pool.query('DELETE FROM QuestionOptions');
  await pool.query('DELETE FROM Questions');
  await pool.query('DELETE FROM Responses');
  await pool.query('DELETE FROM Participants');
  await pool.query('DELETE FROM Events');
});

describe('Events API', () => {
  let eventId;

  test('POST /api/events → 201 + eventId', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ name: 'E Event', date: '2025-11-01' });
    expect(res.status).toBe(201);
    expect(res.body.eventId).toBeGreaterThan(0);
    eventId = res.body.eventId;
  });

  test('GET /api/events → only published by default', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]); // still empty, event is draft
  });

  test('PUT /api/events/:id?admin=1 → publish it', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}?admin=1`)
      .send({ isPublished: 'public' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/events → now includes our event', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.find(e => e.eventId === eventId)).toBeTruthy();
  });

  test('GET /api/events?admin=1 → includes draft & public', async () => {
    const res = await request(app).get('/api/events?admin=1');
    expect(res.status).toBe(200);
    expect(res.body.find(e => e.eventId === eventId)).toBeTruthy();
  });

  test('PUT invalid state → 400', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}?admin=1`)
      .send({ isPublished: 'not-a-state' });
    expect(res.status).toBe(400);
  });

  test('DELETE /api/events/:id?admin=1 → 200', async () => {
    const res = await request(app).delete(`/api/events/${eventId}?admin=1`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE nonexistent → 404', async () => {
    const res = await request(app).delete('/api/events/9999?admin=1');
    expect(res.status).toBe(404);
  });
});

// add at bottom of tests/events.test.js
describe('Admin reorder endpoint', () => {
  it('should 400 without body.order array', async () => {
    await request(app)
      .put('/api/events/reorder')
      .send({})
      .expect(400);
  });
});
