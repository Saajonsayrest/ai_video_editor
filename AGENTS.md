# Agent instructions

Read by any AI coding agent working in this repo (Codex, Antigravity, Claude, etc.).

## RULE (strict): log every decision

Every time you make a non-trivial decision on this project — about the video (format, look,
color, timing, content, text, music), the tooling, assets, or scope — you MUST record it in
[`DECISIONS.md`](./DECISIONS.md) at the repo root. Always. Without being asked.

How to log:
- **Newest first.** Add under a `## YYYY-MM-DD` heading (create today's if missing).
- One line per decision: `**HH:MM** — <plain, simple, one-sentence decision>` (+ short why if useful).
- **Plain words, no jargon** — a non-technical reader must understand it.
- Use the real current date/time.

Do this as part of the work, before moving on — not only when the user reminds you.

## Project

Free, Claude-driven video studio built on Remotion. The spec of record is `app/props.json`;
the operating guide is `app/CLAUDE.md`. Renders are $0 / no keys (see `README.md`).
