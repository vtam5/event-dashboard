const {
    createEvent,
    publishEvent,
    createResponse,
    updateEvent,
    updateResponse,
  } = require('./_helpers');
  
  describe('allowResponseEdit enforcement', () => {
    test('when false → forbid updating responses; when true → allow', async () => {
      const ev = await createEvent({ isPublished: 'public', allowResponseEdit: false });
      await publishEvent(ev.eventId);
  
      const created = await createResponse(ev.eventId, {
        participantName: 'Bob',
        participantEmail: 'bob@test.dev',
        answers: [],
      });
      expect(created.status).toBe(201);
      const rid = created.body.id || created.body.responseId || created.body?.data?.id;
  
      const deny = await updateResponse(ev.eventId, rid, { participantName: 'Bobby' });
      expect(deny.status).toBe(403);
  
      await updateEvent(ev.eventId, { allowResponseEdit: true });
      const ok = await updateResponse(ev.eventId, rid, { participantName: 'Bobby' });
      expect(ok.status).toBe(200);
    });
  });
  