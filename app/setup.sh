#!/usr/bin/env bash
#
# One-time setup for the Remotion × Claude video project.
# Safe to re-run any time (idempotent).
#
#   ./setup.sh
#
set -euo pipefail
cd "$(dirname "$0")"

say()  { printf "\033[1;36m›\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }

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

say "Ensuring asset folders…"
mkdir -p public/input public/output
for d in input output; do [ -f "public/$d/.gitkeep" ] || touch "public/$d/.gitkeep"; done
ok "public/input (your files) and public/output (renders) ready"

if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created .env — add your ANTHROPIC_API_KEY to it before running 'npm run generate'."
else
  ok ".env already exists"
fi

cat <<'EOF'

──────────────────────────────────────────────────────────────
Setup complete. Everything below is FREE — no API key required.

  1. Render the built-in demo:   npm run render   →  public/output/video.mp4
  2. Or edit props visually:     npm run dev      (Remotion Studio)

Then just tell Claude Code what to make — e.g. "a 30s 9:16 teaser for a
coffee brand, upbeat". Claude writes props.json, fetches free assets, and
renders. See CLAUDE.md for the full workflow, or use /new-video.

Optional free stock b-roll: add PEXELS_API_KEY / PIXABAY_API_KEY to .env
──────────────────────────────────────────────────────────────
EOF
