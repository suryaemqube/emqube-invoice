import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { QuoteListModel } from '../../../invoices/models/invoice.model';
import { EqTable, EqColumn } from '../../../../shared/components/eq-table/eq-table';
import { EqPaginator } from '../../../../shared/components/eq-paginator/eq-paginator';
import { EqToolbar } from '../../../../shared/components/eq-toolbar/eq-toolbar';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfigService } from '../../../../core/services/config.service';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
const STORAGE_KEY = 'QuoteFilters';

@Component({
  selector: 'app-quote-list',
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    EqTable,
    EqPaginator,
    EqToolbar,
    RouterLink,
    EqBadge,
  ],
  templateUrl: './quote-list.html',
  styleUrl: './quote-list.scss',
})
export class QuoteList implements OnInit {
  private api = inject(InvoiceService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private config = inject(ConfigService);

  allQuotes = signal<QuoteListModel[]>([]);
  yearList = signal<number[]>([]);

  filterQuery = signal('');
  filterYear = signal(0);
  filterDivision = signal('');
  filterCustomer = signal('');
  filterType = signal('');
  filtersOpen = signal(false);

  divisionOptions = computed(() =>
    [...new Set(this.allQuotes().map((r) => r.DivisionName).filter(Boolean))].sort(),
  );
  customerOptions = computed(() =>
    [...new Set(this.allQuotes().map((r) => r.CustomerName).filter(Boolean))].sort(),
  );
  typeOptions = computed(() =>
    [...new Set(this.allQuotes().map((r) => r.QuotetypeText).filter(Boolean))].sort(),
  );

  page = signal(1);
  pageSize = signal(25);

  loading = signal(true);

  columns: EqColumn[] = [
    { key: 'QuoteNumber', header: 'Quote / Proforma', cssClass: 'col-no mono' },
    { key: 'type', header: 'Type', cssClass: 'col-status' },
    { key: 'QuoteDateString', header: 'Date', cssClass: 'col-date' },
    { key: 'CustomerName', header: 'Customer / Products', cssClass: 'col-customer name' },
    { key: 'preTax', header: 'Pre-Tax', align: 'right', cssClass: 'col-money num' },
    { key: 'TotalVAT', header: 'VAT', align: 'right', cssClass: 'col-money num' },
    { key: 'InvoiceTotal', header: 'Total', align: 'right', cssClass: 'col-total num' },
    { key: 'SExecutiveName', header: 'Sales Exec.', cssClass: 'col-exec' },
    { key: 'actions', header: '', align: 'right', cssClass: 'col-actions' },
  ];

  filteredList = computed(() => {
    let list = this.allQuotes();
    const q = this.filterQuery().toLowerCase().trim();

    list = list.filter((row) => {
      const yearMatch =
        !this.filterYear() || row.QuoteDateString.toLowerCase().indexOf(String(this.filterYear())) > -1;
      const divisionMatch = !this.filterDivision() || row.DivisionName === this.filterDivision();
      const customerMatch = !this.filterCustomer() || row.CustomerName === this.filterCustomer();
      const typeMatch = !this.filterType() || row.QuotetypeText === this.filterType();
      return yearMatch && divisionMatch && customerMatch && typeMatch;
    });

    if (q) {
      list = list.filter((row) =>
        [
          row.QuoteNumber,
          row.CustomerName,
          row.DivisionName,
          row.SExecutiveName,
          row.ProductName,
          row.QuoteDateString,
          row.QuotetypeText,
          String(row.InvoiceTotal ?? ''),
          String(row.TotalVAT ?? ''),
        ].some((field) => field.toLowerCase().indexOf(q) > -1),
      );
    }

    return list;
  });

  pageSlice = computed(() => {
    const list = this.filteredList();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadFilters();
    this.loading.set(true);
    forkJoin({
      quotes: this.api.getQuoteList(),
      years: this.api.getInvoiceYears(),
    }).subscribe({
      next: (data) => {
        this.allQuotes.set(data.quotes ?? []);
        this.yearList.set(data.years ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

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
    if (this.filterType()) n++;
    if (this.filterDivision()) n++;
    if (this.filterCustomer()) n++;
    return n;
  }

  activeFilters(): { key: string; label: string; value: string }[] {
    const chips: { key: string; label: string; value: string }[] = [];
    if (this.filterYear() !== 0) chips.push({ key: 'year', label: 'Year', value: String(this.filterYear()) });
    if (this.filterType()) chips.push({ key: 'type', label: 'Type', value: this.filterType() });
    if (this.filterDivision()) chips.push({ key: 'division', label: 'Division', value: this.filterDivision() });
    if (this.filterCustomer()) chips.push({ key: 'customer', label: 'Customer', value: this.filterCustomer() });
    return chips;
  }

  removeFilter(key: string): void {
    if (key === 'year') this.filterYear.set(0);
    else if (key === 'type') this.filterType.set('');
    else if (key === 'division') this.filterDivision.set('');
    else if (key === 'customer') this.filterCustomer.set('');
    this.page.set(1);
    this.saveFilters();
  }

  clearFilters(): void {
    this.filterQuery.set('');
    this.filterYear.set(0);
    this.filterDivision.set('');
    this.filterCustomer.set('');
    this.filterType.set('');
    this.page.set(1);
    this.saveFilters();
  }

  private saveFilters(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        filterYear: this.filterYear(),
        filterQuery: this.filterQuery(),
        filterDivision: this.filterDivision(),
        filterCustomer: this.filterCustomer(),
        filterType: this.filterType(),
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
        this.filterQuery.set(f.filterQuery ?? '');
        this.filterDivision.set(f.filterDivision ?? '');
        this.filterCustomer.set(f.filterCustomer ?? '');
        this.filterType.set(f.filterType ?? '');
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // parse error or unavailable — ignore
    }
  }

  editQuote(row: QuoteListModel): void {
    this.router.navigate(['/createquote', row.TaxInvoiceId]);
  }

  execName(row: QuoteListModel): string {
    const first = row.SExecutiveFirstName?.trim();
    const last = row.SExecutiveLastName?.trim();
    if (first && last) {
      return `${first} ${last.charAt(0).toUpperCase()}.`;
    }
    return row.SExecutiveName?.trim() || first || '';
  }

  preTax(row: QuoteListModel): number {
    return (row.InvoiceTotal ?? 0) - (row.TotalVAT ?? 0);
  }

  productList(row: QuoteListModel): string[] {
    return (row.ProductName ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  copyQuote(row: QuoteListModel): void {
    this.router.navigate(['/createquote', row.TaxInvoiceId], { queryParams: { copy: '1' } });
  }

  printQuote(taxInvoiceId: number): void {
    this.api.generateQuote(taxInvoiceId).subscribe({
      next: (fileName) => {
        if (fileName) {
          const baseUrl = this.config.fileBaseUrl;
          window.open(`${baseUrl}/Documents/Quote/${fileName}`, '_blank');
        }
      },
      error: () => {
        this.toast.show('Failed to generate quote PDF.', 'error');
      },
    });
  }
}