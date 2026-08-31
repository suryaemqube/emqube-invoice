# Decisions

An append-only log — add to this, don't rewrite history in it. Each entry: what was decided, and why, so a later session doesn't quietly re-litigate something already settled for a reason that isn't obvious from the code alone.

## Settled

**Rewrite path: clean rewrite (Path C), not incremental upgrade or strangler pattern.**
Chosen after reviewing the dependency/risk assessment of the old app — the old app's `ng2-bootstrap` and `angular2-datatable` dependencies are structural to nearly every screen and both are effectively abandoned; combined with `@angular/http` (removed in Angular 8), duplicate/overlapping dependencies throughout `package.json`, and Angular CLI 1.x tooling, the gap was judged large enough that a rewrite was more predictable than a 14-major-version incremental path.

**No Angular Material.**
A `customer-list` scaffold was briefly built against Material (`MatTableModule`, etc.) as a first test, but the old app's `emqube-ui.css` design language represents months of deliberately tuned, working design. Decision: build thin standalone wrapper components (`EqTable`, `EqModal`, `EqDropdown`, etc.) that render the same `.eq-*` markup/classes, backed by CSS ported from the old app, rather than adopt Material's own visual system.

**Build order: Invoice List first.**
Not the simplest screen, but the most fully specified one — every filter, KPI calculation, status derivation, and two real backend endpoint bugs on it were already traced to the line during the old app's UI refresh work. Customer List was built only as an initial scaffolding test and is being discarded, not carried forward as "screen one."

**Knowledge base as multiple `/docs/*.md` files + root `CLAUDE.md`, not one giant file.**
Chosen for token efficiency: `CLAUDE.md` (auto-loaded by Claude Code every session) instructs reading `PROJECT-OVERVIEW.md`, `BUSINESS-RULES.md`, `CURRENT-WORK.md`, `API-NOTES.md` on every session; `ARCHITECTURE.md`, `UI-DESIGN-SYSTEM.md`, `DECISIONS.md` (this file), and `KNOWN-ISSUES.md` are read on demand, only when a task touches that area.

**`API-NOTES.md` vs `KNOWN-ISSUES.md` split.**
Nearly everything found in the old backend is simultaneously "how the API is shaped" and "a bug to route around" — kept as two files anyway, with a clear boundary: `API-NOTES.md` is the endpoint/shape reference (a look-up table); `KNOWN-ISSUES.md` is the running gotcha log (API-sourced or not — CSS traps, cascade bugs, etc. live there too). Avoids maintaining the same fact in two places by keeping the boundary intentional rather than incidental.

## Open — needs a decision before it matters

- **Auth mechanism for the new app.** The old app sends no Authorization header at all (role/user context is passed as plain values in the POST body); the new app's scaffolded `auth-interceptor.ts` currently assumes a Bearer token in `localStorage` that has no real counterpart today. Decide: keep calling the existing no-auth-header backend as-is for now, or is real token-based auth being added to the backend as part of (or alongside) this rewrite?
- **REST vs. existing POST-only convention.** The scaffolded `ApiService` uses `.get()`/`.put()`/`.delete()` against RESTful-looking paths; the real backend only exposes POST `{controller}/{action}` actions. Decide: adapt the new app's `ApiService` to match the existing convention (simplest, no backend change), or give the backend real REST routes as a parallel effort?
- **Icon system.** Old app uses simple-line-icons + a little Font Awesome. Keep both icon fonts, or move to inline SVG for the new app?
- **DB-driven menu grouping and icons.** The sidebar's "Sales" / "Master Data" grouping and per-item icon exist today only in the old app's client-side interim maps (see `KNOWN-ISSUES.md`) — a real fix means a DB column + SP + EDMX + mapping change. Not yet decided whether the new app repeats the interim-map pattern short-term or the DB change happens first.
