# API Notes

The real, live shape of the backend — confirmed from the old app's actual code, not assumed. Read this before wiring any new-app service to an endpoint.

## Calling convention — this is not a REST API

Every endpoint is **POST**, routed as `{controller}/{action}` (ASP.NET Web API default action routing — not attribute-routed, not RESTful). There is no `GET`/`PUT`/`DELETE` anywhere in the backend as it exists today.

The old app's base URL (`http.service.ts`): production is `http://invoice.emqube.net/api/`; every call is:
```
POST {baseURL}api/{controller}/{action}
Content-Type: application/json
Body: JSON.stringify(paramValue)   // often null, or a single primitive, or a small object
```
**No Authorization header is sent at all.** Role/user context (e.g. `RoleId`, `ProfileId`, `CustomerId`) is passed as a plain value inside the POST body, not derived from a token. There's a separate, unrelated cookie-based "central login" / SSO check (`Cookie.get("centralLogin")`) used only to decide whether to redirect to a central login page — it isn't a per-request auth mechanism.

**Consequence for the new app's `ApiService`:** until/unless the backend is separately given real REST routes and real token auth, every call needs to be a `POST` to `{controller}/{action}`, matching this convention — not `.get()`/`.put()`/`.delete()` against guessed RESTful paths.

## Endpoints confirmed so far

