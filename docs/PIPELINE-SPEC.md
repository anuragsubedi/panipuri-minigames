# Build & Release Pipeline — Spec (agent-first)

> **Status: proposal, not implemented.** **Host decided: GitHub Pages** (D-022). Server features later via Cloudflare Workers. PR review/merge automation: `docs/ARCHITECT-AGENT-SPEC.md`. Nothing here exists yet: no workflows, no Pages site, no branch protection. Implementing it needs the user's OK, and some steps are **user-only** (marked 👤).

## Goal

Any agent (Claude Code, Codex, Cursor, Antigravity, …) can clone the repo, branch, add a game or pick up planned work, and get it **publicly playable without hand-holding**, while the user stays the final gate on what goes live.

```
agent: clone → branch → build → npm run verify → PR
CI:    verify → (phase 2) preview URL on the PR
user:  play the preview → merge
CI:    deploy main → https://anuragsubedi.github.io/panipuri-minigames/
```

## Principles

1. **Static artifact, zero runtime.** Everything runs in the player's browser. "Build" means *assemble and check*, not compile.
2. **One command for agents.** `npm run verify` runs locally and runs the same checks as CI. If it's green locally, CI should be green.
3. **`main` is always deployable.** Nobody, agent or human, pushes to `main` directly; everything lands via PR.
4. **Authors never merge their own PRs.** Builders open PRs. Until the Architect agent exists, the user merges everything. After that, the Architect may auto-merge tier-A PRs and the user merges tier B/C (`docs/ARCHITECT-AGENT-SPEC.md`).
5. **Zero dependencies stays true for the shipped site.** CI-only tooling may use `npx` (nothing in `package.json`) if the user approves it (see Phase 2).
6. **Swappable build step.** The deploy contract is "a `_site/` folder". If a framework or bundler arrives later, only the build job changes.

---

## Hosting choice

> Limits and pricing below are as understood in late 2026 and **change often**. Verify against each provider's current docs before committing.

| | GitHub Pages | Cloudflare (Pages / Workers static assets) | Vercel | Netlify |
|---|---|---|---|---|
| Static hosting cost | free (public repo) | free; static requests/bandwidth not metered | free Hobby tier | free tier (usage-capped) |
| Commercial use on free tier | discouraged (not for SaaS/commerce) | ✅ allowed | ❌ Hobby is **non-commercial only** | ✅ within limits |
| Bandwidth (free) | ~100 GB/mo soft | effectively unlimited for static | capped (~100 GB/mo) | capped |
| PR / branch previews | ❌ not native | ✅ automatic | ✅ automatic (best-in-class) | ✅ automatic |
| Custom headers / redirects | ❌ | ✅ `_headers`, `_redirects` | ✅ `vercel.json` | ✅ `_headers`, `_redirects` |
| Server code later | ❌ | ✅ Workers, KV/D1, Durable Objects (realtime) | ✅ Functions (Node/Edge) | ✅ Functions |
| Setup | 👤 one settings toggle, no account | 👤 Cloudflare account + connect repo | 👤 Vercel account + import repo | 👤 account + connect repo |
| Lock-in | none | low (static + optional Workers) | low for static; higher with Next.js features | low |

**Why headers matter here:** `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` unlock `SharedArrayBuffer` (threaded WebAssembly, low-latency audio worklets), which games like Breakbench, Keyfall or Blockyard might want. Long-lived cache headers for assets also need control. GitHub Pages can't set either.

### Recommendation

