# Current Work

Keep this short and current — it's read every session. Update it as work actually progresses; a stale entry here is worse than no empty one, since it actively misleads the next session.

## Status as of this writing

**Phase 3 (Shared Components) + Phase 4 (Invoice List) + Option A polish + Create/Edit Invoice are complete.** The app builds and type-checks clean.

### Create / Edit Invoice built (`src/app/features/invoices/pages/create-invoice/`)

- **Model:** `models/invoice.model.ts` — added `InvoiceFormModel`, `InvoiceLineItem` (+ all master-data types: `CurrencyModel`, `PaymentTermModel`, `ParameterModel`, `AccountLedgerModel`, `UOMModel`, `VATCodeModel`, `StateModel`, `ProductModel`, `CustomerDetail`, `QuoteOption`, `QuoteDetailsModel`, `QuoteModel`, wrapper `R*List` types), `emptyInvoiceForm()`, `emptyLineItem()`
- **Service:** `services/invoice.service.ts` — added the create/edit endpoints (currencies, payment terms, parameters, account ledgers, UOMs, VAT codes, products, customers-full, `getInvoicesList`, customer quotes, quotes list, `addUpdateInvoice`)
- **Page:** `pages/create-invoice/` — full port of the old create/edit screen:
  - **New:** customer select auto-fills address/attention/TRN/currency/rate/place-of-supply and the quote dropdown (load quote → pre-fill form + lines)
  - **Edit (`/createinvoice/:id`):** loads via `GetInvoicesList`, back-solved discount mode, status badge (Cancelled/Paid/Due), Print + Cancel Invoice buttons
  - **Lines:** add/remove rows, product pick → description/UOM/VAT-rate autofill, per-line discount (percent/flat via discount-mode), live tax recalc; VAT-code-grouped summary table under the grid
  - **Tax math:** faithful port of the old formulas — std branch sums per VAT code then totals; simplified branch (`IsTaxInclusive || VATType===1`) back-solves tax incl. `SimplifiedVATCodeId`/`SimplifiedDiscountRateId`
   - **Dates:** ng-bootstrap datepickers (Invoice/Delivery/Payment) with `d/M/yyyy` strings + ISO built at save; min invoice date from customer invoice start date (**payment date is NOT auto-computed** — see the payment-date fix below)
  - **Terms & Conditions:** TinyMCE editor (`@tinymce/tinymce-angular` v9 `EditorComponent`)
  - Save posts the whole form to the misspelled `AddUpdateInvoive` endpoint; toast + redirect to list
- **Routes:** `app.routes.ts` — `createinvoice` and `createinvoice/:id` (lazy)
- **TinyMCE wiring:** `angular.json` copies `node_modules/tinymce` → `assets/tinymce`; `app.config.ts` provides `TINYMCE_SCRIPT_SRC` = `assets/tinymce/tinymce.min.js`
- **Styles:** reused global `_forms.scss` classes (`eq-invoice-*`, `eq-form-card`, `eq-line-table`, `eq-summary-*`, `eq-editor-slot`); component scss adds only base `select` styling + `.eq-required`

### Create/Edit Invoice — recent fixes & additions

