import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDateStruct, NgbInputDatepicker, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { forkJoin, Observable, catchError, of, tap, timeout } from 'rxjs';
import { InvoiceService } from '../../services/invoice.service';
import {
  InvoiceFormModel,
  InvoiceLineItem,
  CustomerDetail,
  CurrencyModel,
  PaymentTermModel,
  ParameterModel,
  AccountLedgerModel,
  UOMModel,
  VATCodeModel,
  StateModel,
  ProductModel,
  QuoteOption,
  SalesExecutive,
  BusinessDivision,
  emptyInvoiceForm,
  emptyLineItem,
} from '../../models/invoice.model';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfigService } from '../../../../core/services/config.service';

interface TaxSummary {
  VatCodeId: number;
  VATCode: string;
  VATRate: number;
  PreTax: number;
  Tax: number;
  Total: number;
}

@Component({
  selector: 'app-create-invoice',
  imports: [DecimalPipe, FormsModule, NgbInputDatepicker, EditorComponent, EqBadge],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss',
})
export class CreateInvoice implements OnInit {
  private api = inject(InvoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(NgbModal);
  private config = inject(ConfigService);

  form: InvoiceFormModel = emptyInvoiceForm();
  lines: InvoiceLineItem[] = this.form.ProductList;

  @ViewChild('copyModal') copyModal!: TemplateRef<unknown>;

  customers: CustomerDetail[] = [];
  currencies: CurrencyModel[] = [];
  paymentTerms: PaymentTermModel[] = [];
  vatTypes: ParameterModel[] = [];
  invoiceTypes: ParameterModel[] = [];
  rates: ParameterModel[] = [];
  states: StateModel[] = [];
  accountLedgers: AccountLedgerModel[] = [];
  uoms: UOMModel[] = [];
  vatCodes: VATCodeModel[] = [];
  products: ProductModel[] = [];
  salesExecutives: SalesExecutive[] = [];
  divisions: BusinessDivision[] = [];
  quoteOptions: QuoteOption[] = [];
  taxSummary: TaxSummary[] = [];

  uaeSymbol = 'AED';
  selectedCustomerName = 'Select Customer';
  quoteId: number | null = null;

  isEdit = false;
  isCopy = false;
  loaded = false;
  loading = true;
  saving = false;
  loadingStatus = 'Loading invoice form…';

  invoiceDateStruct: NgbDateStruct | null = null;
  deliveryDateStruct: NgbDateStruct | null = null;
  paymentDateStruct: NgbDateStruct | null = null;

  minInvoiceDate: NgbDateStruct = this.toStruct(new Date(2017, 5, 10))!;
  maxInvoiceDate: NgbDateStruct = this.toStruct(new Date())!;
  minDeliveryDate: NgbDateStruct = this.toStruct(new Date(2017, 5, 10))!;
  minPaymentDate: NgbDateStruct = this.toStruct(new Date(2017, 5, 10))!;
  maxPaymentDate: NgbDateStruct = this.toStruct(new Date())!;

  aggPreTax = 0;
  aggTax = 0;
  aggTotal = 0;
  aggDiscount = 0;
  aggPreTaxUAE = 0;
  aggTaxUAE = 0;
  aggTotalUAE = 0;
  aggDiscountUAE = 0;

  get isCancelled(): boolean {
    if (this.isCopy) return false;
    if (this.loaded) return this.cancelledOnLoad;
    return false;
  }

  private cancelledOnLoad = false;

  // Set from the invoice-list Edit action (query param `editable`), mirroring the
  // old app's per-invoice IsEditable hand-off to the edit screen. The edit
  // endpoint doesn't carry it. Defaults to NON-editable (0) so that an edit
  // reached without an explicit `editable=1` param renders read-only — the same
  // way the old app treats a missing `IsEditable` as `!= 1` (locked). New and
  // copy drafts stay editable via `canEdit`'s `!isEdit`/`isCopy` short-circuits.
  invoiceEditable = 0;

  // The form is editable only while the invoice itself is editable (or it's a
  // brand-new/copy draft). Editing a saved invoice is a read-only view: the
  // Copy/Print buttons stay available, but the fields stay locked. This matches
  // the old app, where a locked invoice (IsEditable != 1) shows a read-only form
  // regardless of the logged-in user's role.
  get canEdit(): boolean {
    if (!this.isEdit) return true;
    if (this.isCopy) return true;
    return this.invoiceEditable === 1;
  }

  get isPaid(): boolean {
    return !!this.form.PaymentRecdDateString || !!this.form.PaymentRecdDate;
  }

  get statusTone(): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (this.isCancelled) return 'neutral';
    if (this.isPaid) return 'success';
    return 'warning';
  }

