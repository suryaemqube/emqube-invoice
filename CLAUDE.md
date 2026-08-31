# Project Instructions

This is a clean Angular rewrite of the EmQube Invoice application. The old app and its backend are documented in `/docs` — read the relevant files before assisting, don't rediscover this project from scratch each session.

Before assisting:

1. Read `docs/PROJECT-OVERVIEW.md`
2. Read `docs/BUSINESS-RULES.md`
3. Read `docs/CURRENT-WORK.md`
4. Read `docs/API-NOTES.md`

The other docs in `/docs` — `ARCHITECTURE.md`, `UI-DESIGN-SYSTEM.md`, `DECISIONS.md`, `KNOWN-ISSUES.md` — are read on demand: read the relevant one before touching that specific area (e.g. `UI-DESIGN-SYSTEM.md` before building a component, `KNOWN-ISSUES.md` before trusting an endpoint or a CSS assumption), not every session.

Use these documents as source of truth over assumptions, prior training, or what a similarly-named old-app file suggests — several real bugs already exist in the old codebase precisely because two things with the same name weren't actually the same thing (see `ARCHITECTURE.md` and `KNOWN-ISSUES.md`).

## Standing rules

- Do not modify anything in this project without an explicit go-ahead for that specific change. Reading/reviewing is always fine.
- Do not modify the old app (`d:\projects\.net\01\emqubeinvoice2025\EmqubeInvoice\`) as part of work on this project. It's the reference/spec, not something this rewrite edits.
- Keep `docs/CURRENT-WORK.md` and `docs/DECISIONS.md` up to date as work actually happens — a stale `CURRENT-WORK.md` misleads the next session more than an empty one would.
