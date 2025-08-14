const request = require('supertest');
const app     = require('../server');
const pool    = require('../db');

beforeAll(async () => {
  await pool.query('DELETE FROM Answers');
  await pool.query('DELETE FROM QuestionOptions');
  await pool.query('DELETE FROM Questions');
  await pool.query('DELETE FROM Responses');
  await pool.query('DELETE FROM Participants');
  await pool.query('DELETE FROM Events');
});

describe('Questions API', () => {
  let eventId, questionId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ name: 'Q Event', date: '2025-12-15' });
    eventId = res.body.eventId;
    await request(app)
      .put(`/api/events/${eventId}?admin=1`)
      .send({ isPublished: 'public' });
  });

  test('POST /api/events/:eid/questions → 201', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/questions`)
      .send({ questionText: 'What?', questionType: 'text' });
    expect(res.status).toBe(201);
    expect(res.body.questionId).toBeGreaterThan(0);
    questionId = res.body.questionId;
  });

  test('GET /api/events/:eid/questions → includes one', async () => {
    const res = await request(app).get(`/api/events/${eventId}/questions`);
    expect(res.status).toBe(200);
    expect(res.body.find(q => q.questionId === questionId)).toBeTruthy();
  });

  test('PUT /api/events/:eid/questions/:qid → update text', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}/questions/${questionId}`)
      .send({ questionText: 'Edited?', questionType: 'text' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);
  });

  test('DELETE /api/events/:eid/questions/:qid → 200', async () => {
    const res = await request(app).delete(
      `/api/events/${eventId}/questions/${questionId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(1);
  });
});
