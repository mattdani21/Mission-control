#!/usr/bin/env bash
# Mission Control - Launch Readiness Audit
# Detects gaps that would block a production launch.
# Outputs: launch-readiness-report.md, plus GitHub Actions outputs.

set -uo pipefail

REPORT="launch-readiness-report.md"
GAPS=0
PASS=0
WARN=0

declare -a CRITICAL_GAPS=()
declare -a WARNINGS=()
declare -a PASSED=()

check() {
  local level="$1" label="$2" condition="$3" remediation="${4:-}"
  if eval "$condition" >/dev/null 2>&1; then
    PASSED+=("$label")
    PASS=$((PASS + 1))
  else
    case "$level" in
      critical)
        CRITICAL_GAPS+=("**$label** — $remediation")
        GAPS=$((GAPS + 1))
        ;;
      warn)
        WARNINGS+=("$label — $remediation")
        WARN=$((WARN + 1))
        ;;
    esac
  fi
}

has_file() { [ -f "$1" ]; }
has_any() { compgen -G "$1" >/dev/null; }
has_dir_nonempty() { [ -d "$1" ] && [ -n "$(ls -A "$1" 2>/dev/null)" ]; }
grep_any() {
  # Search source-like files, excluding docs, the launch scripts, and reports
  # (which would otherwise produce false positives). The include glob may use
  # {a,b} braces — grep does not expand those itself, so expand them into
  # repeated --include flags first.
  local pattern="${1:-}" dir="${2:-.}" include="${3:-*}"
  local -a include_flags=()
  if [[ "$include" == *"{"* ]]; then
    local body="${include#*{}"
    body="${body%\}}"
    while IFS=',' read -ra parts; do
      for part in "${parts[@]}"; do
        include_flags+=(--include="*$part")
      done
    done <<< "$body"
  else
    include_flags+=(--include="$include")
  fi
  grep -rqE "$pattern" "$dir" "${include_flags[@]}" \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=docs \
    --exclude-dir=launch \
    --exclude="*.md" \
    --exclude="launch-readiness-report.md" \
    --exclude="hardening-report.md" \
    2>/dev/null
}

# ---------- App foundations ----------
check critical "Application source code present" \
  "has_any 'src/*' || has_any 'app/*' || has_any 'apps/*' || has_any '*.py' || has_any 'package.json'" \
  "Add application source. No code = no launch."

check critical "Dependency manifest (package.json / pyproject.toml / requirements.txt / go.mod)" \
  "has_file package.json || has_file pyproject.toml || has_file requirements.txt || has_file go.mod || has_file Cargo.toml" \
  "Create a dependency manifest for your stack."

check critical "Locked dependencies (lockfile present)" \
  "has_file package-lock.json || has_file pnpm-lock.yaml || has_file yarn.lock || has_file poetry.lock || has_file uv.lock || has_file go.sum || has_file Cargo.lock" \
  "Commit a lockfile so prod installs are reproducible."

check critical "README with setup + run instructions" \
  "has_file README.md && [ \$(wc -l < README.md) -gt 20 ]" \
  "Document how to install, configure, run, deploy."

check critical "License file" \
  "has_file LICENSE || has_file LICENSE.md" \
  "Add a LICENSE file."

# ---------- Configuration & secrets ----------
check critical ".env.example documenting required configuration" \
  "has_file .env.example || has_file .env.sample" \
  "Provide a template of all required env vars (no real secrets)."

check critical ".gitignore excludes secrets / build artifacts" \
  "has_file .gitignore && grep -q '\.env' .gitignore" \
  "Add a .gitignore that excludes .env, build dirs, secrets."

check critical "No committed secrets (.env, *.pem, credentials.json)" \
  "! ls .env credentials.json *.pem 2>/dev/null | grep -q ." \
  "Remove committed secrets and rotate them."

