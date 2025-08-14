This patch replaces `frontend/src/services/eventService.js` with a merged version that:
- Restores all previously used exports (fetchEventResponses, fetchParticipantDetails, uploadFile, questions APIs, etc.)
- Uses the new `status` model (private|open|closed|archived) and strips legacy `isPublished`
- Sends `?admin=1` where required (create, update, delete, reorder, question CRUD, admin fetches)