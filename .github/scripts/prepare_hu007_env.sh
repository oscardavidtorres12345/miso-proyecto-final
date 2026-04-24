#!/usr/bin/env bash
set -euo pipefail

BOOKING_BASE_URL="${BOOKING_BASE_URL:-http://127.0.0.1:8004}"
SEARCH_BASE_URL="${SEARCH_BASE_URL:-http://127.0.0.1:8002}"
IDENTITY_BASE_URL="${IDENTITY_BASE_URL:-http://127.0.0.1:8001}"
MAIL_API_URL="${MAIL_API_URL:-http://127.0.0.1:8025}"
USER_ID="${HU007_USER_ID:-1}"

if [[ -n "${HU007_CHECK_IN:-}" ]]; then
  CHECK_IN="${HU007_CHECK_IN}"
else
  CHECK_IN="$(date -u -d '+1 day' +%F 2>/dev/null || date -u -v+1d +%F)"
fi

if [[ -n "${HU007_CHECK_OUT:-}" ]]; then
  CHECK_OUT="${HU007_CHECK_OUT}"
else
  CHECK_OUT="$(date -u -d '+3 day' +%F 2>/dev/null || date -u -v+3d +%F)"
fi

find_search_seed() {
  local destinations=("Cartagena" "Bogotá" "Bogota" "Medellín" "Medellin" "Buenos Aires" "Miami")
  for _ in {1..15}; do
    for destination in "${destinations[@]}"; do
      local encoded
      encoded="$(python3 -c "import urllib.parse; print(urllib.parse.quote('''${destination}'''))")"
      local url="${SEARCH_BASE_URL}/api/v1/search/properties?destination=${encoded}&check_in=${CHECK_IN}&check_out=${CHECK_OUT}&adults=2&children=0&rooms=1&page=1&page_size=1"
      local response
      response="$(curl -fsS "$url" || true)"
      if [[ -z "$response" ]]; then
        continue
      fi
      local count
      count="$(echo "$response" | jq -r '.results | length' 2>/dev/null || echo "0")"
      if [[ "$count" != "0" ]]; then
        local property_id room_id
        property_id="$(echo "$response" | jq -r '.results[0].id')"
        room_id="$(echo "$response" | jq -r '.results[0].roomId')"
        if [[ -n "$property_id" && -n "$room_id" && "$property_id" != "null" && "$room_id" != "null" ]]; then
          echo "${property_id},${room_id}"
          return 0
        fi
      fi
    done
    sleep 2
  done
  return 1
}

wait_ready() {
  local name="$1"
  local url="$2"
  for _ in {1..60}; do
    if curl -fsS "$url" >/dev/null; then
      echo "$name ready" >&2
      return 0
    fi
    sleep 2
  done
  echo "$name not ready: $url" >&2
  return 1
}

wait_ready "search-service" "${SEARCH_BASE_URL}/health"
wait_ready "identity-service" "${IDENTITY_BASE_URL}/health"
wait_ready "booking-service" "${BOOKING_BASE_URL}/ready"

recipient_email="$(curl -fsS "${IDENTITY_BASE_URL}/api/v1/identity/users/${USER_ID}" | jq -r '.user.email')"
if [[ -z "$recipient_email" || "$recipient_email" == "null" ]]; then
  echo "Could not resolve recipient email for user ${USER_ID}" >&2
  exit 1
fi

create_hold() {
  local property_id="$1"
  local room_id="$2"
  local payload response booking_id
  payload="$(jq -n \
    --argjson property_id "$property_id" \
    --argjson room_id "$room_id" \
    --arg user_id "$USER_ID" \
    --arg check_in "$CHECK_IN" \
    --arg check_out "$CHECK_OUT" \
    '{property_id: $property_id, room_id: $room_id, user_id: $user_id, check_in: $check_in, check_out: $check_out, units: 1}')"

  response="$(curl -sS \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$payload" \
    "${BOOKING_BASE_URL}/api/v1/bookings/holds" || true)"
  booking_id="$(echo "$response" | jq -r '.booking_id // empty' 2>/dev/null || true)"
  if [[ -n "$booking_id" ]]; then
    echo "$response"
    return 0
  fi
  return 1
}

create_batch_booking_id() {
  local hold_response="" booking_id="" batch_payload="" batch_response="" batch_booking_id=""
  if seed="$(find_search_seed)"; then
    property_id="${seed%,*}"
    room_id="${seed#*,}"
    hold_response="$(create_hold "$property_id" "$room_id" || true)"
  fi

  if [[ -z "$hold_response" ]]; then
    # Fallback seeds aligned with service test data.
    candidates=(
      "1,1"
      "1,2"
      "2,4"
      "3,7"
    )
    for candidate in "${candidates[@]}"; do
      property_id="${candidate%,*}"
      room_id="${candidate#*,}"
      hold_response="$(create_hold "$property_id" "$room_id" || true)"
      if [[ -n "$hold_response" ]]; then
        break
      fi
    done
  fi

  if [[ -z "$hold_response" ]]; then
    return 1
  fi

  booking_id="$(echo "$hold_response" | jq -r '.booking_id')"
  if [[ -z "$booking_id" || "$booking_id" == "null" ]]; then
    return 1
  fi

  batch_payload="$(jq -n \
    --arg user_id "$USER_ID" \
    --arg booking_id "$booking_id" \
    '{user_id: $user_id, booking_ids: [$booking_id]}')"

  batch_response="$(curl -fsS \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$batch_payload" \
    "${BOOKING_BASE_URL}/api/v1/bookings/batch")"

  batch_booking_id="$(echo "$batch_response" | jq -r '.booking_id')"
  if [[ -z "$batch_booking_id" || "$batch_booking_id" == "null" ]]; then
    return 1
  fi
  echo "$batch_booking_id"
}

batch_booking_id_e023="$(create_batch_booking_id || true)"
batch_booking_id_e024="$(create_batch_booking_id || true)"
batch_booking_id_e025="$(create_batch_booking_id || true)"

if [[ -z "$batch_booking_id_e023" || -z "$batch_booking_id_e024" || -z "$batch_booking_id_e025" ]]; then
  echo "Could not create batch booking ids for HU007 scenarios." >&2
  exit 1
fi

cat <<EOF
E2E_BOOKING_API_URL=${BOOKING_BASE_URL}
E2E_MAIL_API_URL=${MAIL_API_URL}
E2E_HU007_BATCH_BOOKING_ID=${batch_booking_id_e023}
E2E_HU007_BATCH_BOOKING_ID_E023=${batch_booking_id_e023}
E2E_HU007_BATCH_BOOKING_ID_E024=${batch_booking_id_e024}
E2E_HU007_BATCH_BOOKING_ID_E025=${batch_booking_id_e025}
E2E_HU007_RECIPIENT_EMAIL=${recipient_email}
EOF
