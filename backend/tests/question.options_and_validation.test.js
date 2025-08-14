const {
    createEvent,
    createQuestion,
    listOptions,
    createOption,
    updateOption,
    deleteOption,
  } = require('./_helpers');
  
  describe('Question Options CRUD + type validation', () => {
    test('CRUD options under a multiple-choice question', async () => {
      const ev = await createEvent({ isPublished: 'public' });
      const q = await createQuestion(ev.eventId, { questionType: 'multiple_choice' });
  
      // create
      const optA = await createOption(q.id, { optionText: 'A' });
      const optB = await createOption(q.id, { optionText: 'B' });
  
      // list
      const listed = await listOptions(q.id);
      expect(listed.status).toBe(200);
      expect(Array.isArray(listed.body)).toBe(true);
      expect(listed.body.length).toBeGreaterThanOrEqual(2);
  
      // update
      const upd = await updateOption(q.id, optA.id, { optionText: 'A1' });
      expect([200, 204]).toContain(upd.status);
  
      // delete
      const del = await deleteOption(q.id, optB.id);
      expect([200, 204]).toContain(del.status);
    });
  
    test('Adding option to a text question should fail', async () => {
      const ev = await createEvent({ isPublished: 'public' });
      const q = await createQuestion(ev.eventId, { questionType: 'text' });
  
      const res = await createOption(q.id, { optionText: 'ShouldFail' })
        .catch((e) => e); // supertest throws on expect; use raw result
  
      // Some stacks send 400, others 422; accept either as "blocked"
      const status = res.status || res.response?.status;
      expect([400, 422]).toContain(status);
    });
  });
  