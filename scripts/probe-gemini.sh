#!/bin/bash
# Probe Gemini API availability across endpoints (text / image / vision).
set -uo pipefail
source ~/.hermes/profiles/envogue-delivery/.env
KEY="$GOOGLE_API_KEY"
probe() {
  local model="$1" body="$2"
  local resp
  resp=$(curl -sS -w '\n%{http_code}' -X POST "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}" \
    -H 'Content-Type: application/json' -d "$body")
  local code
  code=$(echo "$resp" | tail -1)
  local msg
  msg=$(echo "$resp" | head -1 | python3 -c 'import json,sys
try:
  b=json.load(sys.stdin)
  e=b.get("error",{})
  print(e.get("code","?"), e.get("message","")[:120])
except Exception as ex:
  print("unparsed:", sys.stdin.read()[:80])' 2>/dev/null || echo "unparsed")
  echo "$model -> HTTP $code | $msg"
}
probe "gemini-3.5-flash" '{"contents":[{"parts":[{"text":"say ok"}]}]}'
probe "gemini-3-pro-image" '{"contents":[{"parts":[{"text":"tiny 64px solid red square"}]}],"generationConfig":{"responseModalities":["IMAGE"]}}'
