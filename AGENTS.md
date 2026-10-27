# AGENTS.md

Entry point for any coding agent (Codex, Cursor, Antigravity, Claude Code, …).

**The full agent guide is [`CLAUDE.md`](CLAUDE.md)**: rules, conventions, how to run and test. It applies to every agent, not just Claude. Read it first.

Quick essentials:
- Vanilla HTML/CSS/JS with native ES modules. **No dependencies, no build step** unless the user approves an exception.
- Run: `python3 -m http.server 5173` → http://localhost:5173/. Test: `npm test` (Node's built-in runner).
- Plan → get the user's OK → build. Keep replies short.
- Building a new game? Pick a spec from [`docs/GAME-SPECS.md`](docs/GAME-SPECS.md), read its **Sanity check**, then follow `docs/ARCHITECTURE.md` → "Adding a new game".
- Shipping / CI/CD: see [`docs/PIPELINE-SPEC.md`](docs/PIPELINE-SPEC.md) (**proposal, not implemented yet**). Until it is, ask the user before pushing.
- Before finishing: update `docs/PROGRESS.md`, log decisions in `docs/DECISIONS.md`, and keep `docs/ARCHITECTURE.md` in sync.
