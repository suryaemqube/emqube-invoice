import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDateStruct, NgbInputDatepicker, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { forkJoin, Observable, catchError, of, tap, timeout } from 'rxjs';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import {
  QuoteModel,
  QuoteDetailsModel,
  QuoteLineItem,
  QuoteRevisionModel,
  CustomerDetail,
  CurrencyModel,
  PaymentTermModel,
  ParameterModel,
  UOMModel,
  VATCodeModel,
  StateModel,
  ProductModel,
  SalesExecutive,
  BusinessDivision,
  emptyQuote,
  emptyQuoteLine,
} from '../../../invoices/models/invoice.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'app-create-quote',
  imports: [DecimalPipe, DatePipe, FormsModule, NgbInputDatepicker, EditorComponent],
  templateUrl: './create-quote.html',
  styleUrl: './create-quote.scss',
})
export class CreateQuote implements OnInit {
  private api = inject(InvoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(NgbModal);
  private config = inject(ConfigService);

  form: QuoteModel = emptyQuote();
  lines: QuoteLineItem[] = [];

  @ViewChild('copyModal') copyModal!: TemplateRef<unknown>;

  customers: CustomerDetail[] = [];
  currencies: CurrencyModel[] = [];
  paymentTerms: PaymentTermModel[] = [];
  invoiceTypes: ParameterModel[] = [];
  rates: ParameterModel[] = [];
  states: StateModel[] = [];
  uoms: UOMModel[] = [];
  vatCodes: VATCodeModel[] = [];
  products: ProductModel[] = [];
  salesExecutives: SalesExecutive[] = [];
  divisions: BusinessDivision[] = [];
  revisions: QuoteRevisionModel[] = [];

  vatCodeId = 1;
  discountValue = 0;
  discountMode = 0;

  uaeSymbol = 'AED';
  selectedCustomerName = 'Select Customer';

  isEdit = false;
  isCopy = false;
  loaded = false;
  loading = true;
  saving = false;
  loadingStatus = 'Loading quote form…';

  quoteDateStruct: NgbDateStruct | null = null;

  minQuoteDate: NgbDateStruct = this.toStruct(new Date(2017, 5, 10))!;
  maxQuoteDate: NgbDateStruct = this.toStruct(new Date())!;

  aggPreTax = 0;
  aggTax = 0;
  aggTotal = 0;
  aggDiscount = 0;
  aggPreTaxUAE = 0;
  aggTaxUAE = 0;
  aggTotalUAE = 0;
  aggDiscountUAE = 0;

  get typeLabel(): string {
    return this.form.QuoteType === 2 ? 'Proforma' : 'Quote';
  }

  get quoteRevisionNumber(): string {
    return `${this.form.QuoteNumber ?? ''}${this.form.QuoteRevNumber ?? ''}`.trim();
  }

  get quoteTypeDisabled(): boolean {
    return !!this.form.QuoteId && !this.isCopy;
  }

  get showForeign(): boolean {
    return !!this.form.CurrencyId && this.form.CurrencyId !== 1;
  }

  get currencySymbol(): string {
    const cur = this.currencies.find((c) => c.CurrencyId === this.form.CurrencyId);
    return cur?.CurrencySymbol?.trim() ?? '';
  }

  get quoteDateLabel(): string {
    const d = this.quoteDateStruct;
    if (!d) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.day).padStart(2, '0');
    return `${day} ${months[d.month - 1] ?? ''} ${d.year}`;
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
    const copyParam = this.route.snapshot.queryParamMap.get('copy');
    if (copyParam === '1') this.isCopy = true;

    const keys = [
      'customers',
      'currencies',
      'paymentTerms',
      'invoiceTypes',
      'rateTypes',
      'states',
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
        ? `Loading quote form… (waiting on: ${[...pendingGroups].join(', ')})`
        : 'Loading quote form…';
    };

    const load = <T>(key: string, src: Observable<T>): Observable<T | null> =>
      src.pipe(
        timeout(15000),
        tap(() => settled(key)),
        catchError((err) => {
          console.warn(`create-quote: '${key}' failed or timed out`, err);
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
      invoiceTypes: load('invoiceTypes', this.api.getParameters(5)),
      rateTypes: load('rateTypes', this.api.getParameters(6)),
      states: load('states', this.api.getStates()),
      uoms: load('uoms', this.api.getUOMs()),
      vatCodes: load('vatCodes', this.api.getVATCodeList()),
      products: load('products', this.api.getProducts()),
      executives: load('executives', this.api.getSalesExecutives()),
      divisions: load('divisions', this.api.getBusinessDivisions()),
    }).subscribe({
      next: (data) => {
        try {
          this.customers = asArray(data.customers);
          this.currencies = asArray(data.currencies);
          const uae = this.currencies.find((c) => c.CurrencyId === 1);
          this.uaeSymbol = uae?.CurrencySymbol?.trim() || 'AED';
          this.paymentTerms = asArray(data.paymentTerms?.PaymentTermList);
          this.invoiceTypes = asArray(data.invoiceTypes?.ParameterList);
          this.rates = asArray(data.rateTypes?.ParameterList);
          this.states = asArray(data.states?.StateList);
          this.uoms = asArray(data.uoms);
          this.vatCodes = asArray(data.vatCodes);
          this.products = asArray(data.products);
          this.salesExecutives = asArray(data.executives);
          this.divisions = asArray(data.divisions);

          if (id) {
            this.isEdit = true;
            this.loadQuote(id);
          } else {
            this.applyNewDefaults();
            this.loading = false;
            this.cdr.detectChanges();
          }
        } catch (e) {
          console.error('create-quote: ERROR in forkJoin next handler:', e);
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('create-quote: forkJoin ERROR:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.show('Failed to load quote form data.', 'error');
      },
    });

    setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.cdr.detectChanges();
        this.loadingStatus = pendingGroups.size
          ? `Some form data did not load: ${[...pendingGroups].join(', ')}`
          : 'Loading quote form…';
      }
    }, 30000);
  }

