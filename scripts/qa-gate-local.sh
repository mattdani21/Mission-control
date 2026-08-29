#!/bin/bash
# Independent re-run of the production QA gate prompt (default gemini-3.5-flash,
# exact prompt from lib/imagegen.ts visionQaImage) against local image files.
# Usage: qa-gate-local.sh [model] image1 [image2 ...]
set -euo pipefail
source ~/.hermes/profiles/envogue-delivery/.env
KEY="$GOOGLE_API_KEY"
MODEL="gemini-3.5-flash"
PROMPT='You are an image QA gate for an AI fashion lookbook. Inspect the image and answer PASS or FAIL only. FAIL if: deformed or extra fingers, missing/merged/fused fingers, uncanny hands, garbled text, or obvious AI artifacts. PASS if: hands (if visible) are anatomically correct with five natural separated fingers, no extra digits, and the image looks like a clean editorial fashion photograph. Reply with exactly: PASS or FAIL, then one short reason.'
if [[ "$1" == gemini-* ]]; then MODEL="$1"; shift; fi
for img in "$@"; do
  [ -f "$img" ] || { echo "MISSING $img"; continue; }
  mime=$(file -b --mime-type "$img")
  python3 - "$img" "$mime" "$PROMPT" > /tmp/qa-payload.json <<'PY'
import base64, json, sys
img, mime, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
data = base64.b64encode(open(img, "rb").read()).decode()
print(json.dumps({"contents": [{"parts": [{"text": prompt},
  {"inline_data": {"mime_type": mime, "data": data}}]}]}))
PY
  resp=$(curl -sS -X POST "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}" \
    -H 'Content-Type: application/json' -d @/tmp/qa-payload.json)
  verdict=$(echo "$resp" | python3 -c '
import json, sys
try:
    b = json.load(sys.stdin)
    t = b.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    print(t.strip()[:200])
except Exception as e:
    print("PARSE_ERR", e)
')
  echo "$(basename "$img") [$MODEL]: $verdict"
done
