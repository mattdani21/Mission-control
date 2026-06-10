#!/usr/bin/env bash
# Mission Control - Production & Security Hardening
# Verifies (and where reasonable, applies) hardening controls.
# Outputs: hardening-report.md

set -uo pipefail

REPORT="hardening-report.md"
FAIL=0
OK=0
declare -a RESULTS=()

note() { RESULTS+=("$1"); }
pass() { note "- [x] $1"; OK=$((OK + 1)); }
fail() { note "- [ ] **$1** — $2"; FAIL=$((FAIL + 1)); }

# ---- Secrets ----
if grep -rIE '(AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]+)' \
   --exclude-dir=.git --exclude-dir=node_modules --exclude="hardening-report.md" \
   --exclude="launch-readiness-report.md" . >/dev/null 2>&1; then
  fail "Possible secret detected in working tree" "Rotate the credential and remove it from history (git filter-repo / BFG)."
else
  pass "No obvious secret patterns in working tree"
fi

# ---- .gitignore ----
if [ -f .gitignore ]; then
  if grep -qE '(^|/)\.env($|\.)' .gitignore; then
    pass ".gitignore excludes .env files"
  else
    fail ".gitignore does not exclude .env" "Add '.env' and '.env.*' to .gitignore."
  fi
else
  fail "Missing .gitignore" "Create one and exclude .env, node_modules, dist, .DS_Store."
fi

# ---- Dependency hygiene ----
if [ -f .github/dependabot.yml ] || [ -f renovate.json ]; then
  pass "Automated dependency updates configured"
else
  fail "No Dependabot / Renovate config" "Add .github/dependabot.yml."
fi

# ---- Security policy ----
if [ -f SECURITY.md ] || [ -f .github/SECURITY.md ]; then
  pass "SECURITY.md present"
else
  fail "Missing SECURITY.md" "Add a vulnerability disclosure policy."
fi

# ---- HTTPS / TLS expectations ----
if grep -rqE 'http://(?!localhost|127\.0\.0\.1)' --include="*.{js,ts,tsx,jsx,py,go,rs,yml,yaml}" . 2>/dev/null; then
  fail "Plaintext http:// URL found (non-localhost)" "Use https:// in production code and config."
else
  pass "No plaintext http:// references found (non-localhost)"
fi

# ---- Dockerfile hardening ----
if [ -f Dockerfile ]; then
  if grep -qE '^USER [^r0]' Dockerfile; then
    pass "Dockerfile drops to a non-root USER"
  else
    fail "Dockerfile runs as root" "Add 'USER app' (or similar) before CMD."
  fi
  if grep -qE 'HEALTHCHECK' Dockerfile; then
    pass "Dockerfile defines HEALTHCHECK"
  else
    fail "Dockerfile has no HEALTHCHECK" "Add HEALTHCHECK targeting /healthz."
  fi
  if grep -qE 'FROM .+:latest' Dockerfile; then
    fail "Dockerfile pins :latest" "Pin base image to a specific tag or digest."
  else
    pass "Dockerfile base image is pinned"
  fi
else
  fail "No Dockerfile" "Add a Dockerfile (the package stage needs one)."
fi

# ---- CI / workflow hardening ----
if [ -d .github/workflows ]; then
  if grep -rqE 'uses: [^@]+@(main|master)' .github/workflows 2>/dev/null; then
    fail "GitHub Actions reference unpinned tags (main/master)" "Pin actions to a SHA or version tag."
  else
    pass "GitHub Actions are pinned"
  fi
  if grep -rq 'permissions:' .github/workflows 2>/dev/null; then
    pass "Workflow permissions are scoped"
  else
    fail "Workflows have no explicit permissions" "Add a top-level 'permissions:' block (least privilege)."
  fi
fi

# ---- Headers / web hardening hints ----
if grep -rqE 'helmet|Content-Security-Policy|Strict-Transport-Security' \
   --include="*.{js,ts,tsx,jsx,py,go,rs}" . 2>/dev/null; then
  pass "Security headers configured"
else
  fail "No security headers detected" "Add helmet (Node) / secure_headers (Py) — HSTS, CSP, X-Frame-Options."
fi

# ---- Rate limiting ----
if grep -rqE 'rate.?limit|express-rate-limit|slowapi|throttle' \
   --include="*.{js,ts,tsx,jsx,py,go,rs}" . 2>/dev/null; then
  pass "Rate limiting configured"
else
  fail "No rate limiting detected" "Rate-limit /auth/* and public APIs."
fi

# ---- CORS ----
if grep -rqE 'cors' --include="*.{js,ts,tsx,jsx,py,go,rs}" . 2>/dev/null; then
  if grep -rqE "origin: ?['\"]?\*['\"]?" --include="*.{js,ts,tsx,jsx,py,go,rs}" . 2>/dev/null; then
    fail "CORS allows '*'" "Restrict CORS to known frontend origins."
  else
    pass "CORS configured without wildcard"
  fi
fi

# ---- Input validation ----
if grep -rqE 'zod|pydantic|joi|valibot|class-validator' --include="*.{js,ts,tsx,jsx,py}" . 2>/dev/null; then
  pass "Input validation library in use"
else
  fail "No input validation library detected" "Validate all external input (Zod / Pydantic)."
fi

{
  echo "# Mission Control — Hardening Report"
  echo ""
  echo "_Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")_"
  echo ""
  echo "**Controls passing:** $OK"
  echo "**Controls failing:** $FAIL"
  echo ""
  echo "## Results"
  for r in "${RESULTS[@]}"; do echo "$r"; done
  echo ""
  echo "## Externally enforced (via this workflow)"
  echo "- Gitleaks secret scan"
  echo "- Trivy filesystem + image vulnerability scan"
  echo "- Semgrep OWASP Top 10 + secrets ruleset"
  echo "- SBOM (CycloneDX) generated for the release"
  echo "- SARIF results uploaded to GitHub Security tab"
} > "$REPORT"

cat "$REPORT"

if [ "$FAIL" -gt 0 ] && [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
  echo ""
  echo "Hardening failures present on main."
  exit 1
fi
exit 0