  get statusLabel(): string {
    if (this.isCancelled) return 'Cancelled';
    if (this.isPaid) return 'Paid';
    return 'Due';
  }

  get invoiceDateLabel(): string {
    const d = this.invoiceDateStruct;
    if (!d) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.day).padStart(2, '0');
    return `${day} ${months[d.month - 1] ?? ''} ${d.year}`;
  }

  get showForeign(): boolean {
    return !!this.form.CurrencyId && this.form.CurrencyId !== 1;
  }

  get currencySymbol(): string {
    const cur = this.currencies.find((c) => c.CurrencyId === this.form.CurrencyId);
    return cur?.CurrencySymbol?.trim() ?? '';
  }

  get isSimplified(): boolean {
    return this.form.IsTaxInclusive || this.form.VATType === 1;
  }

  editorInit = {
    height: 220,
    menubar: false,
    plugins: 'lists',
    toolbar: 'undo redo | bold italic underline | bullist numlist',
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    const editableParam = this.route.snapshot.queryParamMap.get('editable');
    if (editableParam !== null) {
      this.invoiceEditable = Number(editableParam) === 1 ? 1 : 0;
    }

    const keys = [
      'customers',
      'currencies',
      'paymentTerms',
      'vatTypes',
      'invoiceTypes',
      'rateTypes',
      'states',
      'accountLedgers',
      'uoms',
      'vatCodes',
      'products',
      'executives',
      'divisions',
    ] as const;
    const pendingGroups = new Set<string>([...keys]);

    const settled = (key: string): void => {
      pendingGroups.delete(key);
      this.loadingStatus = pendingGroups.size
        ? `Loading invoice form… (waiting on: ${[...pendingGroups].join(', ')})`
        : 'Loading invoice form…';
    };

    const load = <T>(key: string, src: Observable<T>): Observable<T | null> =>
      src.pipe(
        timeout(15000),
        tap(() => settled(key)),
        catchError((err) => {
          console.warn(`create-invoice: '${key}' failed or timed out`, err);
          settled(key);
          return of(null);
        }),
      );

    const asArray = <T>(value: readonly T[] | null | undefined): T[] =>
      Array.isArray(value) ? (value as T[]) : [];

    forkJoin({
      customers: load('customers', this.api.getCustomersFull()),
      currencies: load('currencies', this.api.getCurrencies()),
      paymentTerms: load('paymentTerms', this.api.getPaymentTerms()),
      vatTypes: load('vatTypes', this.api.getParameters(7)),
      invoiceTypes: load('invoiceTypes', this.api.getParameters(5)),
      rateTypes: load('rateTypes', this.api.getParameters(6)),
      states: load('states', this.api.getStates()),
      accountLedgers: load('accountLedgers', this.api.getAccountLedgers()),
      uoms: load('uoms', this.api.getUOMs()),
      vatCodes: load('vatCodes', this.api.getVATCodeList()),
      products: load('products', this.api.getProducts()),
      executives: load('executives', this.api.getSalesExecutives()),
      divisions: load('divisions', this.api.getBusinessDivisions()),
    }).subscribe({
      next: (data) => {
        console.log('>>> [create-invoice] forkJoin next STARTED');
        try {
          this.customers = asArray(data.customers);
          console.log('>>> [create-invoice] customers assigned');
          this.currencies = asArray(data.currencies);
          console.log('>>> [create-invoice] currencies assigned');
          const uae = this.currencies.find((c) => c.CurrencyId === 1);
          this.uaeSymbol = uae?.CurrencySymbol?.trim() || 'AED';
          this.paymentTerms = asArray(data.paymentTerms?.PaymentTermList);
          this.vatTypes = asArray(data.vatTypes?.ParameterList);
          this.invoiceTypes = asArray(data.invoiceTypes?.ParameterList);
          this.rates = asArray(data.rateTypes?.ParameterList);
          this.states = asArray(data.states?.StateList);
          this.accountLedgers = asArray(data.accountLedgers);
          this.uoms = asArray(data.uoms);
          this.vatCodes = asArray(data.vatCodes);
          this.products = asArray(data.products);
          this.salesExecutives = asArray(data.executives);
          this.divisions = asArray(data.divisions);
          console.log('>>> [create-invoice] all data assigned');

          if (id) {
            console.log('>>> [create-invoice] loading invoice for id:', id);
            this.isEdit = true;
            this.loadInvoice(id);
          } else {
            console.log('>>> [create-invoice] applying new defaults...');
            this.applyNewDefaults();
            console.log('>>> [create-invoice] defaults applied, setting loading=false');
            this.loading = false;
            this.cdr.detectChanges();
            console.log('>>> [create-invoice] loading set to false');
          }
        } catch (e) {
          console.error('>>> [create-invoice] ERROR in next handler:', e);
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('>>> [create-invoice] forkJoin ERROR:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.show('Failed to load invoice form data.', 'error');
      },
    });

    setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.cdr.detectChanges();
        this.loadingStatus = pendingGroups.size
          ? `Some form data did not load: ${[...pendingGroups].join(', ')}`
          : 'Loading invoice form…';
      }
    }, 30000);
  }

  private applyNewDefaults(): void {
    this.form.VATType = 2;
    this.form.InvoiceType = 1;
    this.form.PaymentTermId = 4;
    this.form.AccountLedgerId = 1;
    this.form.SimplifiedVATCodeId = 1;
    this.form.SimplifiedDiscountRateId = 0;
    this.form.FooterText = this.customers[0]?.TermsandConditions ?? '';
    this.invoiceDateStruct = this.toStruct(new Date());
  }

  private loadInvoice(id: number): void {
    this.api.getInvoicesList(id).subscribe({
      next: (data) => {
        const src = data?.[0];
        if (src) {
          this.loaded = true;
          this.form = { ...emptyInvoiceForm(), ...src };
          this.cancelledOnLoad = Number(src.InvoiceTotal) === 0 && Number(src.TotalVAT) === 0;
          if (!this.form.VATType && src.VTypeValue) this.form.VATType = src.VTypeValue;
          if (src.ITypeValue) this.form.InvoiceType = src.ITypeValue;
          if (src.ProductList && Array.isArray(src.ProductList)) {
            this.lines = src.ProductList.map((row: InvoiceLineItem) => this.normalizeRow(row));
          } else {
            this.lines = [emptyLineItem()];
          }
          this.invoiceDateStruct = this.toStruct(this.parseDate(this.form.InvoiceDate));
          this.deliveryDateStruct = this.toStruct(this.parseDate(this.form.DeliveryDate));
          this.paymentDateStruct = this.toStruct(this.parseDate(this.form.PaymentRecdDate));
          if (this.invoiceDateStruct) {
            this.minInvoiceDate = this.invoiceDateStruct;
            this.minDeliveryDate = this.invoiceDateStruct;
            this.minPaymentDate = this.invoiceDateStruct;
          }
          const customer = this.customers.find((c) => c.CustomerId === this.form.CustomerId);
          this.selectedCustomerName = customer?.CustomerName ?? '';
          this.applyRate();
          this.calculateTax();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.show('Failed to load invoice.', 'error');
      },
    });
  }

  private normalizeRow(row: InvoiceLineItem & { VATCodeId?: number; InvoiceVatRate?: number }): InvoiceLineItem {
    const n: InvoiceLineItem = { ...row };
    n.TAXInvoiceDetailId = Number(row.TAXInvoiceDetailId) || 0;
    n.ProductId = Number(row.ProductId) || 0;
    n.UOMId = Number(row.UOMId);
    n.Quantity = Number(row.Quantity) || 0;
    n.Rate = Number(row.Rate) || 0;
    n.VatCodeId = Number(row.VATCodeId != null ? row.VATCodeId : row.VatCodeId) || 0;
    n.VATRate = Number(row.VATRate) || Number(row.InvoiceVatRate) || 0;
    n.PreTaxAmount = Number(row.PreTaxAmount);
    n.TaxAmount = Number(row.TaxAmount);
    n.Amount = Number(row.Amount);
    n.ProductName = row.ProductName ?? '';
    n.ProductDescription = row.ProductDescription ?? '';
    n.VATCodeName = row.VATCodeName ?? '';
    const discRate = Number(row.ProductDiscountRate);
    const discAmount = Number(row.ProductDiscountAmount);
    if (discRate !== 0 && discRate !== null) {
      n.Discount = discRate;
      n.ParameterValue = 1;
    } else if (discAmount !== 0 && discAmount !== null) {
      n.Discount = discAmount;
      n.ParameterValue = 2;
    } else {
      n.Discount = 0;
      n.ParameterValue = 0;
    }
    return n;
  }

  addLine(): void {
    this.lines.push(emptyLineItem());
  }

  deleteLine(index: number): void {
    this.lines.splice(index, 1);
    this.calculateTax();
  }

  onProductChange(row: InvoiceLineItem, productId: number): void {
    row.ProductId = Number(productId);
    const product = this.products.find((p) => p.ProductId === row.ProductId);
    row.ProductName = product?.ProductName ?? '';
    if (!this.loaded && product) {
      if (product.ProductDescription != null) row.ProductDescription = (product.ProductDescription ?? '').trim();
      row.UOMId = product.UOM != null ? Number(product.UOM) : 0;
    }
    this.calculateTax();
  }

  onCustomerChange(customerId: number): void {
    const id = Number(customerId);
    this.form.CustomerId = id;
    const customer = this.customers.find((c) => c.CustomerId === id);
    if (!customer) return;
    this.selectedCustomerName = customer.CustomerName;
    if (!this.loaded) {
      this.form.BillingAddress = (customer.Address ?? '').trim();
      this.form.AttentionOf = ((customer.FirstName ?? '') + ' ' + (customer.LastName ?? '')).trim();
      this.form.CustomerVATNo = customer.VATNo ? String(customer.VATNo).trim() : '';
      this.form.CurrencyId = customer.CurrencyId;
      this.form.ConversionRate = Number(customer.ConversionRate);
      this.applyRate();
      this.form.PlaceOfSupply = customer.CountryId === 1 ? customer.StateId : 0;
      this.invoiceDateStruct = this.toStruct(new Date());
      const start = customer.InvoiceStartDate ? this.parseDate(customer.InvoiceStartDate) : null;
      this.minInvoiceDate = this.toStruct(start ?? new Date())!;
    }
    this.form.LPONumber = this.form.LPONumber ?? '';
    this.loadQuotes(id);
  }

  private loadQuotes(customerId: number): void {
    this.quoteOptions = [];
    this.quoteId = null;
    if (!customerId) return;
    this.api.getCustomerQuotes(customerId).subscribe({
      next: (data) => {
        this.quoteOptions = data ?? [];
      },
      error: () => undefined,
    });
  }

  onQuoteChange(): void {
    if (this.quoteId == null || this.quoteId === 0) return;
    this.api.getQuotesList(this.quoteId).subscribe({
      next: (data) => {
        const q = data?.[0];
        if (!q) return;
        this.loaded = true;
        this.form.FooterText = q.FooterText ?? '';
        this.form.CurrencyId = q.CurrencyId;
        this.form.CustomerVATNo = q.CustomerVATNo ?? '';
        this.form.LPONumber = q.LPONumber ?? '';
        this.form.PaymentTermId = q.PaymentTermId;
        this.form.InvoiceType = q.ITypeValue || q.InvoiceType;
        this.form.SalesExecutiveId = q.SalesExecutiveId;
        this.form.BusinessDivisionId = q.BusinessDivisionId;
        this.form.PlaceOfSupply = q.PlaceOfSupply;
        if (q.ProductList && Array.isArray(q.ProductList)) {
          this.lines = q.ProductList.map((row) =>
            this.normalizeRow(row as unknown as InvoiceLineItem),
          );
        } else {
          this.lines = [emptyLineItem()];
        }
        this.applyRate();
        this.calculateTax();
      },
      error: () => {
        this.toast.show('Failed to load quote.', 'error');
      },
    });
  }

  onCurrencyChange(): void {
    this.applyRate();
    setTimeout(() => this.calculateTax(), 0);
  }

  onUomChange(line: InvoiceLineItem, value: number): void {
    line.UOMId = Number(value);
    this.calculateTax();
  }

  onQuantityChange(line: InvoiceLineItem, value: number): void {
    line.Quantity = Number(value);
    this.calculateTax();
  }

  onRateChange(line: InvoiceLineItem, value: number): void {
    line.Rate = Number(value);
    this.calculateTax();
  }

  onDiscountChange(line: InvoiceLineItem, value: number): void {
    line.Discount = Number(value);
    this.calculateTax();
  }

  onDiscountModeChange(line: InvoiceLineItem, value: number): void {
    line.ParameterValue = Number(value);
    this.calculateTax();
  }

  onVatCodeChange(line: InvoiceLineItem, value: number): void {
    line.VatCodeId = Number(value);
    this.calculateTax();
  }

  onCurrencyPicked(value: number): void {
    this.form.CurrencyId = Number(value);
    this.onCurrencyChange();
  }

  onPaymentTermPicked(value: number): void {
    this.form.PaymentTermId = Number(value);
  }

  onQuotePicked(value: number | null): void {
    this.quoteId = value;
    this.onQuoteChange();
  }

  private applyRate(): void {
    const cur = this.currencies.find((c) => c.CurrencyId === this.form.CurrencyId);
    this.form.ConversionRate = cur ? Number(cur.ConversionRate) : null;
  }

  onInvoiceDatePicked(value: NgbDateStruct | null): void {
    this.invoiceDateStruct = value;
    this.minDeliveryDate = (value ?? this.toStruct(new Date()))!;
  }

  onDeliveryDatePicked(value: NgbDateStruct | null): void {
    this.deliveryDateStruct = value;
  }

  onPaymentDatePicked(value: NgbDateStruct | null): void {
    this.paymentDateStruct = value;
  }

  private r2(v: number): number {
    return Number(v.toFixed(2));
  }

  private calculateTax(): boolean {
    if (!this.form.VATType) return false;
    const simplified = this.isSimplified;
    const summaries: TaxSummary[] = [];

    for (const line of this.lines) {
      const qty = Number(line.Quantity);
      const rate = Number(line.Rate);
      if (!line.ProductId || qty <= 0 || !isFinite(rate)) continue;
      if (!simplified) {
        const vat = this.vatCodes.find((v) => v.VatCodeId === Number(line.VatCodeId));
        if (!vat || Number(line.VatCodeId) === 0) continue;
        line.VATRate = Number(vat.VATRate);
        line.VATCodeName = (vat.VATCodeName ?? '').trim();
      } else {
        line.VATRate = 0;
      }

      let amount = qty * rate;
      let discount = 0;
      if (line.ParameterValue === 1) {
        discount = amount * (Number(line.Discount) / 100);
        amount = amount - discount;
      } else {
        discount = Number(line.Discount) || 0;
        amount = amount - discount;
      }
      const vat = simplified ? 0 : amount * (line.VATRate / 100);
      line.PreTaxAmount = this.r2(amount);
      line.TaxAmount = this.r2(vat);
      line.Amount = this.r2(amount + vat);
      line.ProductDiscountRate = line.ParameterValue;
      line.ProductDiscountAmount = Number(line.Discount);
    }

    if (simplified) {
      const rows = this.lines.filter((l) => l.ProductId && l.Amount >= 0);
      const first = rows[0];
      if (rows.length) {
        let pre = 0;
        let tax = 0;
        let tot = 0;
        for (const l of rows) {
          pre = this.r2(pre + l.PreTaxAmount);
          tax = this.r2(tax + l.TaxAmount);
          tot = this.r2(tot + l.Amount);
        }
        summaries.push({
          VatCodeId: 0,
          VATCode: first.VATCodeName,
          VATRate: 0,
          PreTax: pre,
          Tax: tax,
          Total: tot,
        });
      }
    } else {
      for (const code of this.vatCodes) {
        const rows = this.lines.filter((l) => l.ProductId && Number(l.VatCodeId) === code.VatCodeId);
        if (!rows.length) continue;
        let pre = 0;
        let tax = 0;
        let tot = 0;
        for (const l of rows) {
          pre = this.r2(pre + l.PreTaxAmount);
          tax = this.r2(tax + l.TaxAmount);
          tot = this.r2(tot + l.Amount);
        }
        summaries.push({
          VatCodeId: code.VatCodeId,
          VATCode: rows[0].VATCodeName,
          VATRate: Number(code.VATRate),
          PreTax: pre,
          Tax: tax,
          Total: tot,
        });
      }
    }

    this.taxSummary = summaries;
    this.aggPreTax = 0;
    this.aggTax = 0;
    this.aggTotal = 0;
    this.aggDiscount = 0;

    if (simplified) {
      const vc = this.vatCodes.find((v) => v.VatCodeId === Number(this.form.SimplifiedVATCodeId));
      if (!vc) return false;
      const simplifiedTaxRate = Number(vc.VATRate) || 0;

      for (const s of summaries) {
        if (this.form.IsTaxInclusive) {
          this.aggTotal = this.r2(this.aggTotal + s.Total);
        } else {
          this.aggPreTax = this.r2(this.aggPreTax + s.Total);
        }
      }
      const rateId = Number(this.form.SimplifiedDiscountRateId);
      if (rateId !== 0) {
        if (rateId === 1) {
          this.aggDiscount = this.form.IsTaxInclusive
            ? this.r2(this.aggTotal * (Number(this.form.SimplifiedDiscount) / 100))
            : this.r2(this.aggPreTax * (Number(this.form.SimplifiedDiscount) / 100));
        } else {
          this.aggDiscount = this.r2(Number(this.form.SimplifiedDiscount));
        }
      }
      if (this.form.IsTaxInclusive) {
        this.aggPreTax = this.r2((this.aggTotal - this.aggDiscount) / (1 + simplifiedTaxRate / 100));
        this.aggTax = this.r2(this.aggPreTax * (simplifiedTaxRate / 100));
      } else {
        this.aggPreTax = this.r2(this.aggPreTax - this.aggDiscount);
        this.aggTax = this.r2(this.aggPreTax * (simplifiedTaxRate / 100));
        this.aggTotal = this.r2(this.aggPreTax + this.aggTax);
      }
    } else {
      for (const s of summaries) {
        this.aggPreTax = this.r2(this.aggPreTax + s.PreTax);
        this.aggTax = this.r2(this.aggTax + s.Tax);
        this.aggTotal = this.r2(this.aggTotal + s.Total);
      }
    }

    const rate = Number(this.form.ConversionRate) || 0;
    this.aggPreTaxUAE = this.r2(this.aggPreTax * rate);
    this.aggTaxUAE = this.r2(this.aggTax * rate);
    this.aggTotalUAE = this.r2(this.aggTotal * rate);
    this.aggDiscountUAE = this.r2(this.aggDiscount * rate);

    this.form.PreTaxTotal = this.aggPreTax;
    this.form.TotalVAT = this.aggTax;
    this.form.InvoiceTotal = this.aggTotal;
    this.form.PreTaxStdTotal = summaries.find((s) => s.VatCodeId === 1)?.PreTax ?? 0;
    this.form.PreTaxZeroTotal = summaries.find((s) => s.VatCodeId === 2)?.PreTax ?? 0;
    this.form.PreTaxExemptTotal = summaries.find((s) => s.VatCodeId === 3)?.PreTax ?? 0;

    return true;
  }

  private validate(): boolean {
    let isValid = true;

    const require = (ok: boolean, message: string): void => {
      if (!ok) {
        this.toast.show(message, 'error');
        isValid = false;
      }
    };

    require(!!this.form.CustomerId, 'Please select a customer.');
    require(this.invoiceDateStruct != null, 'Please select the invoice date.');
    require(!!this.form.CurrencyId, 'Please select a currency.');
    require(!!this.form.PaymentTermId, 'Please select a payment term.');
    require(!!this.form.InvoiceType, 'Please select an invoice type.');
    require(!!this.form.SalesExecutiveId, 'Please select a sales executive.');
    require(!!this.form.BusinessDivisionId, 'Please select a division.');
    require(!!this.form.VATType, 'Please select a VAT type.');
    require(!!this.form.AccountLedgerId, 'Please select the sales account.');
    require(this.states.length === 0 || !!(this.form.PlaceOfSupply && this.form.PlaceOfSupply !== 0), 'Please select the place of supply.');
    require(this.lines.length > 0, 'Please add products for the invoice.');
    require(this.lines.every((l) => l.ProductId !== 0), 'Every line must have a product selected, or remove empty rows.');
    require(
      this.lines.every((l) => Number(l.Quantity) > 0 && Number(l.Rate) >= 0),
      'Every line needs a quantity.',
    );
    require(
      !this.form.IsTaxInclusive && this.form.VATType === 2
        ? this.lines.every((l) => Number(l.VatCodeId) !== 0)
        : true,
      'Every line needs a VAT code.',
    );
    require(!!this.form.FooterText?.trim(), 'Please fill the terms & conditions.');

    if (!isValid) return false;
    return this.calculateTax();
  }

  save(): void {
    if (!this.validate()) return;
    this.submit(false);
  }

  cancelInvoice(): void {
    if (!this.validate()) return;
    this.applyCancelZeroing();
    this.submit(true);
  }

  private applyCancelZeroing(): void {    for (const line of this.lines) {
      line.Amount = 0;
      line.Discount = 0;
      line.PreTaxAmount = 0;
      line.TaxAmount = 0;
      line.ProductDiscountRate = 0;
      line.ProductDiscountAmount = 0;
    }
    this.form.DiscountAmount = 0;
    this.form.InvoiceDiscountRate = 0;
    this.form.InvoiceTotal = 0;
    this.form.PreTaxExemptTotal = 0;
    this.form.PreTaxStdTotal = 0;
    this.form.PreTaxZeroTotal = 0;
    this.form.PreTaxTotal = 0;
    this.form.SimplifiedDiscount = 0;
    this.form.SimplifiedDiscountRateId = 0;
    this.form.SimplifiedVATCodeId = 0;
    this.form.TotalVAT = 0;
    this.aggPreTax = 0;
    this.aggTax = 0;
    this.aggTotal = 0;
    this.aggDiscount = 0;
    this.aggPreTaxUAE = 0;
    this.aggTaxUAE = 0;
    this.aggTotalUAE = 0;
    this.aggDiscountUAE = 0;
  }

  openCopyModal(): void {
    this.modalService.open(this.copyModal, { centered: true, size: 'sm' });
  }

  copyInvoice(): void {
    if (!this.isEdit || this.isCancelled) return;
    this.isCopy = true;

    this.form.TaxInvoiceId = null;
    this.form.InvoiceNumber = '';
    this.form.InvoiceDate = null;
    this.form.InvoiceDateString = null;
    this.form.DeliveryDate = null;
    this.form.DeliveryDateString = null;
    this.form.PaymentRecdDate = null;
    this.form.PaymentRecdDateString = null;

    for (const line of this.lines) {
      line.TAXInvoiceDetailId = 0;
      line.TaxInvoiceId = null;
    }

    this.invoiceDateStruct = null;
    this.deliveryDateStruct = null;
    this.paymentDateStruct = null;

    setTimeout(() => this.cdr.detectChanges(), 0);

    this.toast.show('Invoice copied. Review and save as a new invoice.', 'success');
  }

  private submit(cancel: boolean): void {
    this.buildDateStrings();
    this.form.CreatedBy = 1;
    this.form.ProductList = this.lines;
    this.saving = true;
    this.api.addUpdateInvoice({ ...this.form }).subscribe({
      next: (res) => {
        this.saving = false;
        const type = res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        setTimeout(() => this.router.navigate(['invoicelist']), 1500);
      },
      error: () => {
        this.saving = false;
        this.toast.show('Some error occurred while saving the invoice.', 'error');
      },
    });
  }

  private buildDateStrings(): void {
    const inv = this.structToDate(this.invoiceDateStruct);
    this.form.InvoiceDate = inv ? inv.toISOString() : null;
    this.form.InvoiceDateString = inv ? this.dateLabel(inv) : null;
    const del = this.structToDate(this.deliveryDateStruct);
    this.form.DeliveryDate = del ? del.toISOString() : null;
    this.form.DeliveryDateString = del ? this.dateLabel(del) : null;
    const pay = this.structToDate(this.paymentDateStruct);
    this.form.PaymentRecdDate = pay ? pay.toISOString() : null;
    this.form.PaymentRecdDateString = pay ? this.dateLabel(pay) : null;
  }

  printInvoice(): void {
    if (!this.form.TaxInvoiceId) return;
    this.api.generateInvoice(this.form.TaxInvoiceId).subscribe({
      next: (fileName) => {
        if (fileName) {
          const baseUrl = this.config.fileBaseUrl;
          window.open(`${baseUrl}/Documents/Invoice/${fileName}`, '_blank');
        }
      },
      error: () => undefined,
    });
  }

  backToList(): void {
    this.router.navigate(['invoicelist']);
  }

  private dateLabel(d: Date): string {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private toStruct(d: Date | null): NgbDateStruct | null {
    if (!d) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  private structToDate(s: NgbDateStruct | null): Date | null {
    if (!s) return null;
    return new Date(s.year, s.month - 1, s.day);
  }
}