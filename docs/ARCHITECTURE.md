# Architecture

## The old backend has two overlapping projects — don't assume by filename

There are genuinely **two separate class libraries** that both talk to (parts of) the same database, and they are not interchangeable even when a file in one has the exact same name as a file in the other:

- **`EmqubeInvoice.DAL` / `.BL` / `.API` / `.Entity` / `.Interface`** — the "main" backend, EF6 database-first via `InvoiceEntity.edmx` (in `EmqubeInvoice.DAL`), connection string `EmqubeInvoiceEntities`. Handles invoices, quotes, customers, most master data.
- **`emQubeLibrary`** (sibling folder to the main solution, `d:\projects\.net\01\emqubeinvoice2025\emQubeLibrary\`) — a *second* backend layer, EF6 via `LibraryEntity.edmx`, connection string `VATXInvoiceEntities`. Handles the sidebar menu (`EmqubeCommonService.GetSiteuserMenuList`) and is instantiated directly (`new EmqubeCommonService()`) by some controller actions instead of going through the DI-registered services used elsewhere.

**Both connection strings point at the same physical SQL Server database** (`EmqubeInvoice_UAT` on the same host/port, per `Web.config`) — they're two different EF models over one database, not two databases.

**The landmine:** `EmqubeInvoice.DAL/GetSiteUserMenu_Result.cs` and `emQubeLibrary/GetSiteUserMenu_Result.cs` are two unrelated, identically-named auto-generated classes. Only the `emQubeLibrary` one is on the live path for the menu. If a task ever involves editing an EDMX-generated result class, **trace the actual call chain first** (grep for who calls the function import, don't assume from the filename which project is "the real one").

## Traced data-flow chains (confirmed, not guessed)

**Sidebar menu:**
```
SQL Server: dbo.MenuItem + stored procedure GetSiteUserMenu
  → emQubeLibrary/LibraryEntity.edmx (function import)
  → emQubeLibrary/GetSiteUserMenu_Result.cs (flat row)
  → emQubeLibrary/EmqubeCommonService.cs: GetSiteuserMenuList(roleId)
      — LINQ groups flat rows into ParentMenu/Childmenu
  → emQubeLibrary/EmqubeCustomModel.cs: MenuModel / MenuListModel
  → EmqubeInvoice.API/Controllers/CommonController.cs: GetSiteuserMenuList([FromBody] int roleId)
      — note: instantiates `new EmqubeCommonService()` directly, not via DI/interface
  → Angular: Common/GetSiteuserMenuList
```

**Invoice list:**
```
SQL Server: stored procedure GetInvoiceList
  → EmqubeInvoice.DAL/InvoiceEntity.edmx (function import)
  → EmqubeInvoice.DAL/GetInvoiceList_Result.cs (flat row)
  → EmqubeInvoice.BL/InvoiceService.cs: GetInvoiceList()
      — manual field-by-field mapping loop into InvoiceListModel
  → EmqubeInvoice.Entity/InvoiceListModel.cs (the shape Angular actually receives)
  → EmqubeInvoice.API/Controllers/InvoiceController.cs
  → Angular: Invoice/GetInvoiceList
```

**Quote list** follows the same shape as invoice list, through `InvoiceService.cs: GetQuoteList()` into `QuoteListModel` (also in `EmqubeInvoice.Entity/InvoiceListModel.cs`, same file as `InvoiceListModel`).

When adding a new field to any API response (e.g. exposing `ConversionRate`), the change has to happen at **every link in that specific chain** — the stored procedure's SELECT, the EDMX refresh, the `*_Result.cs` regeneration, the hand-written model class, and the manual mapping loop. Skipping any one of these means the field silently never reaches Angular even though everything "upstream" was changed correctly.

## Old frontend structure (what's being replaced)

`WebInvoice/src/app/`:
- `layouts/full-layout.component.*` — shell: header, sidebar (`*ngFor` over `menuList`), profile menu
- `invoice/invoicelist/`, `invoice/create-invoice/` — the two most fully-specified screens (see `CURRENT-WORK.md`)
- `Quote/quotelist/`, `Quote/create-quote/` — parallel structure to invoice, less refined
- `customer/customer.component.*` — customer list + add/edit modal
- `services/http.service.ts` — the one HTTP wrapper every component calls through (`ajaxPost`); see `API-NOTES.md` for its actual calling convention
- `common/message.service.ts`, `common/Constants.ts` — shared toast/message and constants

## New app target structure

`D:\projects\.net\02\emqubeinvoice2026\emqube-invoice\src\app\`:
- `core/services/` — `ApiService` (thin `HttpClient` wrapper), auth handling
- `core/interceptors/` — functional interceptors (`provideHttpClient(withInterceptors([...]))`)
- `shared/` (to be created) — the thin `.eq-*`-wrapping components: `EqTable`, `EqModal`, `EqDropdown`, `EqSelect`, `EqSwitch`, `EqBadge`, etc. See `UI-DESIGN-SYSTEM.md`.
- `features/<domain>/pages/`, `features/<domain>/services/`, `features/<domain>/models/` — one folder per screen area (invoices, quotes, customers, master-data)
- `layouts/` — `main-layout` (authenticated shell), `auth-layout`, `blank-layout`

All standalone components, lazy-loaded via `loadComponent` in `app.routes.ts`. No NgModules.