  private applyNewDefaults(): void {
    this.form.QuoteType = 1;
    this.form.InvoiceType = 1;
    this.form.PaymentTermId = 4;
    this.form.AccountLedgerId = 1;
    this.form.SimplifiedVATCodeId = 1;
    this.form.SimplifiedDiscountRateId = 0;
    this.form.FooterText = this.customers[0]?.TermsandConditions ?? '';
    this.form.showtotal = true;
    this.vatCodeId = 1;
    this.discountValue = 0;
    this.discountMode = 0;
    this.lines = [emptyQuoteLine()];
    this.quoteDateStruct = this.toStruct(new Date());
  }

  private loadQuote(id: number): void {
    this.loadRevisions(id);
    this.api.getQuotesList(id).subscribe({
      next: (data) => {
        const src = data?.[0];
        if (src) {
          this.loaded = true;
          this.form = { ...emptyQuote(), ...src };
          if (!this.form.VATType && src.VTypeValue) this.form.VATType = src.VTypeValue;
          if (!this.form.InvoiceType && src.ITypeValue) this.form.InvoiceType = src.ITypeValue;
          if (src.ProductList && Array.isArray(src.ProductList) && src.ProductList.length) {
            this.lines = src.ProductList.map((row) => this.normalizeRow(row));
          } else {
            this.lines = [emptyQuoteLine()];
          }
          this.vatCodeId = this.lines[0]?.VatCodeId ?? 1;
          if (Number(src.DiscountRate)) {
            this.discountValue = Number(src.DiscountRate);
            this.discountMode = 1;
          } else if (Number(src.DiscountAmount)) {
            this.discountValue = Number(src.DiscountAmount);
            this.discountMode = 2;
          } else {
            this.discountValue = 0;
            this.discountMode = 0;
          }
          this.quoteDateStruct = this.toStruct(this.parseDate(src.QuoteDate));
          if (this.quoteDateStruct) this.minQuoteDate = this.quoteDateStruct;
          const customer = this.customers.find((c) => c.CustomerId === this.form.CustomerId);
          this.selectedCustomerName = customer?.CustomerName ?? '';
          this.applyRate();
          this.calculateTax();
          if (this.isCopy) this.applyCopyReset();
        } else {
          this.form = emptyQuote();
          this.lines = [emptyQuoteLine()];
          this.applyNewDefaults();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.show('Failed to load quote.', 'error');
      },
    });
  }

  private loadRevisions(taxInvoiceId: number): void {
    this.api.getQuoteRevisions(taxInvoiceId).subscribe({
      next: (data) => {
        this.revisions = data ?? [];
      },
      error: () => {
        this.revisions = [];
      },
    });
  }

  private normalizeRow(row: QuoteDetailsModel): QuoteLineItem {
    return {
      QuoteId: row.QuoteId ?? null,
      QuoteDetailId: row.QuoteDetailId ?? null,
      ProductId: Number(row.ProductId) || 0,
      ProductName: row.ProductName ?? '',
      ProductDescription: row.ProductDescription ?? '',
      UOMId: Number(row.UOMId) || 0,
      Quantity: Number(row.Quantity) || 0,
      Rate: Number(row.Rate) || 0,
      VatCodeId: Number(row.VATCodeId ?? 0) || 0,
      VATCodeName: row.VATCodeName ?? '',
      VATRate: Number(row.VATRate) || 0,
      PreTaxAmount: 0,
      TaxAmount: 0,
      Amount: Number(row.Amount) || 0,
    };
  }

  private applyCopyReset(): void {
    this.isCopy = true;
    this.form.QuoteId = null;
    this.form.QuoteNumber = '';
    this.form.QuoteRevNumber = '';
    for (const line of this.lines) {
      line.QuoteId = null;
      line.QuoteDetailId = null;
    }
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
      this.quoteDateStruct = this.toStruct(new Date());
      const start = customer.InvoiceStartDate ? this.parseDate(customer.InvoiceStartDate) : null;
      this.minQuoteDate = this.toStruct(start ?? new Date())!;
    }
  }

