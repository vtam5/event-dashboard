const { api } = require('./_helpers');

describe.skip('Invalid sort param behavior (choose one: 400 or fallback)', () => {
  test('GET /api/events?sort=___', async () => {
    const res = await api().get('/api/events?admin=1&sort=___');
    // Unskip and set your intended behavior:
    // expect(res.status).toBe(400); // strict
    // or
    // expect(res.status).toBe(200); // fallback to default
  });
});
