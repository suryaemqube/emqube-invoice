import { Component, OnInit, inject, computed, signal, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { InvoiceService } from '../../services/invoice.service';
import {
  InvoiceListModel,
  BusinessDivision,
  SalesExecutive,
  CustomerOption,
  deriveStatus,
  KpiCard,
  PaymentModel,
} from '../../models/invoice.model';
import { EqTable, EqColumn } from '../../../../shared/components/eq-table/eq-table';
import { EqPaginator } from '../../../../shared/components/eq-paginator/eq-paginator';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
import { EqToolbar } from '../../../../shared/components/eq-toolbar/eq-toolbar';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfigService } from '../../../../core/services/config.service';

const STORAGE_KEY = 'InvoiceFilters';

@Component({
  selector: 'app-invoice-list',
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    NgbInputDatepicker,
    EqTable,
    EqPaginator,
    EqBadge,
    EqToolbar,
    RouterLink,
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceList implements OnInit {
  private api = inject(InvoiceService);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  private toast = inject(ToastService);
  private config = inject(ConfigService);

  @ViewChild('paymentModal') paymentModalRef!: TemplateRef<unknown>;

  // raw data
  allInvoices = signal<InvoiceListModel[]>([]);
  yearList = signal<number[]>([]);
  divisions = signal<BusinessDivision[]>([]);
  executives = signal<SalesExecutive[]>([]);
  customers = signal<CustomerOption[]>([]);

  // filter state
  filterQuery = signal('');
  filterYear = signal(0);
  filterStatus = signal('');
  filterDivision = signal('');
  filterCustomer = signal('');
  filtersOpen = signal(false);

  // pagination
  page = signal(1);
  pageSize = signal(25);

  // ui state
  loading = signal(true);
  currentYear = new Date().getFullYear();

  // payment modal state
  paymentRow: InvoiceListModel | null = null;
  paymentDate: NgbDateStruct | null = null;
  paymentMinDate: NgbDateStruct = this.toNgbDate(new Date());
  paymentMaxDate: NgbDateStruct = this.toNgbDate(new Date());

  columns: EqColumn[] = [
    { key: 'InvoiceNumber', header: 'Invoice', cssClass: 'col-no mono' },
    { key: 'status', header: 'Status', cssClass: 'col-status' },
    { key: 'InvoiceDateString', header: 'Date', cssClass: 'col-date' },
    { key: 'CustomerName', header: 'Customer / Products', cssClass: 'col-customer name' },
    { key: 'PreTaxTotal', header: 'Pre-Tax', align: 'right', cssClass: 'col-money num' },
    { key: 'TotalVAT', header: 'VAT', align: 'right', cssClass: 'col-money num' },
    { key: 'InvoiceTotal', header: 'Total', align: 'right', cssClass: 'col-total num' },
    { key: 'SExecutiveName', header: 'Sales Exec.', cssClass: 'col-exec' },
    { key: 'actions', header: '', align: 'right', cssClass: 'col-actions' },
  ];

  // filtered + searched list
  filteredList = computed(() => {
    let list = this.allInvoices();
    const q = this.filterQuery().toLowerCase().trim();

    list = list.filter((row) => {
      const yearMatch =
        !this.filterYear() || row.InvoiceDateString.toLowerCase().indexOf(String(this.filterYear())) > -1;
      const status = deriveStatus(row);
      const statusMatch = !this.filterStatus() || status === this.filterStatus();
      const divisionMatch = !this.filterDivision() || row.DivisionName === this.filterDivision();
      const customerMatch = !this.filterCustomer() || row.CustomerName === this.filterCustomer();
      return yearMatch && statusMatch && divisionMatch && customerMatch;
    });

    if (q) {
      list = list.filter((row) =>
        [
          row.InvoiceNumber,
          row.CustomerName,
          row.DivisionName,
          row.SExecutiveName,
          row.ProductName,
          row.InvoiceDateString,
          row.PaymentRecdDateString ?? '',
          String(row.InvoiceTotal),
          String(row.TotalVAT),
        ].some((field) => field.toLowerCase().indexOf(q) > -1),
      );
    }

    return list;
  });

  // paginated slice
  pageSlice = computed(() => {
    const list = this.filteredList();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  // KPIs
  kpis = computed<KpiCard[]>(() => {
    const list = this.allInvoices();
    const year = this.filterYear() || this.currentYear;

    let outstanding = 0;
    let dueCount = 0;
    let invoicedMonth = 0;
    let invoicedMonthCount = 0;
    let paidMonth = 0;
    let paidCount = 0;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    for (const row of list) {
      const status = deriveStatus(row);
      const invoiceD = this.parseDate(row.InvoiceDate) ?? this.parseDate(row.InvoiceDateString);
      const invoiceYear = invoiceD ? invoiceD.getFullYear() : 0;

      if (status !== 'cancelled' && !row.PaymentRecdDateString && invoiceYear === year) {
        outstanding += row.InvoiceTotal * (row.ConversionRate || 1);
        dueCount++;
      }

      if (status !== 'cancelled' && invoiceD && invoiceD.getMonth() === thisMonth && invoiceD.getFullYear() === thisYear) {
        invoicedMonth += row.InvoiceTotal;
        invoicedMonthCount++;
      }

      if (status === 'paid' && row.PaymentRecdDate) {
        const payD = this.parseDate(row.PaymentRecdDate) ?? this.parseDate(row.PaymentRecdDateString!);
        if (payD && payD.getMonth() === thisMonth && payD.getFullYear() === thisYear) {
          paidMonth += row.InvoiceTotal;
          paidCount++;
        }
      }
    }

    return [
      {
        label: `Outstanding (YR ${year})`,
        value: outstanding > 0 ? this.fmtMoney(outstanding) : '—',
        currency: 'AED',
        cssClass: 'eq-kpi-outstanding',
        badge: { text: `${dueCount} Due`, tone: 'warning' },
        note: dueCount > 0 ? 'Unpaid, receivable' : 'No outstanding invoices',
      },
      {
        label: 'Invoiced (This Month)',
        value: invoicedMonth > 0 ? this.fmtMoney(invoicedMonth) : '—',
        currency: 'AED',
        badge: { text: `${invoicedMonthCount} invoice${invoicedMonthCount === 1 ? '' : 's'}`, tone: 'info' },
        note: 'Gross value billed this month',
      },
      {
        label: 'Paid (This Month)',
        value: paidMonth > 0 ? this.fmtMoney(paidMonth) : '—',
        currency: 'AED',
        badge: { text: `${paidCount} paid`, tone: 'success' },
        note: 'Payments recorded this month',
      },
      {
        label: 'Open / Unpaid',
        value: String(dueCount),
        valueIsCount: true,
        cssClass: 'eq-kpi-due',
        badge: { text: 'invoices', tone: 'neutral' },
        note: `Unpaid for year ${year}`,
      },
    ];
  });

  private fmtMoney(n: number): string {
    return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  ngOnInit(): void {
    this.loadFilters();
    this.loading.set(true);
    forkJoin({
      invoices: this.api.getInvoiceList(),
      years: this.api.getInvoiceYears(),
      divisions: this.api.getBusinessDivisions(),
      executives: this.api.getSalesExecutives(),
      customers: this.api.getCustomers(),
    }).subscribe({
      next: (data) => {
        this.allInvoices.set(data.invoices ?? []);
        this.yearList.set(data.years ?? []);
        this.divisions.set(data.divisions ?? []);
        this.executives.set(data.executives ?? []);
        this.customers.set(data.customers ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // --- toolbar handlers ---

  onSearchChange(): void {
    this.page.set(1);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.saveFilters();
  }

  toggleFilters(): void {
    this.filtersOpen.set(!this.filtersOpen());
  }

  activeFacetCount(): number {
    let n = 0;
    if (this.filterYear() !== 0) n++;
    if (this.filterStatus()) n++;
    if (this.filterDivision()) n++;
    if (this.filterCustomer()) n++;
    return n;
  }

  activeFilters(): { key: string; label: string; value: string }[] {
    const chips: { key: string; label: string; value: string }[] = [];
    if (this.filterYear() !== 0) chips.push({ key: 'year', label: 'Year', value: String(this.filterYear()) });
    if (this.filterStatus()) chips.push({ key: 'status', label: 'Status', value: this.filterStatus() });
    if (this.filterDivision()) chips.push({ key: 'division', label: 'Division', value: this.filterDivision() });
    if (this.filterCustomer()) chips.push({ key: 'customer', label: 'Customer', value: this.filterCustomer() });
    return chips;
  }

  removeFilter(key: string): void {
    if (key === 'year') this.filterYear.set(0);
    else if (key === 'status') this.filterStatus.set('');
    else if (key === 'division') this.filterDivision.set('');
    else if (key === 'customer') this.filterCustomer.set('');
    this.page.set(1);
    this.saveFilters();
  }

  clearFilters(): void {
    this.filterQuery.set('');
    this.filterYear.set(0);
    this.filterStatus.set('');
    this.filterDivision.set('');
    this.filterCustomer.set('');
    this.page.set(1);
    this.saveFilters();
  }

  // --- filter persistence ---

  private saveFilters(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        filterYear: this.filterYear(),
        filterStatus: this.filterStatus(),
        filterDivision: this.filterDivision(),
        filterCustomer: this.filterCustomer(),
      }));
    } catch {
      // localStorage unavailable — ignore
    }
  }

  private loadFilters(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const f = JSON.parse(raw);
        this.filterYear.set(f.filterYear ?? 0);
        this.filterStatus.set(f.filterStatus ?? '');
        this.filterDivision.set(f.filterDivision ?? '');
        this.filterCustomer.set(f.filterCustomer ?? '');
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // parse error or unavailable — ignore
    }
  }

  // --- row actions ---

  editInvoice(row: InvoiceListModel): void {
    this.router.navigate(['/createinvoice', row.TaxInvoiceId], {
      queryParams: { editable: row.IsEditable === 1 ? 1 : 0 },
    });
  }

  recordPayment(row: InvoiceListModel): void {
    this.openPaymentModal(row);
  }

  print(row: InvoiceListModel): void {
    this.printInvoice(row.TaxInvoiceId);
  }

  showRecordPayment(row: InvoiceListModel): boolean {
    const isCancelled = row.InvoiceTotal === 0 && row.TotalVAT === 0;
    const isPaid = !!row.PaymentRecdDateString;
    return !isCancelled && !isPaid;
  }

  showPrint(row: InvoiceListModel): boolean {
    return !(row.InvoiceTotal === 0 && row.TotalVAT === 0);
  }

  // --- payment modal ---

  private openPaymentModal(row: InvoiceListModel): void {
    this.paymentRow = row;
    this.paymentMinDate = this.toNgbDate(this.parseDate(row.InvoiceDate) ?? new Date());
    this.paymentMaxDate = this.toNgbDate(new Date());
    this.paymentDate = this.toNgbDate(new Date());
    this.modalService.open(this.paymentModalRef, { centered: true, size: 'sm' });
  }

  savePayment(modal: { close: () => void }): void {
    if (!this.paymentRow || !this.paymentDate) return;

    const jsDate = new Date(this.paymentDate.year, this.paymentDate.month - 1, this.paymentDate.day);
    const dateString = `${jsDate.getDate()}/${jsDate.getMonth() + 1}/${jsDate.getFullYear()}`;

    const model: PaymentModel = {
      TaxInvoiceId: this.paymentRow.TaxInvoiceId,
      PaymentRecdDate: jsDate.toISOString(),
      PaymentRecdDateString: dateString,
    };

    this.api.addPayment(model).subscribe({
      next: (res) => {
        const type = res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        modal.close();
        this.refreshList();
      },
      error: () => {
        this.toast.show('An error occurred while recording payment.', 'error');
      },
    });
  }

  // --- print ---

  private printInvoice(taxInvoiceId: number): void {
    this.api.generateInvoice(taxInvoiceId).subscribe({
      next: (fileName) => {
        if (fileName) {
          const baseUrl = this.config.fileBaseUrl;
          window.open(`${baseUrl}/Documents/Invoice/${fileName}`, '_blank');
        }
      },
      error: () => {
        this.toast.show('Failed to generate invoice PDF.', 'error');
      },
    });
  }

  // --- helpers ---

  status(row: InvoiceListModel): string {
    return deriveStatus(row);
  }

  execName(row: InvoiceListModel): string {
    const first = row.SExecutiveFirstName?.trim();
    const last = row.SExecutiveLastName?.trim();
    if (first && last) {
      return `${first} ${last.charAt(0).toUpperCase()}.`;
    }
    return row.SExecutiveName?.trim() || first || '';
  }

  productList(row: InvoiceListModel): string[] {
    return (row.ProductName ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  divisionIcon(name: string): string {
    if (name === 'Web') return 'icon-globe';
    if (name === 'Software') return 'icon-layers';
    return '';
  }

  divisionIconClass(name: string): string {
    if (name === 'Web') return 'eq-icon-division eq-icon-division-web';
    if (name === 'Software') return 'eq-icon-division eq-icon-division-software';
    return '';
  }

  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  private toNgbDate(d: Date): NgbDateStruct {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  private refreshList(): void {
    this.loading.set(true);
    this.api.getInvoiceList().subscribe({
      next: (data) => {
        this.allInvoices.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}