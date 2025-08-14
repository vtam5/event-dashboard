const {
    createEvent,
    updateEvent,
    deleteEvent,
  } = require('./_helpers');
  
  describe('Admin guard negatives', () => {
    test('PUT /api/events/:id without admin → 403', async () => {
      const ev = await createEvent({ isPublished: 'draft' });
      const res = await updateEvent(ev.eventId, { name: 'Nope' }, /*admin*/ false);
      expect(res.status).toBe(403);
    });
  
    test('DELETE /api/events/:id without admin → 403', async () => {
      const ev = await createEvent({ isPublished: 'draft' });
      const res = await deleteEvent(ev.eventId, /*admin*/ false);
      expect(res.status).toBe(403);
    });
  });
  