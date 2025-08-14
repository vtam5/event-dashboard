// tests/events.sort.test.js
const request = require('supertest');
const app     = require('../server');
const pool    = require('../db');

describe('Events sorting & export', () => {
  let e1, e2, e3;

  beforeAll(async () => {
    // reset + reseed
    await pool.query('DELETE FROM Responses');
    await pool.query('DELETE FROM QuestionOptions');
    await pool.query('DELETE FROM Questions');
    await pool.query('DELETE FROM Events');
    // seed manually in JS so we know IDs
    const r1 = await pool.query(
      `INSERT INTO Events
         (name,date,time,location,description,isPublished,allowResponseEdit,capacityLimit,closeOn,emailConfirmation,sortOrder)
       VALUES ('A','2025-12-01','10:00:00','','', 'public',0,0,NULL,0, 50),
              ('B','2025-11-01','09:00:00','','', 'public',0,0,NULL,0, 20),
              ('C','2025-10-01','08:00:00','','', 'public',0,0,NULL,0, 30)`
    );
    [e1, e2, e3] = [1,2,3]; // assume auto-inc IDs start at 1
  });

  afterAll(() => pool.end());

  test('GET /api/events?sort=alpha', async () => {
    const res = await request(app).get('/api/events?sort=alpha');
    expect(res.body.map(e => e.name)).toEqual(['A','B','C']);
  });

  test('GET /api/events?sort=eventDate', async () => {
    const res = await request(app).get('/api/events?sort=eventDate');
    expect(res.body.map(e => e.date.split('T')[0]))
      .toEqual(['2025-10-01','2025-11-01','2025-12-01']);
  });

  test('GET /api/events?sort=created', async () => {
    const res = await request(app).get('/api/events?sort=created');
    // newest first → C,B,A
    expect(res.body.map(e => e.name)).toEqual(['C','B','A']);
  });

  test('GET /api/events?sort=custom', async () => {
    const res = await request(app).get('/api/events?sort=custom');
    // by sortOrder: B(20), C(30), A(50)
    expect(res.body.map(e => e.name)).toEqual(['B','C','A']);
  });

  test('PUT /api/events/reorder', async () => {
    // new desired order: A,C,B
    const order = [e1, e3, e2];
    const res   = await request(app)
                      .put('/api/events/reorder')
                      .send({ order });
    expect(res.body.success).toBe(true);

    const now = await request(app).get('/api/events?sort=custom');
    expect(now.body.map(e => e.eventId)).toEqual(order);
  });

  test('GET /api/events/export → CSV', async () => {
    const res = await request(app)
      .get('/api/events/export')
      .expect('Content-Type', /text\/csv/)
      .expect(200);
    // header line should include at least these columns:
    expect(res.text).toMatch(/^eventId,name,date,time,location,/);
  });
});
