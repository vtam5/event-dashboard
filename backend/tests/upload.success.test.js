const { api, writeTempFile, PNG_1x1 } = require('./_helpers');

describe('Upload (generic) success', () => {
  test('POST /api/upload returns { path }', async () => {
    const filePath = writeTempFile('.png', PNG_1x1);

    const res = await api()
      .post('/api/upload')
      .attach('flyer', filePath);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('path');
    expect(String(res.body.path)).toMatch(/uploads?\//i);
  });
});