  onQuoteDatePicked(value: NgbDateStruct | null): void {
    this.quoteDateStruct = value;
  }

  onCurrencyPicked(value: number): void {
    this.form.CurrencyId = Number(value);
    this.applyRate();
    setTimeout(() => this.calculateTax(), 0);
  }

  private applyRate(): void {
    const cur = this.currencies.find((c) => c.CurrencyId === this.form.CurrencyId);
    this.form.ConversionRate = cur ? Number(cur.ConversionRate) : null;
  }

  onVatCodeChange(value: number): void {
    this.vatCodeId = Number(value);
    this.calculateTax();
  }

  onDiscountChange(value: number): void {
    this.discountValue = Number(value);
    this.calculateTax();
  }

  onDiscountModeChange(value: number): void {
    this.discountMode = Number(value);
    this.calculateTax();
  }

  addLine(): void {
    this.lines.push(emptyQuoteLine());
  }

  deleteLine(index: number): void {
    this.lines.splice(index, 1);
    this.calculateTax();
  }

  onProductChange(line: QuoteLineItem, productId: number): void {
    line.ProductId = Number(productId);
    const product = this.products.find((p) => p.ProductId === line.ProductId);
    line.ProductName = product?.ProductName ?? '';
    if (!this.loaded && product) {
      if (product.ProductDescription != null) line.ProductDescription = (product.ProductDescription ?? '').trim();
      line.UOMId = product.UOM != null ? Number(product.UOM) : 0;
    }
    this.calculateTax();
  }

  onUomChange(line: QuoteLineItem, value: number): void {
    line.UOMId = Number(value);
    this.calculateTax();
  }

  onQuantityChange(line: QuoteLineItem, value: number): void {
    line.Quantity = Number(value);
    this.calculateTax();
  }

  onRateChange(line: QuoteLineItem, value: number): void {
    line.Rate = Number(value);
    this.calculateTax();
  }

  private r2(v: number): number {
    return Number(v.toFixed(2));
  }

  private calculateTax(): boolean {
    const vat = this.vatCodes.find((v) => v.VatCodeId === Number(this.vatCodeId));
    const vatRate = vat ? Number(vat.VATRate) : 0;
    const vatName = vat?.VATCodeName?.trim() ?? '';

    for (const line of this.lines) {
      line.VatCodeId = Number(this.vatCodeId);
      line.VATRate = vatRate;
      line.VATCodeName = vatName;
      const qty = Number(line.Quantity);
      const rate = Number(line.Rate);
      const amount = qty * rate;
      if (!line.ProductId || qty <= 0 || !isFinite(rate)) {
        line.PreTaxAmount = 0;
        line.TaxAmount = 0;
        line.Amount = 0;
        continue;
      }
      line.PreTaxAmount = this.r2(amount);
      line.TaxAmount = this.r2(amount * (vatRate / 100));
      line.Amount = this.r2(amount + amount * (vatRate / 100));
    }

    let sum = 0;
    for (const line of this.lines) {
      if (Number(line.ProductId)) sum += Number(line.PreTaxAmount) || 0;
    }

    let discount = 0;
    if (this.discountMode === 1) {
      discount = sum * (Number(this.discountValue) / 100);
    } else if (this.discountMode === 2) {
      discount = Number(this.discountValue) || 0;
    }

    const aggPreTax = this.r2(sum - discount);
    const aggTax = this.r2(aggPreTax * (vatRate / 100));
    const aggTotal = this.r2(aggPreTax + aggTax);

    this.aggPreTax = aggPreTax;
    this.aggTax = aggTax;
    this.aggTotal = aggTotal;
    this.aggDiscount = this.r2(discount);

    const rate = Number(this.form.ConversionRate) || 0;
    this.aggPreTaxUAE = this.r2(aggPreTax * rate);
    this.aggTaxUAE = this.r2(aggTax * rate);
    this.aggTotalUAE = this.r2(aggTotal * rate);
    this.aggDiscountUAE = this.r2(discount * rate);

    this.form.PreTaxTotal = aggPreTax;
    this.form.TotalVAT = aggTax;
    this.form.InvoiceTotal = aggTotal;

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
    require(this.quoteDateStruct != null, 'Please select the quote date.');
    require(!!this.form.CurrencyId, 'Please select a currency.');
    require(!!this.form.PaymentTermId, 'Please select a payment term.');
    require(!!this.form.InvoiceType, 'Please select a quote/proforma type.');
    require(!!this.form.SalesExecutiveId, 'Please select a sales executive.');
    require(!!this.form.BusinessDivisionId, 'Please select a division.');
    require(this.states.length === 0 || !!(this.form.PlaceOfSupply && this.form.PlaceOfSupply !== 0), 'Please select the place of supply.');
    require(!!this.vatCodeId, 'Please select a VAT code.');
    require(this.lines.length > 0, 'Please add products for the quote.');
    require(this.lines.every((l) => l.ProductId !== 0), 'Every line must have a product selected, or remove empty rows.');
    require(this.lines.every((l) => Number(l.Quantity) > 0), 'Every line needs a quantity.');
    require(!!this.form.FooterText?.trim(), 'Please fill the terms & conditions.');

    if (!isValid) return false;
    return this.calculateTax();
  }