| Endpoint | Method/body | Returns | Notes |
|---|---|---|---|
| `Invoice/GetInvoiceList` | POST, no body | `IList<InvoiceListModel>` | `TaxInvoiceId, InvoiceNumber, InvoiceDateString, DivisionName, CustomerName, CurrencySymbol, InvoiceTotal, TotalVAT, SExecutiveFirstName, SExecutiveLastName, SExecutiveName, InvoicePaidDate, PaymentRecdDateString, PaymentRecdDate, InvoiceDate, InvoiceRevNumber, IsPaid, ProductName, PreTaxTotal, IsEditable`. **No `ConversionRate`** — see Known Issues. |
| `Invoice/GetCustomerList` | POST, body `int? customerId` (nullable — pass `null` for the full list) | `IList<CustomerListModel>` | `CustomerId, CustomerCode, CustomerName, CustomerType, IndustryId, IsIndividual, IsProspect, Website, ProfileId, Designation, Email, FirstName, LastName, Phone, ...` |
| `Invoice/GetBusinessDivisionList` | POST, body `null` | list of `{BusinessDivisionId, DivisionName}` | wrapped as `{Error, ...}` in some call sites — check for `data["Error"] == null` before trusting the payload |
| `Invoice/GetSalesExecutiveList` | POST, body `{SalesExecutiveId, ProfileId, ReportingTo}` (all nullable) | list of `{SalesExecutiveId, Name}` | `Name` is a single combined field, not First/Last |
| `Invoice/GetQuoteList` | POST, no body | `IList<QuoteListModel>` | `TaxInvoiceId` (holds the quote's own id), `QuoteNumber, QuoteDateString, DivisionName, CustomerName, CurrencySymbol, InvoiceTotal, TotalVAT, SExecutiveName, PaymentRecdDateString, PaymentRecdDate, InvoiceDate, ProductName, QuotetypeText, Quotetype, QuotetypeValue`. See Business Rules re: unresolved status meaning. |
| `Common/GetSiteuserMenuList` | POST, body `int roleId` | `IList<MenuListModel>` — `{ParentMenu: MenuModel, Childmenu: MenuModel[]}` | `MenuModel`: `MenuItemId, MenuName, MenuParentId, MenuOrder, PageUrl, CssClass, MenuGroup, DepartmentId, RightDelete, RightEdit, RightCreate, RightView`. **`CssClass` and `MenuGroup` DO reach the client** (`emQubeLibrary/GetSiteUserMenu_Result.cs` selects them; `EmqubeCommonService.GetSiteuserMenuList` maps them). `MenuGroup` is `'Sales'` or `'Master Data'`; `CssClass` is an `icon-*` font class. Only rows whose `RoleId` has a `MenuRole` entry are returned. (The old app's hardcoded grouping/icons were unnecessary — the API already carried the data. See Known Issues.) |
| `Common/GetLogin` | POST, body `LoginModel` `{UserName, Password, IPAddress}` (password encrypted server-side) | `RLogin` = `{Login: GetLoginDetails_Result, Error: InvoiceMessage}`. On bad creds or `IsActive==false`, `Login` is null + `Error.Text` set. | The login payload **is** the user-level model: `ProfileId, SiteUserId, UserName, RoleId, RoleName, UserTypeId, UserTypeValue, UserType, FirstName, LastName, Email, IsActive, LastLogin, ...`. Stored as `localStorage.userDetails`; the new app's `UserService` reads `RoleId`/`ProfileId` from it. |
| `Common/GetLoginCDB` | POST, body `LoginModelCdb` `{UserName, IPAddress}` | `RLoginCdb` = same `Login` shape | Central-login (SSO) variant, fed by an external `/sso/validate-code` exchange. Not yet ported to the new app (only direct `GetLogin` is). |
| `Common/ChangePassword` | POST, body `{userId, NewPassword, ConfirmPassword}` | `{Code, Text, MessageTypeValue}` (1=success) | `userId` here is `ProfileId`. |
| `Invoice/AddCustomer` | POST, body = full customer form model | — | used by the add/edit customer modal |
| `Invoice/GetCustomer` | POST, body `customerId` | single customer detail | used to populate the edit modal |
| `Invoice/AddPayment` | POST, body = invoice + payment date | — | Record Payment action |
| `Invoice/GenerateInvoice` / `Invoice/GenerateQuote` | POST, body `TaxInvoiceId` | file path/name | triggers PDF generation, response used to build a download URL |
| `Invoice/getInvoiceYear` | POST, no body | `int[]` | populates the Year filter |
| `Common/GetCountry` / `Common/GetState` | POST | `{Error, CountryList}` / `{Error, StateList}` shape | note the `Error`-wrapped response shape here, unlike some other endpoints — always check the actual response shape per endpoint rather than assuming consistency across the API |
| `Invoice/GetCurrencyList` | POST, body `null` | list of `{CurrencyId, CurrencyName, CurrencySymbol, ConversionRate}` | `CurrencyId 1` = AED (rate `1`) |
| `Common/GetPaymentTerm` | POST, body `10` | `{PaymentTermList}` (comma-joined `RPaymentTermList`) | `PaymentTermId, Name, NoOfDays` |
| `Common/GetMetaDataList` | POST, body `{MetaDataId}` | **raw `DataTable`** → JSON array of plain objects; column names are the `MetaDataDetail` `DisplayName` aliases | Server already applies `ShowInGrid=1` and left-joins FK columns (alias `PrimaryTable+MetaDataDetailId`); the key column aliases as `Id`. Driven by the DB `MetaData`/`MetaDataDetail` tables (Product=1, ProductCategory=2, PaymentTerm=3). |
| `Common/GetMetaData` | POST, body `{MetaDataId, PrimaryKey}` | `{Error, MetaData[]}` — each: `DisplayName, FieldName, FieldValue, DataType ('string'/'int'/'bit'/'date'), Regex, UpdateField, IsForiegnkey, IsMandatory, DropDownList[{Id,Name}]` | `PrimaryKey` empty → blank Add form (values null, dropdowns prefilled). **`DataType` is NOT stored in `MetaDataDetail`** — derived at runtime from the real SQL column type (varchar→string, money→string, smallint/tinyint→int, bit→bit). FK dropdowns populated from `PrimaryTable` with optional `WhereCondition`. |
| `Common/AddUpdateMetaData` | POST, body `{MetaDataId, Data: MetaDataModel[]}` | `InvoiceMessage` (1=success, 2=error) | Insert-vs-update decided by whether the key field's `FieldValue` is empty. Field values are raw strings; bit values sent as `"True"/"False"`. |
| `Common/DeleteMetaData` | POST, body `{MetaDataId, PrimaryKey}` | `InvoiceMessage` | **MessageTypeValue 3 = FK-in-use** (backend maps the REFERENCE-constraint error to text "the item is used in another table"), otherwise 1=success / 2=error. |
| `Common/GetParameters` | POST, body `type` (int) | `{ParameterList}` (`RParameterList`) | `5` = invoice types, `6` = discount-rate types (`1`=percent, `2`=flat), `7` = VAT types (`1`=simplified) |
| `Invoice/GetAccountLedgerList` | POST, body `null` | list of `{AccountLedgerId, AccountLedgerCode}` | sales ledger dropdown |
| `Invoice/GetUOMList` | POST, body `null` | list of `{UOMId, Name}` | |
| `Invoice/GetVATCodeList` | POST, body `null` | list of `{VatCodeId, VATCode (name), VATRate}` | `1`=Std, `2`=Zero, `3`=Exempt |
| `Invoice/GetProductList` | POST, body `{ProductId:null, ProductType:null, CategoryId:null, VATCode:null}` | list of products | fields incl. `ProductName, ProductDescription, UOM, Quantity, VatCodeId` |
| `Invoice/GetInvoicesList` | POST, body `TaxInvoiceId` | `IList<InvoiceModel>` | full invoice for the Edit screen — line items in `ProductList` |
| `Invoice/getCustomerQuote` | POST, body `CustomerId` | list of `{QuoteId, QuoteNumber}` | Quote dropdown options for the New Invoice screen |
| `Invoice/GetQuotesList` | POST, body `QuoteId` | `IList<QuoteModel>` | full quote to pre-fill the invoice form |
| `Invoice/AddUpdateInvoive` | POST, body = full invoice model | `{Text, MessageTypeValue, ...}` | **endpoint misspelled exactly like this** (`AddUpdateInvoive`); `MessageTypeValue` `1`=success, `2`=error; used for both save and cancel (cancel zeroes totals out before POST) |

## A wrong endpoint that was actually being called — cautionary example

`invoicelist.component.ts` (old app) called `Invoice/GetCustomers` for months without effect — **that action doesn't exist**; the real one is `Invoice/GetCustomerList`. It only surfaced as a bug once the feature was actually wired up and used. `Quote/quotelist/quotelist.component.ts` has the same mistake, still unfixed as of this writing. **Lesson: confirm every endpoint against the real controller source (or a live Network-tab capture) before building a new-app service around it — don't trust a name because it "sounds right."**
