#!/usr/bin/env bash
set -euo pipefail

# REQUIREMENTS: bash + curl + jq
# USAGE: bash smoke.sh /absolute/path/to/a/local_flyer.png

BASE=${BASE:-http://localhost:3000}
FLYER_FILE=${1:-}
ADMIN="?admin=1"

if ! command -v jq >/dev/null; then
  echo "Please install jq (brew install jq)"; exit 1
fi

say() { printf "\n=== %s ===\n" "$*"; }
hit() { echo "> $*"; eval "$*"; }

# 0) health
say "Health"
hit "curl -s -o /dev/null -w '%{http_code}\n' $BASE/healthz"

# 1) create event (DRAFT)
say "Create Event (draft)"
EV_JSON=$(curl -s -X POST "$BASE/api/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Smoke Test Event",
    "date":"2025-12-31",
    "time":"18:00",
    "location":"Main Auditorium",
    "description":"Created by smoke.sh"
  }')
echo "$EV_JSON" | jq
EID=$(echo "$EV_JSON" | jq -r '.eventId // .id')

# 2) publish it
say "Publish Event"
hit "curl -s -X PUT \"$BASE/api/events/$EID$ADMIN\" -H 'Content-Type: application/json' -d '{\"isPublished\":\"public\"}' | jq"

# 3) optional: upload flyer BEFORE saving (if file provided) → update event.flyerPath
if [[ -n "$FLYER_FILE" ]]; then
  say "Upload Flyer → update event.flyerPath"
  UP_JSON=$(curl -s -X POST "$BASE/api/upload" -F "file=@${FLYER_FILE}")
  echo "$UP_JSON" | jq
  FLYER_PATH=$(echo "$UP_JSON" | jq -r '.flyerPath // .path')
  echo "flyerPath: $FLYER_PATH"
  hit "curl -s -X PUT \"$BASE/api/events/$EID$ADMIN\" -H 'Content-Type: application/json' -d '{\"flyerPath\":\"'$FLYER_PATH'\"}' | jq"

  say "Check flyer URL"
  hit "curl -s -o /dev/null -w '%{http_code}\n' \"$BASE/${FLYER_PATH#'/'}\""
fi

# 4) questions CRUD
say "Create Question"
Q1=$(curl -s -X POST "$BASE/api/events/$EID/questions$ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"questionText":"Do you need accommodations?","questionType":"text","isRequired":false}')
echo "$Q1" | jq
QID=$(echo "$Q1" | jq -r '.questionId // .id')

say "Edit Question Text"
hit "curl -s -X PUT \"$BASE/api/events/$EID/questions/$QID$ADMIN\" -H 'Content-Type: application/json' -d '{\"questionText\":\"What brings you here?\"}' | jq"

say "Change Question Type -> textarea"
hit "curl -s -X PUT \"$BASE/api/events/$EID/questions/$QID$ADMIN\" -H 'Content-Type: application/json' -d '{\"questionType\":\"textarea\"}' | jq"

say "List Questions"
hit "curl -s \"$BASE/api/events/$EID/questions\" | jq"

# 5) responses CRUD (allow edit)
say "Enable allowResponseEdit"
hit "curl -s -X PUT \"$BASE/api/events/$EID$ADMIN\" -H 'Content-Type: application/json' -d '{\"allowResponseEdit\":true}' | jq"

say "Submit Response"
RESP=$(curl -s -X POST "$BASE/api/events/$EID/responses" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Testy","lastName":"McTest",
    "email":"test@example.com","phone":"555-1111","address":"123 Test Lane",
    "answers":[{"questionId":'"$QID"',"answerText":"Because smoke test"}]
  }')
echo "$RESP" | jq
RID=$(echo "$RESP" | jq -r '.responseId // .id')

say "Edit Response (since allowResponseEdit=true)"
hit "curl -s -X PUT \"$BASE/api/events/$EID/responses/$RID\" -H 'Content-Type: application/json' -d '{\"phone\":\"555-2222\"}' | jq"

say "Delete Response"
hit "curl -s -X DELETE \"$BASE/api/events/$EID/responses/$RID$ADMIN\" | jq"

# 6) upload flyer AFTER event already exists (second flyer) → overwrite flyerPath
if [[ -n "$FLYER_FILE" ]]; then
  say "Upload flyer AFTER create (second upload) → replace flyerPath"
  UP2=$(curl -s -X POST "$BASE/api/upload" -F "file=@${FLYER_FILE}")
  echo "$UP2" | jq
  FLYER2=$(echo "$UP2" | jq -r '.flyerPath // .path')
  hit "curl -s -X PUT \"$BASE/api/events/$EID$ADMIN\" -H 'Content-Type: application/json' -d '{\"flyerPath\":\"'$FLYER2'\"}' | jq"
  say "Check updated flyer URL"
  hit "curl -s -o /dev/null -w '%{http_code}\n' \"$BASE/${FLYER2#'/'}\""
fi

# 7) remove ONLY flyer (do not delete event)
say "Unset flyerPath (remove flyer from event)"
hit "curl -s -X PUT \"$BASE/api/events/$EID$ADMIN\" -H 'Content-Type: application/json' -d '{\"flyerPath\":null}' | jq"

# Note: physical file cleanup on disk is optional; if you added an API to delete files, call it here.

# 8) delete question
say "Delete Question"
hit "curl -s -X DELETE \"$BASE/api/events/$EID/questions/$QID$ADMIN\" | jq"

# 9) finally delete event
say "Delete Event"
hit "curl -s -X DELETE \"$BASE/api/events/$EID$ADMIN\" | jq"

say "List events (admin)"
hit "curl -s \"$BASE/api/events$ADMIN\" | jq 'map({eventId,name,flyerPath})'"

say "DONE ✅"
