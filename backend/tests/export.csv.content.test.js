const { createEvent, api } = require('./_helpers');

describe('CSV export content', () => {
  test('header present and at least one row', async () => {
    await createEvent({ isPublished: 'public', name: 'CSV One' });

    const res = await api().get('/api/events/export?admin=1');
    expect(res.status).toBe(200);
    const type = String(res.headers['content-type'] || '');
    expect(type).toMatch(/text\/csv/i);

    const text = res.text || res.body?.toString?.('utf8') || '';
    const lines = text.trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const header = lines[0].split(',');
    expect(header).toEqual(expect.arrayContaining(['eventId', 'name']));

    // quick sanity on a data row shape
    const row = lines[1].split(',');
    expect(row.length).toBe(header.length);
  });
});
