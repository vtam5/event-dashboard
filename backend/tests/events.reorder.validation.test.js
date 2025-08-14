const { createEvent, api } = require('./_helpers');

describe('Reorder validation', () => {
  test('duplicate ids → 400', async () => {
    const a = await createEvent({ isPublished: 'public' });
    const b = await createEvent({ isPublished: 'public' });

    const res = await api()
      .put('/api/events/reorder?admin=1')
      .send({ order: [a.eventId, b.eventId, b.eventId] });

    expect(res.status).toBe(400);
  });

  test('unknown id → 400', async () => {
    const a = await createEvent({ isPublished: 'public' });
    const b = await createEvent({ isPublished: 'public' });

    const res = await api()
      .put('/api/events/reorder?admin=1')
      .send({ order: [a.eventId, b.eventId, 999999999] });

    expect(res.status).toBe(400);
  });
});
