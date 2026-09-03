# Invoice List UI Redesign — Notes

This folder contains a static HTML prototype of the Invoice List screen in the
EmQube Invoice app. It is **not** connected to the Angular app, its services,
its API, or the database — it is a presentational mock for layout/UX review.

## Files

| File | Purpose |
|---|---|
| `invoices.html` | Original / current invoice list prototype (baseline) |
| `invoices-improved.html` | First-improved layout (v1) |
| `invoices-revised.html` | **Revised layout (v2) — incorporates review feedback** |
| `css/invoices-revised.css` | Styling for the revised layout |
| `js/invoices-revised.js` | Behaviour for the revised layout (mock data) |
| `INVOICES-REDESIGN-NOTES.md` | This file |

Open `invoices-revised.html` directly in a browser. No build step required.

---

## Requested changes (v2) and how they were handled

1. **Remove the 'Paid Date' column; show the date small under the status.**
   The dedicated paid-date column is gone. The status cell is now a small
   vertical stack: a colour-coded pill ("Paid" / "Due" / "Cancelled") with a
   tinted second line beneath it — the payment date on paid rows, the invoice
   date on due rows. Only meaningful data shows where it is needed, and it
   costs no extra column width.

2. **Remove the sales-exec avatar.**
   The circular initials avatar was decorative for low-priority data. The
   exec now renders as plain muted text.

3. **Handle one invoice carrying both products.**
   Each invoice row carries a `products` array (see the data comment in
   `js/invoices-revised.js`). The merged "Customer / Item" column renders the
   customer name as a link and stacks **all** line-item titles beneath it, so
   an invoice with two products shows both titles (two bulleted rows).

4. **Actions as upfront icons, not a menu.**
   The ⋮ kebab is replaced with inline icon buttons again — Edit, Record
   Payment (only on due rows), Print (only when not cancelled) — exactly the
   actions the real screen exposes. A cancelled invoice shows only View.

5. **Remove the separate Customer column; link the customer name and put the
   item title(s) under it.**
   There is no longer a standalone Customer column. The customer name is a
   link inside the "Customer / Item" column, with the line-item title(s)
   beneath it (all titles shown when there are multiple).

6. **Keep the search box; add a filter toggle beside it to save space.**
   The facet selects (Year / Status / Division / Customer + Clear) are now
   collapsed by default behind a "Filters" button beside the search. The
   button shows a count of active facets and toggles the panel open/closed.
   Applied filters still surface as removable chips.

## What was deliberately kept from v1 (and still holds)

- Currency-aware summary cards (Outstanding / Invoiced / Paid / Open).
- Status as its own column with a colour dot + label.
- VAT as its own column (no mental arithmetic).
- Total promoted and bolded as the key figure.
- Cancelled rows struck-through and muted; due rows accented.
- Sortable columns.

## V2 review changes applied after feedback

- **Filtered-totals row removed** from the table footer (was a v1 addition).
- **Mobile layout fixed.** On screens <=700px the table now renders as
  readable stacked cards. The previous stacked layout only showed the field
  label and hid the actual value; the revised cell rules stack label-over-value
  so all row data is visible, actions appear as right-aligned icon-only, and
  cards flow full width.
- **Mobile filter panel can no longer overflow** the section: the facet row
  and its selects are forced full-width with `box-sizing:border-box` to fit
  the card; the toolbar also clips stray overflow.
- **Page head stays side-by-side on mobile:** the title and the New Invoice
  button remain on one line (the shell normally stacks them), and the
  button's "New Invoice" text label is hidden so only the plus icon shows.
- **New Invoice icon stays the plain plus** (`icon-plus`), not a circled one.
- **Edit pencil icon removed from the actions column.** The customer name is
  already a direct link that opens the invoice, so a separate pencil button
  was redundant. The actions column now shows only Record Payment (on due
  rows) and Print (when not cancelled); cancelled rows show only a View icon.
- **'Actions' column header title removed** — the header cell is blank, so the
  column reads as a clean icon strip (icons carry their own tooltips).

## Data / status model — unchanged, nothing invented

- **Status is derived, not stored:** Cancelled iff `InvoiceTotal == 0 &&
  TotalVAT == 0`; Paid iff a payment date exists; otherwise Due (see
  `docs/BUSINESS-RULES.md`).
- **No "Overdue" / "Due Date":** `InvoiceListModel` carries no due date, so
  the prototype does not claim one (see `docs/KNOWN-ISSUES.md`).
- **Multi-currency:** each row shows its own `CurrencySymbol`; the footer
  totals and KPI cards aggregate AED rows. Any multi-currency aggregate must
  convert via each row's stored `ConversionRate` (see `BUSINESS-RULES.md`).