- **Loader freeze fixed:** the form stayed stuck on "Loading invoice form…" even though all 13 boot endpoints returned 200. Root cause was change detection not re-rendering after `loading=false`; forced with `ChangeDetectorRef.detectChanges()` in `ngOnInit`'s forkJoin next/error and in `loadInvoice`. Also added per-group `timeout(15000)` + `catchError→of(null)` + 30s safety cap (all still useful for resilience).
- **Edit-load VAT-code mapping fixed (`normalizeRow`):** the backend DTO sends `VATCodeId` (capital) but the model read `VatCodeId` — every loaded line's VAT code became 0, `calculateTax()` skipped all lines, totals stayed 0, and the status badge fell into the "Cancelled" heuristic (`InvoiceTotal==0 && TotalVAT==0`). `normalizeRow` now reads `VATCodeId ?? VatCodeId` (plus `InvoiceVatRate` fallback) → summary shows real amounts and Paid/Due badge is correct.
- **Header meta** now mirrors the old app: `Paid/Due/Cancelled badge · Customer Name · Invoiced {date} · Read-only badge` in edit mode (via `invoiceDateLabel` getter). Back button text → "Back to Invoices".
- **Line table** header uses the old `num`/`actions` column classes; removed the fixed `<colgroup>` pixel widths and set `min-width:0` + `table-layout:auto` locally so the table no longer forces page-level horizontal scroll.
- **Icons fixed (`_icons.scss`):** added the missing `icon-*::before { content }` glyph mappings for Simple Line Icons (the old app's bundle had them, our port only copied the `@font-face` + family rule, so `<i class="icon-doc">` rendered empty). Added `.eq-icon-btn.dropdown-toggle::after { display:none }` to drop the ng-bootstrap caret on the kebab button.

### Copy Invoice (from edit page header)

- **Trigger:** header **Copy** button on the edit page (`isEdit && !isCancelled && !isCopy`), opens an ng-bootstrap confirm modal ("Do you want to copy this invoice?"), **Yes** → `copyInvoice()`.
- **Mechanism (matches old app — no route change, stays on `/createinvoice/:id`):** sets `isCopy=true`, nulls `TaxInvoiceId`, `InvoiceNumber`, and the Invoice/Delivery/Payment dates (`*Date` + `*DateString`), and zeroes each line's `TAXInvoiceDetailId`/`TaxInvoiceId`. Customer, lines, and FooterText are kept. Because `TaxInvoiceId` is null and line ids are 0, `submit()` posts to the same `AddUpdateInvoive` endpoint and the backend creates a brand-new invoice.
- **UI in copy mode:** header title "Copy of {num}", Save button reads "Save Invoice", Print and Cancel Invoice buttons hidden (`isEdit && !isCopy`). Dates cleared for the user to re-enter (old app behavior).
- **Blocked for cancelled invoices** (button not shown + `copyInvoice()` guards on `isCancelled`).
- **Cancelled-status fix:** `loadInvoice` captures `cancelledOnLoad` from the backend header (`InvoiceTotal==0 && TotalVAT==0`) *before* `calculateTax()` runs, and `isCancelled` uses that for loaded invoices. Previously `calculateTax()` recomputed totals from the line `Qty/Rate` on load, resurrecting non-zero totals on a cancelled invoice → it showed "Paid" and the Copy button. New (`loaded=false`) and copy invoices are never treated as cancelled.
- **Copy clears all dates (incl. payment):** `form.Payment*` and `paymentDateStruct` are nulled, so the saved copy posts a null payment date (matches old app, which nulls it in both `CopyItem` and `getInvoice`). Added a `setTimeout(cdr.detectChanges())` so the ng-bootstrap datepicker inputs visibly clear after the confirm modal closes.
- **Payment date is NOT auto-computed (matches old app):** removed `applyPaymentDate()` auto-fill from `onInvoiceDatePicked`/`onPaymentTermPicked`. The old app's `SetPaymentDate()` is defined but never invoked, and its payment-date input has no change handler — so changing the invoice date or payment term does NOT fill the payment date there. Ours now only sets the payment date when the user picks it (or parses the stored value on edit-load). Payment-date min/max bounds relaxed to the global invoice-date range (2017-06-10 → today) to match the old app.
- **KPI date-parsing fix (invoice list):** the KPI cards were not counting newly created/copied invoices. Root cause: the KPIs parsed `InvoiceDateString` (the `d/M/yyyy` display string) with `new Date()`, which fails on that format → the invoice was excluded from "Invoiced this month" / "Outstanding (YR)". Fixed to parse the ISO `InvoiceDate` field (`parseDate(row.InvoiceDate) ?? parseDate(row.InvoiceDateString)`), matching the old app which parses `item.InvoiceDate` for KPI math and uses the string only for display. Same applied to `PaymentRecdDate` for "Paid this month". Removed the now-unused `extractYear()`.
- **Outstanding KPI converts to AED via saved per-invoice `ConversionRate`:** the "Outstanding (YR …)" card now sums `InvoiceTotal * (ConversionRate || 1)` over non-cancelled, unpaid, same-year invoices, so USD (or any other-currency) invoices are converted to AED at the rate recorded on the invoice. The backend list (`GetInvoiceList`) already returns `ConversionRate` per row (old app `InvoiceService.cs:792`); added `ConversionRate` to the frontend `InvoiceListModel` to consume it. "Invoiced this month" / "Paid this month" remain raw (not currency-converted) until requested otherwise.

**Known deliberate deviations from the old app:** native `<select>` (no ng2-select), no "amount in words" display, `calculateTax()` silently skips incomplete rows (tight checks live in `validate()`, which toasts), no role-based edit-locking / usertype gating (no user/login system yet — copy is shipped ungated exactly like the old app's copy/print, which were not role-gated; Save/Cancel usertype gating deferred to a future step).

### Shared components built (`src/app/shared/components/`)

| Component | File | Selector | Purpose |
|---|---|---|---|
| `EqBadge` | `eq-badge/eq-badge.ts` | `eq-badge` | Status badge (`tone`, `compact` inputs) |
| `EqToolbar` | `eq-toolbar/eq-toolbar.ts` | `eq-toolbar` | Filter bar wrapper |
| `EqDropdown` | `eq-dropdown/eq-dropdown.ts` | `eq-dropdown` | Kebab row-action menu (ng-bootstrap) |
| `EqPaginator` | `eq-paginator/eq-paginator.ts` | `eq-paginator` | Table footer with pagination (ng-bootstrap) |
| `EqTable` | `eq-table/eq-table.ts` | `eq-table` | Table shell with skeleton loading |

### Shared services built (`src/app/shared/services/`)

| Service | File | Purpose |
|---|---|---|
| `ToastService` | `toast.service.ts` | Lightweight toast notifications (success/error/warning) |

### Invoice List built (`src/app/features/invoices/`)

- **Model:** `models/invoice.model.ts` — `InvoiceListModel`, `BusinessDivision`, `SalesExecutive`, `CustomerOption`, `InvoiceMessage`, `PaymentModel`, `deriveStatus()`, `KpiCard`
- **Service:** `services/invoice.service.ts` — all 7 API endpoints (list, years, divisions, executives, customers, generate PDF, add payment)
- **Page:** `pages/invoice-list/` — full list with:
  - Page head with "New Invoice" button
  - Toolbar (search + year/status/division/customer filters + clear button)
  - KPI cards (Outstanding / Invoiced this month / Paid this month)
  - Table (9 columns + action dropdown + inline status badges + division icons)
  - Row actions: Edit (always), Record Payment (due only, opens datepicker modal), Print (non-cancelled, opens PDF in new tab)
  - Pagination (100 default, 50/100/150 page sizes)
  - Empty state
  - Skeleton loading
  - Filter persistence via localStorage (save on change, restore on load, delete after restore)
  - Record Payment modal (ng-bootstrap datepicker, invoice context, min=invoicedate max=today, d/M/yyyy format)
- **Route:** `app.routes.ts` — `invoicelist` loads the real component

## Standing rules for this project (until told otherwise)

- **Do not modify anything in this project without an explicit go-ahead for that specific change.** Reviewing/reading is always fine; writing, deleting, or scaffolding is not, until told.
- **Do not modify the old app** (`d:\projects\.net\01\emqubeinvoice2025\EmqubeInvoice\`) as part of this rewrite. It's the reference/spec. If a bug there needs fixing, that's its own separate, explicitly-requested change.
- No Angular Material — thin components wrapping `.eq-*` CSS (see `UI-DESIGN-SYSTEM.md`, `DECISIONS.md`).
- Build order starts with Invoice List, not Customer List.