# ---------- Auth & user model ----------
check warn "Authentication implementation present" \
  "grep_any 'auth|login|session|jwt|oauth' . '*.{py,ts,tsx,js,jsx,go,rs}'" \
  "Users will need login. Add auth (e.g., Auth.js, Clerk, Auth0, Supabase Auth)."

check warn "Authorization / RBAC mention" \
  "grep_any 'role|permission|policy|rbac' . '*.{py,ts,tsx,js,jsx,go,rs}'" \
  "Add role checks for multi-user / org features."

# ---------- Data ----------
check warn "Database / persistence layer" \
  "grep_any 'postgres|mysql|sqlite|mongo|prisma|sequelize|sqlalchemy|drizzle' . '*'" \
  "Choose and configure a database."

check warn "Database migrations directory" \
  "has_dir_nonempty migrations || has_dir_nonempty prisma/migrations || has_dir_nonempty db/migrations || has_dir_nonempty alembic" \
  "Add a migration system (Prisma, Alembic, Drizzle, etc.)."

# ---------- Quality gates ----------
check critical "Test suite present" \
  "has_dir_nonempty tests || has_dir_nonempty test || has_dir_nonempty __tests__ || compgen -G '**/*.test.*' >/dev/null || compgen -G '**/*_test.*' >/dev/null" \
  "Add unit + integration tests. Aim for the critical paths first."

check warn "Linter configured" \
  "has_file .eslintrc.json || has_file .eslintrc.cjs || has_file eslint.config.js || has_file eslint.config.mjs || has_file .ruff.toml || has_file ruff.toml || grep -q ruff pyproject.toml 2>/dev/null" \
  "Add a linter for your stack."

check warn "Formatter configured" \
  "has_file .prettierrc || has_file prettier.config.js || has_file .prettierrc.json || grep -q black pyproject.toml 2>/dev/null || grep -q ruff pyproject.toml 2>/dev/null" \
  "Add a formatter (Prettier / Black / ruff format)."

check warn "Type checking configured" \
  "has_file tsconfig.json || has_file mypy.ini || grep -q mypy pyproject.toml 2>/dev/null || grep -q pyright pyproject.toml 2>/dev/null" \
  "Add TypeScript / mypy / pyright."

# ---------- Observability ----------
check critical "Health check endpoint defined" \
  "grep_any '/health|/healthz|/ready|/livez' . '*.{py,ts,tsx,js,jsx,go,rs}'" \
  "Expose /healthz and /readyz for load balancers and probes."

check warn "Structured logging present" \
  "grep_any 'pino|winston|structlog|zap|logrus|tracing' . '*'" \
  "Use structured logging (JSON) — print statements are not enough."

check warn "Error tracking integration (Sentry / Bugsnag / Rollbar)" \
  "grep_any 'sentry|bugsnag|rollbar' . '*'" \
  "Wire up Sentry (or equivalent) for prod error visibility."

check warn "Metrics / tracing (OTel / Prometheus / Datadog)" \
  "grep_any 'opentelemetry|prom-client|prometheus|datadog|statsd' . '*'" \
  "Instrument metrics + tracing so you can debug prod."

# ---------- Security ----------
check critical "SECURITY.md (vuln disclosure policy)" \
  "has_file SECURITY.md || has_file .github/SECURITY.md" \
  "Add SECURITY.md so people know how to report vulns."

check critical "Dependabot / Renovate configured" \
  "has_file .github/dependabot.yml || has_file renovate.json" \
  "Automate dependency updates."

check warn "Security headers / CSP applied" \
  "grep_any 'helmet|Content-Security-Policy|secure_headers|Strict-Transport-Security' . '*'" \
  "Use helmet (or equivalent) for HSTS, CSP, X-Frame-Options, etc."

check warn "Rate limiting middleware" \
  "grep_any 'rate.?limit|express-rate-limit|slowapi|throttle' . '*'" \
  "Add rate limiting on auth + public APIs."

