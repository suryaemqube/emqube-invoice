import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api';
import {
  CustomerListModel,
  CustomerModel,
  CurrencyModel,
  InvoiceMessage,
  RCountryList,
  RStateList,
} from '../../invoices/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private api = inject(ApiService);

  getCustomerList() {
    return this.api.post<CustomerListModel[]>('Invoice', 'GetCustomerList', null);
  }

  getCustomer(customerId: number) {
    return this.api.post<CustomerModel>('Invoice', 'GetCustomer', customerId);
  }

  addUpdateCustomer(model: CustomerModel) {
    return this.api.post<InvoiceMessage>('Invoice', 'AddCustomer', model);
  }

  getCountries() {
    return this.api.post<RCountryList>('Common', 'GetCountry', null);
  }

  getStates(countryId: number) {
    return this.api.post<RStateList>('Common', 'GetState', countryId);
  }

  getCurrencies() {
    return this.api.post<CurrencyModel[]>('Invoice', 'GetCurrencyList', null);
  }
}
