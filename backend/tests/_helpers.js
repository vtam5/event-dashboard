const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

function api() {
  return request(app);
}

function uid(prefix = 't') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function createEvent(overrides = {}) {
  const payload = {
    name: overrides.name || uid('Event'),
    date: overrides.date || '2030-01-01',
    time: overrides.time || '10:00',
    location: overrides.location || 'Test Hall',
    description: overrides.description || 'desc',
    isPublished: overrides.isPublished || 'draft',
    capacityLimit: overrides.capacityLimit ?? null,
    allowResponseEdit: overrides.allowResponseEdit ?? false,
    closeOn: overrides.closeOn || null,
    flyerPath: overrides.flyerPath || null,
  };
  const res = await api().post('/api/events?admin=1').send(payload);
  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(300);
  expect(res.body).toHaveProperty('eventId');
  return res.body;
}

async function publishEvent(eventId) {
  const res = await api()
    .put(`/api/events/${eventId}?admin=1`)
    .send({ isPublished: 'public' });
  expect([200, 204]).toContain(res.status);
  return res.body || {};
}

async function updateEvent(eventId, patch, admin = true) {
  const url = `/api/events/${eventId}${admin ? '?admin=1' : ''}`;
  return api().put(url).send(patch);
}

async function deleteEvent(eventId, admin = true) {
  const url = `/api/events/${eventId}${admin ? '?admin=1' : ''}`;
  return api().delete(url);
}

async function createQuestion(eventId, overrides = {}) {
  const payload = {
    questionText: overrides.questionText || uid('Q'),
    questionType: overrides.questionType || 'text',
    isRequired: overrides.isRequired ?? false,
  };
  const res = await api()
    .post(`/api/events/${eventId}/questions?admin=1`)
    .send(payload);
  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(300);
  expect(res.body).toHaveProperty('id');
  return res.body;
}

async function listOptions(questionId) {
  return api().get(`/api/questions/${questionId}/options?admin=1`);
}

async function createOption(questionId, overrides = {}) {
  const payload = {
    optionText: overrides.optionText || uid('Opt'),
    sortOrder: overrides.sortOrder ?? 0,
  };
  const res = await api()
    .post(`/api/questions/${questionId}/options?admin=1`)
    .send(payload);
  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(300);
  expect(res.body).toHaveProperty('id');
  return res.body;
}

async function updateOption(questionId, optionId, patch) {
  return api()
    .put(`/api/questions/${questionId}/options/${optionId}?admin=1`)
    .send(patch);
}

async function deleteOption(questionId, optionId) {
  return api()
    .delete(`/api/questions/${questionId}/options/${optionId}?admin=1`);
}

async function createResponse(eventId, overrides = {}) {
  const payload = {
    participantName: overrides.participantName || 'Alice',
    participantEmail: overrides.participantEmail || `${uid('user')}@test.dev`,
    answers: overrides.answers || [],
  };
  return api().post(`/api/events/${eventId}/responses`).send(payload);
}

async function updateResponse(eventId, responseId, patch) {
  return api()
    .put(`/api/events/${eventId}/responses/${responseId}`)
    .send(patch);
}

function writeTempFile(ext = '.png', buf = Buffer.from('')) {
  const dir = path.join(__dirname, '.tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const filePath = path.join(dir, `${uid('f')}${ext}`);
  fs.writeFileSync(filePath, buf);
  return filePath;
}

// 1x1 PNG
const PNG_1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
  '3df40000000a49444154789c6360000002000100ffff03000006000557bf27' +
  '0000000049454e44ae426082', 'hex'
);

module.exports = {
  api,
  uid,
  createEvent,
  publishEvent,
  updateEvent,
  deleteEvent,
  createQuestion,
  listOptions,
  createOption,
  updateOption,
  deleteOption,
  createResponse,
  updateResponse,
  writeTempFile,
  PNG_1x1,
};
