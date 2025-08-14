# API Endpoints

## Events
- `POST /api/events`
  Body: `{ name, date, time?, location?, description? }`
  → `201 { eventId }`

- `GET /api/events`
  Query:
  - `?admin=1` to include drafts/private
  - `?sort=alpha|eventDate|created|custom` (default `created`)
  → `200 [ { …event fields… } ]`

- `PUT /api/events/:id?admin=1`
  Body (all optional):
  `{ name?, date?, time?, location?, description?, isPublished?, allowResponseEdit?, capacityLimit?, closeOn?, emailConfirmation? }`
  Notes: `isPublished` accepts `draft | private | public` (alias `published` → `public`).
  → `200 { success: true, updated: <count> }`

- `DELETE /api/events/:id?admin=1`
  → `200 { success: true }` or `404 { error }`

- `PUT /api/events/reorder`
  Body: `{ order: [eventId1, eventId2, …] }` (non-empty array of integers)
  → `200 { success: true }`
  Errors: `400 { error: 'duplicate ids in order' }`, `400 { error: 'unknown id in order' }`

- `GET /api/events/export`
  → `200 text/csv` (columns: `eventId,name,date,time,location,description,isPublished,createdAt`)

## Questions
- `POST /api/events/:eventId/questions`
  Body: `{ questionText, questionType, isRequired? }`
  → `201 { questionId }`

- `GET /api/events/:eventId/questions`
  → `200 [ { questionId, questionText, questionType, … } ]`

- `PUT /api/events/:eventId/questions/:questionId`
  Body (optional): `{ questionText?, questionType? }`
  → `200 { updated: <count> }`

- `DELETE /api/events/:eventId/questions/:questionId`
  → `200 { deleted: <count> }`

### Question Options (non-text questions only)
- `GET /api/events/:eventId/questions/:questionId/options`
  → `200 [ { optionId, optionText }, … ]`

- `POST /api/events/:eventId/questions/:questionId/options`
  Body: `{ optionText }`
  → `201 { id: <optionId>, questionId }`
  (Not allowed for text-type questions: `text, textarea, paragraph, shorttext, longtext, input` → `400`)

- `PUT /api/events/:eventId/questions/:questionId/options/:optionId`
  Body: `{ optionText }`
  → `200 { updated: <count> }`

- `DELETE /api/events/:eventId/questions/:questionId/options/:optionId`
  → `200 { deleted: <count> }`

## Responses
- `POST /api/events/:eventId/responses`
  Body:
  `{ firstName?, lastName?, email?, phone?, address?, answers: [{ questionId, answerText }, …] }`
  Gates:
  - Event must be `public`
  - If `closeOn` in past → `403 { error: 'Event closed' }`
  - If `capacityLimit` reached → `403 { error: 'Capacity reached' }`
  → `201 { submissionId }` (email confirmation optional)

- `GET /api/events/:eventId/responses`
  → `200 [ { submissionId, … }, … ]`

- `PUT /api/events/:eventId/responses/:responseId`
  Body: `{ answers: [{ questionId, answerText }, …] }`
  Requires event `allowResponseEdit = true`
  → `200 { success: true }`

- `DELETE /api/events/:eventId/responses/:responseId`
  → `200 { success: true }`

## Uploads
- `POST /api/events/:eventId/upload` (form-data: `flyer`)
  → `200 { flyerPath }`

- `POST /api/upload`
  → `200 { path }`