- **Phase 1 (now): GitHub Pages.** Zero accounts, zero secrets, fine for a public prototype.
- **Long run: Cloudflare** (Pages, or Workers with static assets, which Cloudflare is steering new projects toward). It has unmetered static traffic, previews, headers, commercial use on the free tier, and a natural path to leaderboards or multiplayer (Workers + Durable Objects) without changing hosts.
- **Vercel** if the project moves to **Next.js/React** or wants the smoothest preview/review UX. Mind the Hobby tier's non-commercial clause and bandwidth caps.
- **Switching cost is low by design.** Every host consumes the same `_site/` folder from `npm run build`. Moving hosts = swapping the deploy job (or connecting the repo in the host's dashboard) plus DNS. Keep the site host-agnostic: relative paths only, no host-specific features until a decision says so.
- **Custom domain** (👤 buy + DNS) is the thing that makes a move invisible to players; worth doing before any public sharing at scale.

**Decided (D-022):** GitHub Pages hosts the static site. Server features (leaderboards, multiplayer, API proxies) go to **Cloudflare Workers** as a separate backend, while the static site stays on Pages. Revisit the host only if previews or custom headers become blocking.

**Base path:** GitHub Pages serves at `/panipuri-minigames/`. That works because **all internal links and imports are relative** (`./`, `../`). CI enforces this (see checks). A custom domain is optional later (👤 DNS).

---

## Repository conventions for agents

### Branches
- `game/<name>`: a new game from `docs/GAME-SPECS.md` (e.g. `game/pin-drop`)
- `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`
- Branch from up-to-date `main`; rebase (don't merge) `main` into your branch before opening or updating a PR.

### Commits & PRs
- Small, focused commits; the message says *why*.
- PR title: `Add Pin Drop v0.1`, `Fix slider focus on Safari`, …
- PR body uses `.github/pull_request_template.md` (below). Include a screenshot or GIF for UI changes.
- One game per PR. Shared-code changes (`shared/`) get their own PR when practical, because they affect every game.

### Conflict hotspots (parallel agents)
These files are touched by almost every game PR; keep edits minimal and append-only:

| File | Rule |
|---|---|
| `index.html` (hub tiles) | Add your `<li>` at the end of the list; don't reformat others |
| `shared/styles/hub.css` | Add one `.game-tile__art--<name>` block at the end of the art section |
| `README.md` game table | Append one row |
| `docs/PROGRESS.md` | Append to the session log; update only your game's status line |
| `docs/DECISIONS.md` | Append; **number on merge**: write `D-XXX` in the PR, and the merger (or a follow-up commit) assigns the next free number |
| `docs/ARCHITECTURE.md` | Add your game's own section; don't rewrite others |

(Future improvement: generate hub tiles from per-game `game.json` manifests to remove the biggest hotspot. That introduces a build step, so it's a separate decision.)

---

## The `verify` command (Phase 1 core)

A zero-dependency Node script, `scripts/verify.mjs`, wired as `"verify": "node scripts/verify.mjs"` in `package.json`. Exit code ≠ 0 on any failure; output lists every problem with file:line.

| Check | What it catches |
|---|---|
| **Unit tests**: `node --test "tests/**/*.test.js"` | Logic regressions in any game or in `shared/` |
| **Import graph**: parse every `import … from '…'` in `games/**` and `shared/**`; each target file must exist; every game's `src/main.js` must reach all its imports | Broken relative paths after moves (the most likely agent mistake) |
| **Relative links only**: no `href`/`src`/import starting with `/` or `http(s)://` except an allowlist (e.g. external credits links) | Breaks under the `/panipuri-minigames/` subpath; hidden CDN dependencies |
| **Game registry**: each `games/<name>/` has `index.html`, `src/main.js`, a hub tile linking to it, and a README row | Half-registered games |
| **HTML sanity**: each `index.html` has `<!doctype html>`, `lang`, viewport meta, `<title>`, and links `shared/styles/tokens.css` | Missing basics |
| **No dependencies**: `package.json` has no `dependencies` / `devDependencies` | Accidental installs |
| **Size budget**: total `_site/` ≤ 25 MB, single file ≤ 5 MB (assets excepted per spec) | Huge accidental commits |

`scripts/verify.mjs` is itself small and pure Node; its helpers get unit tests in `tests/scripts/`.

### `build` (assemble)

`scripts/build.mjs` (`npm run build`) creates `_site/` containing **only what players need**:

```
_site/
├── index.html
├── shared/
├── games/
├── version.json      # { "commit": "<sha>", "builtAt": "<iso>" }
└── .nojekyll         # GitHub Pages: serve files as-is
```

It excludes: `docs/`, `tests/`, `scripts/`, `.claude/`, `.github/`, `start.command`, `package.json`, markdown files.

`_site/` is git-ignored. Locally: `npm run build && python3 -m http.server 5173 -d _site` previews exactly what will deploy.

---

## GitHub Actions workflows

### `.github/workflows/ci.yml`: every PR and every push to any branch

- `runs-on: ubuntu-latest`, Node 22 (`actions/setup-node`), **no `npm install`** (no deps).
- Steps: checkout → `npm run verify` → `npm run build` → upload `_site/` as an artifact (handy for reviewers).
- `concurrency: ci-${{ github.ref }}` with `cancel-in-progress: true`.
- Typical runtime: under 30 s. Negligible CPU and memory.

### `.github/workflows/deploy.yml`: push to `main` (+ manual `workflow_dispatch`)

- `permissions: { contents: read, pages: write, id-token: write }`
- Job `build`: checkout → `npm run verify` → `npm run build` → `actions/upload-pages-artifact` (path `_site`).
- Job `deploy`: `actions/deploy-pages`, environment `github-pages`; its URL appears on the run.
- `concurrency: pages` (`cancel-in-progress: false`) so deploys never overlap.
- Post-deploy smoke check: `curl -fsS <url>/version.json` must return this commit's SHA (retry a few times for CDN lag).
- Pin actions to major versions (`@v4`, etc.); consider pinning to SHAs later.

### Phase 2: `preview` (choose one)
- **Cloudflare Pages Git integration** (👤 connect once in the Cloudflare dashboard, build command `npm run build`, output `_site`). It posts a preview URL on every PR automatically and needs no repo secrets.
- **Or** `.github/workflows/preview.yml` using `cloudflare/wrangler-action` with 👤 `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets, then comments the URL on the PR.
- (GitHub Pages-only alternative: deploy PRs into a `pr-<n>/` subfolder of a `gh-pages` branch via a community action. That's more moving parts, so it isn't recommended.)

### Phase 2: browser smoke tests (needs approval: CI-only tool)
- `npx playwright@<pinned> test` in CI only (not in `package.json`).
- For each game: load the page, check zero console errors, start a game with `?seed=1`, and step through one round via the keyboard.
- Run against the built `_site/` served by `python3 -m http.server`.
- Catches "page loads but crashes" bugs that unit tests can't.

---

## Releases & rollback

- **Continuous deployment:** every merge to `main` is live within about 1 minute. No release ceremony needed for a prototype.
- **Optional milestones:** tag `v0.N` on `main` when a game ships; `gh release create v0.N --generate-notes` (agents may do this only when the user asks).
- **Rollback:** `git revert <bad-commit>` on a branch → PR → merge (redeploys). In an emergency, 👤 re-run `deploy.yml` via `workflow_dispatch` on an older commit.
- **Version visibility:** `version.json` is deployed; the hub could later show the short SHA in a footer.

---

## One-time setup (user-only 👤)

1. Repo **Settings → Pages → Source: "GitHub Actions"**.
2. Repo **Settings → Branches → protect `main`**:
   - require a PR before merging
   - require status check `ci / verify` to pass
   - block force-pushes
3. (Phase 2) Connect Cloudflare Pages *or* add its secrets.
4. (Optional) Choose a LICENSE (open question from `docs/GAME-SPECS.md`).

An agent may run these via `gh api` **only** with the user's explicit OK in chat; they change repository settings.

---

## Agent playbook (what a fresh agent does)

```
1. git clone https://github.com/anuragsubedi/panipuri-minigames && cd panipuri-minigames
2. Read AGENTS.md → CLAUDE.md → docs/PROGRESS.md → the relevant spec in docs/GAME-SPECS.md
3. Confirm scope with the user (plan → OK)
4. git switch -c game/<name>
5. Build in small commits; run `npm run verify` often
6. npm run build && python3 -m http.server 5173 -d _site   # play it like a player would
7. Update docs (PROGRESS, ARCHITECTURE section, DECISIONS as D-XXX, README row, hub tile)
8. git fetch && git rebase origin/main && npm run verify
9. git push -u origin game/<name> && gh pr create --fill   # fill in the template
10. Share the PR link (and preview URL in Phase 2) with the user. Do not merge or approve.
11. Address review comments (the user's or the Architect's `architect:changes-requested` items) with new commits; CI must stay green.
```

### `.github/pull_request_template.md` (to add)

```md
## What
<!-- one paragraph: game/feature/fix -->

## Spec
<!-- link to docs/GAME-SPECS.md section or issue; note any deviations -->

## Checklist
- [ ] `npm run verify` passes locally
- [ ] Played it from `_site/` (desktop + ~375px mobile, light + dark)
- [ ] Hub tile + README row (new games)
- [ ] Docs updated: PROGRESS, ARCHITECTURE section, DECISIONS (D-XXX)
- [ ] No new dependencies (or a linked approval)

## Screenshots
```

Optionally add issue templates (`.github/ISSUE_TEMPLATE/game.md`) so planned work in `docs/GAME-SPECS.md` can become one GitHub issue per game, which agents can claim by assigning themselves or commenting.

---

## If the architecture changes later

| Change | Pipeline impact |
|---|---|
| Add a bundler or framework (Vite, etc.) | `npm ci && npm run build` in CI; deps become allowed (new decision); output still `_site/` → nothing else changes |
| A game needs an API key (e.g. Mapillary for Lost Lens) | Client-side keys are public by nature: use a restricted, domain-locked key. Inject at build from a secret only if the provider supports domain restriction; never commit it |
| Needs a server (multiplayer, leaderboards, API-key proxy) | **Cloudflare Workers** (decided direction, D-022): a separate `workers/<name>/` folder with its own deploy job (`wrangler deploy`, 👤 Cloudflare API token secret), called from the static site via `fetch` with CORS limited to the Pages origin. Workers keep API keys server-side (e.g. Lost Lens/Mapillary). Durable Objects for realtime multiplayer |
| Large assets (photos, audio) | Keep them in the repo while total < ~100 MB; beyond that, use Git LFS or a CDN bucket (decision) |

---

## Implementation plan (once approved)

1. `scripts/verify.mjs` + `scripts/build.mjs` + tests; `npm run verify` / `npm run build`; `.gitignore` `_site/`; fix anything verify flags.
2. `.github/workflows/ci.yml`, `deploy.yml`, PR template; update `AGENTS.md` / `CLAUDE.md` with the branch → PR → merge rule.
3. 👤 Enable Pages + branch protection → first deploy → confirm the public URL works (hub + both games).
4. Phase 2 (separate approval): previews (Cloudflare) and Playwright smoke tests.

Estimated effort: steps 1–2 take about one session; step 3 takes about 5 minutes of the user's time.