check warn "Input validation library" \
  "grep_any 'zod|pydantic|joi|yup|valibot|class-validator' . '*'" \
  "Validate all external input (Zod / Pydantic / etc.)."

check warn "CSRF protection (for cookie-based auth)" \
  "grep_any 'csrf|csurf|samesite' . '*'" \
  "Add CSRF tokens or use SameSite=Strict cookies."

# ---------- Delivery ----------
check critical "Dockerfile" \
  "has_file Dockerfile" \
  "Add a multi-stage Dockerfile so the app can be packaged."

check warn ".dockerignore" \
  "has_file .dockerignore" \
  "Add .dockerignore to keep images small and secrets out."

check warn "CI workflow defined" \
  "has_any '.github/workflows/*.yml'" \
  "Add CI (this workflow counts once committed)."

# ---------- Marketing platform specifics ----------
check warn "AI provider integration (Anthropic / OpenAI)" \
  "grep_any 'anthropic|openai|claude|gpt-' . '*'" \
  "Mission Control is AI-assisted — wire up an LLM provider."

check warn "Marketing channel integrations (email / social / ads)" \
  "grep_any 'sendgrid|mailgun|resend|twitter|x-api|linkedin|facebook|google-ads|hubspot|mailchimp' . '*'" \
  "Add at least one channel integration so users can act from the platform."

check warn "Background jobs / queue (BullMQ, Celery, etc.)" \
  "grep_any 'bullmq|celery|sidekiq|temporal|inngest|trigger\\.dev' . '*'" \
  "Scheduled campaigns + LLM calls need a job queue."

# ---------- Compliance / product ----------
check warn "Privacy policy" \
  "has_file PRIVACY.md || has_file docs/privacy.md || grep -riq 'privacy policy' docs/ 2>/dev/null" \
  "Add a privacy policy (required if you handle PII)."

check warn "Terms of service" \
  "has_file TERMS.md || has_file docs/terms.md" \
  "Add ToS before customers sign up."

# ---------- Build report ----------
TOTAL=$((GAPS + WARN + PASS))
READY="NO"
if [ "$GAPS" -eq 0 ]; then
  READY="YES (warnings remain)"
  [ "$WARN" -eq 0 ] && READY="YES"
fi

{
  echo "# Mission Control — Launch Readiness Report"
  echo ""
  echo "_Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")_"
  echo ""
  echo "**Ready to launch:** $READY"
  echo ""
  echo "| Result | Count |"
  echo "|---|---|"
  echo "| Critical gaps | $GAPS |"
  echo "| Warnings | $WARN |"
  echo "| Passing | $PASS |"
  echo "| Total checks | $TOTAL |"
  echo ""
  if [ "${#CRITICAL_GAPS[@]}" -gt 0 ]; then
    echo "## Critical gaps (must fix before launch)"
    for item in "${CRITICAL_GAPS[@]}"; do echo "- $item"; done
    echo ""
  fi
  if [ "${#WARNINGS[@]}" -gt 0 ]; then
    echo "## Warnings (should fix before launch)"
    for item in "${WARNINGS[@]}"; do echo "- $item"; done
    echo ""
  fi
  if [ "${#PASSED[@]}" -gt 0 ]; then
    echo "## Passing"
    for item in "${PASSED[@]}"; do echo "- $item"; done
    echo ""
  fi
  echo "---"
  echo "_Next steps: see \`LAUNCH_CHECKLIST.md\` for the full launch runbook._"
} > "$REPORT"

cat "$REPORT"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "gaps=$GAPS" >> "$GITHUB_OUTPUT"
  {
    echo "report<<EOF"
    cat "$REPORT"
    echo "EOF"
  } >> "$GITHUB_OUTPUT"
fi

# Fail the job if critical gaps remain on main
if [ "$GAPS" -gt 0 ] && [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
  echo ""
  echo "Critical gaps present on main — failing audit."
  exit 1
fi

exit 0
