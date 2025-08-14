const {
    createEvent,
    updateEvent,
    publishEvent,
    createResponse,
  } = require('./_helpers');
  
  describe('Event gates: closeOn + visibility', () => {
    test('Draft gate: POST responses to draft → 403', async () => {
      const ev = await createEvent({ isPublished: 'draft' });
      const res = await createResponse(ev.eventId, {});
      expect(res.status).toBe(403);
    });
  
    test('closeOn gate: after closeOn, responses blocked', async () => {
      const ev = await createEvent({ isPublished: 'public' });
      await updateEvent(ev.eventId, { closeOn: '2000-01-01T00:00', isPublished: 'public' });
      const res = await createResponse(ev.eventId, {});
      expect(res.status).toBe(403);
    });
  
    test('Removing closeOn allows responses again', async () => {
      const ev = await createEvent({ isPublished: 'draft', closeOn: '2000-01-01T00:00' });
      await publishEvent(ev.eventId);
      let res1 = await createResponse(ev.eventId, {});
      expect(res1.status).toBe(403);
  
      await updateEvent(ev.eventId, { closeOn: null, isPublished: 'public' });
      const res2 = await createResponse(ev.eventId, {});
      expect(res2.status).toBe(201);
    });
  });
  