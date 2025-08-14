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

describe('Responses API', () => {
  let eventId, questionId, submissionId;

  beforeAll(async () => {
    // seed event & question
    let resp = await request(app)
      .post('/api/events')
      .send({ name: 'R Event', date: '2025-12-01' });
    eventId = resp.body.eventId;

    await request(app)
      .put(`/api/events/${eventId}?admin=1`)
      .send({
        isPublished: 'public',
        allowResponseEdit: true,
        capacityLimit: 2
      });

    resp = await request(app)
      .post(`/api/events/${eventId}/questions`)
      .send({ questionText: 'Answer me', questionType: 'text' });
    questionId = resp.body.questionId;
  });

  test('POST /responses → 201', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/responses`)
      .send({ answers: [{ questionId, answerText: 'foo' }] });
    expect(res.status).toBe(201);
    expect(res.body.submissionId).toBeGreaterThan(0);
    submissionId = res.body.submissionId;
  });

  test('GET /responses → include our sub', async () => {
    const res = await request(app).get(
      `/api/events/${eventId}/responses`
    );
    expect(res.status).toBe(200);
    expect(res.body.find(r => r.submissionId === submissionId)).toBeTruthy();
  });

  test('PUT /responses/:rid → 200', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}/responses/${submissionId}`)
      .send({ answers: [{ questionId, answerText: 'bar' }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE /responses/:rid → 200', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}/responses/${submissionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Capacity limit enforcement', async () => {
    await request(app)
      .post(`/api/events/${eventId}/responses`)
      .send({ answers: [{ questionId, answerText: 'a' }] });
    await request(app)
      .post(`/api/events/${eventId}/responses`)
      .send({ answers: [{ questionId, answerText: 'b' }] });

    // 3rd attempt must be 403
    const res = await request(app)
      .post(`/api/events/${eventId}/responses`)
      .send({ answers: [{ questionId, answerText: 'c' }] });
    expect(res.status).toBe(403);
  });
});
