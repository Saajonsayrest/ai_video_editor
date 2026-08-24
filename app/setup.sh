#!/usr/bin/env bash
#
# One-time setup for the AI Video Studio.
# Safe to re-run any time (idempotent).
#
#   ./setup.sh
#
set -euo pipefail
cd "$(dirname "$0")"

say()  { printf "\033[1;36m›\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }

if [ "${1:-}" = "build" ] || [ "${1:-}" = "render" ]; then
  say "Starting video build..."
  npm run render
  exit 0
fi

say "Checking prerequisites…"
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js not found. Install Node 20+ from https://nodejs.org and re-run."
  exit 1
fi
node_major="$(node -p 'process.versions.node.split(".")[0]')"
ok "node $(node -v)"
if [ "$node_major" -lt 18 ]; then
  warn "Node $node_major is old; Remotion works best on Node 20/22 LTS."
fi
command -v ffmpeg >/dev/null 2>&1 && ok "ffmpeg present" || warn "ffmpeg not on PATH (Remotion bundles its own for rendering — optional)."

say "Installing dependencies…"
npm install
ok "dependencies installed"

say "Ensuring input and output folders…"
mkdir -p public/input/generated public/input/ingest public/input/music public/input/stems public/output ../input ../output
for d in public/input public/output public/input/generated public/input/ingest public/input/music public/input/stems ../input ../output; do
  [ -f "$d/.gitkeep" ] || touch "$d/.gitkeep"
done
ok "input/ and output/ directories ready with .gitkeep markers"

if [ ! -f .env ]; then
  cp .env.example .env
  ok "Created .env template"
else
  ok ".env already exists"
fi

cat <<'EOF'

──────────────────────────────────────────────────────────────
Setup complete. Everything on the default path is 100% FREE.

  1. Render the built-in demo:   npm run render   →  public/output/video.mp4
  2. Or edit props visually:     npm run dev      (Remotion Studio)

Describe what to make in plain English — your AI coding assistant
writes props.json, fetches free assets, and renders. See CLAUDE.md.

Optional free stock media: add PEXELS_API_KEY / PIXABAY_API_KEY to .env
──────────────────────────────────────────────────────────────
EOF
