#!/usr/bin/env bash
# Mission Control - Release Packaging
# Produces a versioned release bundle in dist/.

set -euo pipefail

VERSION="${VERSION:-0.0.0-dev}"
OUT="dist"
BUNDLE="$OUT/mission-control-${VERSION}"

mkdir -p "$BUNDLE"

# Collect launch artifacts that should ship with the release
for f in \
  README.md LICENSE SECURITY.md \
  LAUNCH_CHECKLIST.md \
  launch-readiness-report.md hardening-report.md \
  Dockerfile docker-compose.yml \
  .env.example; do
  [ -f "$f" ] && cp "$f" "$BUNDLE/" || true
done

# Capture release metadata
cat > "$BUNDLE/RELEASE.json" <<EOF
{
  "name": "mission-control",
  "version": "${VERSION}",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo unknown)",
  "built_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "image": "ghcr.io/${GITHUB_REPOSITORY:-mattdani21/mission-control}:${VERSION}"
}
EOF

# Tarball
tar -czf "$OUT/mission-control-${VERSION}.tar.gz" -C "$OUT" "mission-control-${VERSION}"

# Checksum
( cd "$OUT" && sha256sum "mission-control-${VERSION}.tar.gz" > "mission-control-${VERSION}.tar.gz.sha256" )

echo "Packaged release:"
ls -la "$OUT"