  save(): void {
    if (!this.validate()) return;
    this.buildDateStrings();
    this.form.CreatedBy = 1;
    this.form.VATType = 2;
    if (this.discountMode === 1) {
      this.form.DiscountRate = this.discountValue;
      this.form.DiscountAmount = null;
    } else if (this.discountMode === 2) {
      this.form.DiscountRate = null;
      this.form.DiscountAmount = this.discountValue;
    } else {
      this.form.DiscountRate = null;
      this.form.DiscountAmount = null;
    }
    this.form.ProductList = this.lines.map((l) => this.toDetail(l));
    this.saving = true;
    this.api.addUpdateQuote({ ...this.form }).subscribe({
      next: (res) => {
        this.saving = false;
        const type = res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        setTimeout(() => this.router.navigate(['quotelist']), 1500);
      },
      error: () => {
        this.saving = false;
        this.toast.show('Some error occurred while saving the quote.', 'error');
      },
    });
  }

  private toDetail(l: QuoteLineItem): QuoteDetailsModel {
    return {
      QuoteId: l.QuoteId,
      QuoteDetailId: l.QuoteDetailId,
      ProductId: l.ProductId,
      ProductName: l.ProductName,
      ProductDescription: l.ProductDescription,
      UOMId: l.UOMId,
      Quantity: l.Quantity,
      Rate: l.Rate,
      VATCodeId: l.VatCodeId,
      VATRate: l.VATRate,
      VATCodeName: l.VATCodeName,
      Amount: l.Amount,
      ProductDiscountRate: 0,
      ProductDiscountAmount: 0,
    };
  }

  private buildDateStrings(): void {
    const qd = this.structToDate(this.quoteDateStruct);
    this.form.QuoteDate = qd ? qd.toISOString() : null;
    this.form.QuoteDateString = qd ? this.dateLabel(qd) : null;
  }

  openCopyModal(): void {
    this.modalService.open(this.copyModal, { centered: true, size: 'sm' });
  }

  copyQuote(): void {
    if (!this.isEdit) return;
    this.applyCopyReset();
    setTimeout(() => this.cdr.detectChanges(), 0);
    this.toast.show('Quote copied. Review and save as a new quote.', 'success');
  }

  printQuote(): void {
    if (!this.form.QuoteId) return;
    this.api.generateQuote(this.form.QuoteId).subscribe({
      next: (fileName) => {
        if (fileName) {
          window.open(`${this.config.fileBaseUrl}/Documents/Quote/${fileName}`, '_blank');
        }
      },
      error: () => undefined,
    });
  }

  printRevision(rev: QuoteRevisionModel): void {
    this.api.generateQuote(rev.QuoteId).subscribe({
      next: (fileName) => {
        if (fileName) {
          window.open(`${this.config.fileBaseUrl}/Documents/Quote/${fileName}`, '_blank');
        }
      },
      error: () => undefined,
    });
  }

  backToList(): void {
    this.router.navigate(['quotelist']);
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