# UI Design System

Source of truth: `d:\projects\.net\01\emqubeinvoice2025\EmqubeInvoice\WebInvoice\src\assets\css\emqube-ui.css` in the old app — a from-scratch design refresh built over the existing Bootstrap 3 / GenesisUI theme, scoped under a `body.eq-ui` kill-switch class so it could be toggled without touching vendor CSS.

**Decision for the new app: no Angular Material.** Build thin standalone components that render the same markup/class names below, backed by CSS ported from this file — minus the `.eq-ui` scoping wrapper, since the new app is a clean build, not an overlay on top of someone else's theme.

## Tokens

| Token | Value / purpose |
|---|---|
| `--eq-primary` | `#0D9C4A` — brand green, the one accent color |
| `--eq-ink` / `--eq-ink-muted` / `--eq-ink-faint` | text color scale, dark → light |
| `--eq-surface` / `--eq-surface-alt` | card/background surfaces |
| `--eq-border` | hairline border color used everywhere |
| `--eq-radius-card` / `--eq-radius-control` | corner radii — cards vs. inputs/buttons |
| `--eq-shadow-card` | the one card shadow used throughout |
| `--eq-sp-1` … `--eq-sp-7` | spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48px |
| `--eq-green-soft` / `--eq-amber-soft` / `--eq-red-soft` / `--eq-info-soft` (+ solid variants) | badge tone pairs |
| `--eq-font-sans` / `--eq-font-mono` | body face + tabular/numeric face (invoice numbers, amounts) |

## Component class catalogue

- **Page head**: `.eq-page-head` (flex, title + primary action), `.eq-page-title`
- **Buttons**: `.eq-btn`, `.eq-btn-primary`, `.eq-btn-outline`, `.eq-btn-sm`
- **Toolbar**: `.eq-toolbar`, `.eq-toolbar-search` (icon + input), `.eq-toolbar-field` (label + select), `.eq-toolbar-clear`
- **Tables**: `.eq-table-card` → `.eq-table-scroll` → `.eq-table` — **deliberately not** using Bootstrap's own `table` class (a component inline `styles:` array in the old app scoped a conflicting padding rule to `.table`; sidestepped by never applying that class). `.eq-num` for right-aligned numeric columns, `.eq-col-action` for the actions column, `.eq-cell-customer`/`.eq-cell-product` for emphasized name cells, `.eq-table-foot` for the paginator row.
- **Badges**: `.eq-badge` + tone modifier `.eq-badge-success` / `-warning` / `-danger` / `-info` / `-neutral`, plus `.eq-badge-sm` for a compact variant used inline next to dense text (e.g. beside an invoice number) rather than next to a page title.
- **Row actions**: `.eq-icon-btn` (30×30 icon-only button), `.eq-row-actions` (flex row, small gap) — or, preferably in the new app, a single kebab trigger opening a dropdown menu (see Modal/Dropdown below) rather than several inline icon buttons, to avoid the column-width/horizontal-scroll problem the old app hit.
- **Modal**: `.eq-modal` (wraps vendor `.modal`/`.modal-dialog`/`.modal-content`/`.modal-header`/`.modal-body`/`.modal-footer`), `.eq-modal-lg` modifier for a wider dialog (multi-column forms). **Known fix already required**: the modal header's flex layout needs `.modal-header::after { content: none; display: none; }` — Bootstrap 3's clearfix pseudo-element becomes an invisible flex item otherwise and strands the close button off-center. See `KNOWN-ISSUES.md`.
- **Forms**: `.eq-form-grid` (2-col) / `.eq-form-grid-3` (3-col), `.eq-field` (label + input/select, `.eq-field-wide` to span the full row), `.eq-form-subtitle` (section divider, `-with-toggle` variant for a subtitle carrying its own switch), `.eq-required` (asterisk)
- **Switches**: `.eq-switch` (the toggle itself), `.eq-switch-row` (one switch + label), `.eq-switch-pair` (groups a switch + its own label inline, for rows with more than one toggle)
- **KPI cards**: `.eq-kpi-grid` → `.eq-kpi` → `.eq-kpi-label` / `.eq-kpi-value` (`eq-mono`, tabular numerals) / `.eq-kpi-delta` (a badge underneath the number)

## Icons

Primary family: **simple-line-icons** (`icon-pencil`, `icon-printer`, `icon-people`, `icon-options-vertical`, etc.) — used for nearly every icon in the old app's toolbar, table actions, and sidebar. A handful of spots mix in **Font Awesome** (`fa fa-angle-down`, `fa fa-cogs`) alongside it. The new app needs its own decision on whether to keep these icon fonts or move to inline SVG — not yet decided, log it in `DECISIONS.md` once settled.

## What NOT to carry over as-is

`ng2-bootstrap`'s modal/dropdown/datepicker directives themselves are not being ported — only the CSS and markup shape they produce. The new app's `EqModal`/`EqDropdown` should be built against Angular CDK Overlay (or hand-rolled with `@HostListener`s), not against the old library.
