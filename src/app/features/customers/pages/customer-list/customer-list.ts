import { Component, OnInit, inject, computed, signal, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EqTable, EqColumn } from '../../../../shared/components/eq-table/eq-table';
import { EqPaginator } from '../../../../shared/components/eq-paginator/eq-paginator';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
import { EqToolbar } from '../../../../shared/components/eq-toolbar/eq-toolbar';
import { ToastService } from '../../../../shared/services/toast.service';
import { UserService } from '../../../../core/services/user.service';
import { CustomerService } from '../../services/customer.service';
import {
  CustomerListModel,
  CustomerModel,
  CountryModel,
  CurrencyModel,
  emptyCustomerModel,
} from '../../../invoices/models/invoice.model';

@Component({
  selector: 'app-customer-list',
  imports: [FormsModule, EqTable, EqPaginator, EqBadge, EqToolbar],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {
  private api = inject(CustomerService);
  private modalService = inject(NgbModal);
  private toast = inject(ToastService);
  private user = inject(UserService);

  allCustomers = signal<CustomerListModel[]>([]);
  countryList: CountryModel[] = [];
  currencyList: CurrencyModel[] = [];
  billingStates: { StateId: number; StateName: string }[] = [];
  shippingStates: { StateId: number; StateName: string }[] = [];

  filterQuery = signal('');

  page = signal(1);
  pageSize = signal(100);

  loading = signal(true);

  // modal data
  modalData: CustomerModel = emptyCustomerModel();
  shippingAddressSame = true;

  columns: EqColumn[] = [
    { key: 'CustomerName', header: 'Customer Name', cssClass: 'eq-cell-customer' },
    { key: 'ContactPerson', header: 'Contact Person' },
    { key: 'CityName', header: 'City' },
    { key: 'CountryName', header: 'Country' },
    { key: 'Status', header: 'Status' },
    { key: 'Prospect', header: 'Prospect' },
    { key: 'actions', header: '', align: 'right', width: '50px' },
  ];

  filteredList = computed(() => {
    let list = this.allCustomers();
    const q = this.filterQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((row) =>
        [row.CustomerName, `${row.FirstName} ${row.LastName}`.trim()].some((f) =>
          f.toLowerCase().indexOf(q) > -1,
        ),
      );
    }
    return list;
  });

  pageSlice = computed(() => {
    const list = this.filteredList();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  contactPerson(row: CustomerListModel): string {
    return `${row.FirstName} ${row.LastName}`.trim();
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getCustomerList().subscribe({
      next: (data) => {
        this.allCustomers.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
    this.loadMasters();
  }

  private loadMasters(): void {
    this.api.getCountries().subscribe({
      next: (res) => {
        this.countryList = res?.CountryList ?? [];
      },
      error: () => {
        this.countryList = [];
      },
    });
    this.api.getCurrencies().subscribe({
      next: (data) => {
        this.currencyList = data ?? [];
      },
      error: () => {
        this.currencyList = [];
      },
    });
  }

  onSearchChange(): void {
    this.page.set(1);
  }

  clearSearch(): void {
    this.filterQuery.set('');
    this.page.set(1);
  }

  // --- add / edit ---

  openAdd(modal: TemplateRef<unknown>): void {
    this.modalData = emptyCustomerModel();
    this.modalData.SiteUserId = this.user.profileId || null;
    this.shippingAddressSame = true;
    this.billingStates = [];
    this.shippingStates = [];
    this.modalService.open(modal, { centered: true, size: 'lg' });
  }

  openEdit(row: CustomerListModel, modal: TemplateRef<unknown>): void {
    this.api.getCustomer(row.CustomerId).subscribe({
      next: (data) => {
        this.modalData = data ?? emptyCustomerModel();
        this.modalData.BillingAddress ??= { AddressId: 0, Address: '', CityName: '', StateId: 0, CountryId: 0, Zipcode: '', IsActive: true };
        this.modalData.ShippingAddress ??= { AddressId: 0, Address: '', CityName: '', StateId: 0, CountryId: 0, Zipcode: '', IsActive: true };
        this.modalData.SiteUserId = this.user.profileId || null;
        this.shippingAddressSame = false;
        this.billingStates = [];
        this.shippingStates = [];
        if (this.modalData.BillingAddress?.CountryId) {
          this.loadBillingStates(this.modalData.BillingAddress.CountryId);
        }
        if (this.modalData.ShippingAddress?.CountryId) {
          this.loadShippingStates(this.modalData.ShippingAddress.CountryId);
        }
        this.modalService.open(modal, { centered: true, size: 'lg' });
      },
      error: () => {
        this.toast.show('Failed to load customer.', 'error');
      },
    });
  }

  onBillingCountryChange(): void {
    const cid = this.modalData.BillingAddress?.CountryId ?? 0;
    this.modalData.BillingAddress.StateId = 0;
    this.billingStates = [];
    if (cid) this.loadBillingStates(cid);
  }

  onShippingCountryChange(): void {
    const cid = this.modalData.ShippingAddress?.CountryId ?? 0;
    this.modalData.ShippingAddress.StateId = 0;
    this.shippingStates = [];
    if (cid) this.loadShippingStates(cid);
  }

  onShippingSameToggle(): void {
    if (this.shippingAddressSame) {
      this.modalData.ShippingAddress = {
        ...this.modalData.BillingAddress,
        AddressId: 0,
      };
      this.onShippingCountryChange();
    }
  }

  private loadBillingStates(countryId: number): void {
    this.api.getStates(countryId).subscribe({
      next: (res) => {
        this.billingStates = res?.StateList ?? [];
      },
      error: () => {
        this.billingStates = [];
      },
    });
  }

  private loadShippingStates(countryId: number): void {
    this.api.getStates(countryId).subscribe({
      next: (res) => {
        this.shippingStates = res?.StateList ?? [];
      },
      error: () => {
        this.shippingStates = [];
      },
    });
  }

  // --- save ---

  saveCustomer(modal: { close: () => void }): void {
    if (!this.isFormValid()) return;

    this.modalData.SiteUserId = this.user.profileId || null;
    this.modalData.CustomerTypeValue = 2;

    this.api.addUpdateCustomer(this.modalData).subscribe({
      next: (res) => {
        const type = res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        modal.close();
        if (res.MessageTypeValue === 1) {
          this.refreshList();
        }
      },
      error: () => {
        this.toast.show('An error occurred while saving the customer.', 'error');
      },
    });
  }

  isFormValid(): boolean {
    const m = this.modalData;
    const billing = m.BillingAddress ?? ({} as CustomerModel['BillingAddress']);
    const shipping = m.ShippingAddress ?? ({} as CustomerModel['ShippingAddress']);

    const require = (ok: boolean, msg: string): boolean => {
      if (!ok) {
        this.toast.show(msg, 'warning');
        return false;
      }
      return true;
    };

    if (!require(!!(m.CustomerName && m.CustomerName.trim()), 'Please enter customer name')) return false;
    if (!require(m.IsIndividual || !!(m.CustomerCode && m.CustomerCode.trim()), 'Please enter customer code')) return false;
    if (!require(!!(billing.Address && billing.Address.trim()), 'Please enter Billing Address')) return false;
    if (!require(!!billing.CountryId && billing.CountryId !== 0, 'Please enter Billing Country')) return false;
    if (!require(!!m.CurrencyId, 'Please enter Currency')) return false;
    if (!require(!!(m.FirstName && m.FirstName.trim()), 'Please enter Contact Person Name')) return false;
    if (m.VATEligible && !require(!!(m.VATNo && m.VATNo.trim()), 'Please enter VAT No')) return false;
    if (!this.shippingAddressSame && !require(!!(shipping.Address && shipping.Address.trim()), 'Please enter Shipping Address')) return false;

    return true;
  }

  private refreshList(): void {
    this.loading.set(true);
    this.api.getCustomerList().subscribe({
      next: (data) => {
        this.allCustomers.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
