# Business Rules

These are derived from tracing the old app's real code, not assumed from field names. Where something couldn't be confirmed, it's marked as unresolved rather than guessed.

## Invoice status (Paid / Due / Cancelled)

Not a stored field. Derived from three fields already on every invoice row:
```
isCancelled = InvoiceTotal == 0 && TotalVAT == 0
isPaid      = PaymentRecdDateString is present (truthy)
status      = isCancelled ? 'Cancelled' : (isPaid ? 'Paid' : 'Due')
```
"Record Payment" and "Print Invoice" actions are hidden for cancelled invoices (`!(InvoiceTotal==0 && TotalVAT==0)` gates both).

## Multi-currency totals — never blend currencies without converting

Every invoice/quote has its own `CurrencySymbol` and its own `ConversionRate`, fixed at creation time (stored on the row, e.g. `TAXInvoice.ConversionRate` in the DB). The old app's own real formula for converting a foreign-currency total to the home currency (AED) is, verbatim from `create-invoice.component.ts`:
```
AggTotalUAE   = AggTotal   * InvoiceData.ConversionRate
AggPreTaxUAE  = AggPreTax  * InvoiceData.ConversionRate
AggTaxUAE     = AggTax     * InvoiceData.ConversionRate
```
Any aggregate figure spanning multiple invoices (a KPI, a dashboard total) must use **each row's own `ConversionRate`**, not a single fixed/guessed rate applied to everything — rates drift over time, so one fixed rate will silently produce a wrong total. Treat a missing/null rate as `1` (safe default for AED-native rows; a genuinely missing rate on a foreign-currency row is a data problem worth surfacing, not silently absorbing).

`ConversionRate` is **not currently exposed** on the invoice/quote list API responses — see `API-NOTES.md` and `KNOWN-ISSUES.md` before assuming it's available.

## Customer model

- A customer is either an **Individual** or an organization (`IsIndividual`), and separately may be a **Prospect** or a converted **Customer** (`IsProspect`).
- **Customer Code is required unless `IsIndividual == true`.**
- **VAT registration** (`VATEligible`/registered flag) gates whether a **Tax No.** (TRN) is required.
- Billing Address and Shipping Address are separate structures; a "Same as billing address" toggle controls whether the shipping fields are shown/required at all (defaults to same-as-billing).

## Quote model — what's real vs. unresolved

- Quotes have a **type** (e.g. Local / Export / Export-IS) and belong to a **Business Division**, same division list invoices use.
- Quotes support **revisions** (a quote can have a revision number/history).
- **There is no confirmed "awaiting response / accepted / rejected / converted" status field.** `QuoteListModel` carries `PaymentRecdDate`/`PaymentRecdDateString` (odd for a quote — quotes aren't "paid"), and the underlying `TAXInvoice` table has an `ExpiryDate` column not yet exposed on the quote API. Neither has been confirmed to mean "the customer responded." **Do not build a "Quotes Awaiting Response" feature on either field without first checking real data** (compare a known-accepted quote against a known-pending one and see which field actually differs). See `KNOWN-ISSUES.md`.

## Business Divisions

No fixed enum — the list comes from the API (`BusinessDivisionList`, fields `BusinessDivisionId` + `DivisionName`). Known values seen in practice: **Web**, **Software**. Treat the list as open-ended, not a hardcoded two-item set.

## Sidebar menu / role-based access

- The menu is role-based: a logged-in user's `RoleId` determines which top-level items and children they see.
- Items are organized as parent items with optional children (a "has children → renders as an expandable group" pattern), not currently grouped into named sections like "Sales" / "Master Data" at the data level — that grouping exists only in the *design* (this rewrite's target UI), not yet in the database. See `ARCHITECTURE.md` and `KNOWN-ISSUES.md` for what a real DB-driven grouping + icon column would require.
