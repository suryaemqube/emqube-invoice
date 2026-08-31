# Project Overview

## What this app is

EmQube Invoice is an internal invoicing/quoting system for a business with a **Sales** side (Invoices, Quotes, Customers) and a **Master Data** side (Products, Categories, Payment Terms, Employees, Sales Executives, Units of Measure, VAT Codes, Currencies, Business Divisions). Invoices and quotes are multi-currency (a company home currency — AED — plus foreign-currency billing such as USD), tax-inclusive/exclusive, and organized under **Business Divisions** (at minimum "Web" and "Software" — the full list comes from the API, not a fixed enum).

## Two codebases involved

**The old app (reference/spec, not being edited as part of this rewrite):**
`d:\projects\.net\01\emqubeinvoice2025\EmqubeInvoice\`
- `WebInvoice/` — Angular 4.0.1 frontend
- `EmqubeInvoice.API` / `.BL` / `.DAL` / `.Entity` / `.Interface` — .NET Framework Web API backend, EF6 database-first
- `..\emQubeLibrary\` (sibling folder, separate class library) — a *second*, overlapping backend layer used by some features (notably the sidebar menu and customer lookups). See `ARCHITECTURE.md` before assuming which backend project actually serves a given screen.
- This app is not being touched as part of the rewrite. If a backend bug needs fixing, that happens there as its own change — the new app should not "quietly fix it while rewriting the frontend."

**The new app (this project, clean rewrite of the frontend only):**
`D:\projects\.net\02\emqubeinvoice2026\emqube-invoice\`
- Angular ^22, standalone components, `provideHttpClient`, feature-based folders.
- Talks to the **same backend and database** as the old app — nothing on the API/DB side is being rewritten unless separately decided. See `API-NOTES.md` for how to call it correctly.
- No Angular Material — thin components wrapping the existing `.eq-*` design language instead. See `UI-DESIGN-SYSTEM.md`.

## Status derivation — read this before building any list screen

Nothing about "Paid / Due / Cancelled" is a stored field anywhere. It's always derived, consistently, as:
- **Cancelled**: `InvoiceTotal == 0 && TotalVAT == 0`
- **Paid**: not cancelled, and a payment date is recorded
- **Due**: not cancelled, no payment date recorded

Full detail and the exact fields this reads from: `BUSINESS-RULES.md`.

## For anything deeper than this page

- **`ARCHITECTURE.md`** — how the two backend projects/EDMX models relate, and the data-flow chain for the endpoints already traced (menu, invoice list).
- **`API-NOTES.md`** — the real endpoint reference: URLs, method, request/response shapes.
- **`UI-DESIGN-SYSTEM.md`** — the `.eq-*` token/class catalogue to build the new thin components against.
- **`DECISIONS.md`** — why things were chosen the way they were, and what's still open.
- **`KNOWN-ISSUES.md`** — real bugs and gotchas already found in the old codebase; check here before assuming an endpoint or field works as its name suggests.
- **`CURRENT-WORK.md`** — what's actually in progress right now.

Read the one relevant to the task at hand — these four are not meant to be loaded every session.
