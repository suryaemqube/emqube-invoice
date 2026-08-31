import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api';
import {
  InvoiceListModel,
  BusinessDivision,
  SalesExecutive,
  CustomerOption,
  InvoiceMessage,
  PaymentModel,
  CurrencyModel,
  PaymentTermModel,
  ParameterModel,
  AccountLedgerModel,
  UOMModel,
  VATCodeModel,
  StateModel,
  ProductModel,
  CustomerDetail,
  QuoteOption,
  QuoteModel,
  InvoiceFormModel,
  RPaymentTermList,
  RParameterList,
  RStateList,
} from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private api = inject(ApiService);

  getInvoiceList() {
    return this.api.post<InvoiceListModel[]>('Invoice', 'GetInvoiceList');
  }

  getInvoiceYears() {
    return this.api.post<number[]>('Invoice', 'getInvoiceYear');
  }

  getBusinessDivisions() {
    return this.api.post<BusinessDivision[]>('Invoice', 'GetBusinessDivisionList', null);
  }

  getSalesExecutives() {
    return this.api.post<SalesExecutive[]>('Invoice', 'GetSalesExecutiveList', {
      SalesExecutiveId: null,
      ProfileId: null,
      ReportingTo: null,
    });
  }

  getCustomers() {
    return this.api.post<CustomerOption[]>('Invoice', 'GetCustomerList', null);
  }

  getCustomersFull() {
    return this.api.post<CustomerDetail[]>('Invoice', 'GetCustomerList', null);
  }

  getCurrencies() {
    return this.api.post<CurrencyModel[]>('Invoice', 'GetCurrencyList', null);
  }

  getPaymentTerms() {
    return this.api.post<RPaymentTermList>('Common', 'GetPaymentTerm', 10);
  }

  getParameters(parameterTypeId: number) {
    return this.api.post<RParameterList>('Common', 'GetParameters', parameterTypeId);
  }

  getStates() {
    return this.api.post<RStateList>('Common', 'GetState', null);
  }

  getAccountLedgers() {
    return this.api.post<AccountLedgerModel[]>('Invoice', 'GetAccountLedgerList', null);
  }

  getUOMs() {
    return this.api.post<UOMModel[]>('Invoice', 'GetUOMList', null);
  }

  getVATCodeList() {
    return this.api.post<VATCodeModel[]>('Invoice', 'GetVATCodeList', null);
  }

  getProducts() {
    return this.api.post<ProductModel[]>('Invoice', 'GetProductList', {
      ProductId: null,
      ProductType: null,
      CategoryId: null,
      VATCode: null,
    });
  }

  getInvoicesList(taxInvoiceId: number) {
    return this.api.post<InvoiceFormModel[]>('Invoice', 'GetInvoicesList', taxInvoiceId);
  }

  getCustomerQuotes(customerId: number) {
    return this.api.post<QuoteOption[]>('Invoice', 'getCustomerQuote', customerId);
  }

  getQuotesList(quoteId: number) {
    return this.api.post<QuoteModel[]>('Invoice', 'GetQuotesList', quoteId);
  }

  addUpdateInvoice(model: InvoiceFormModel) {
    return this.api.post<InvoiceMessage>('Invoice', 'AddUpdateInvoive', model);
  }

  generateInvoice(taxInvoiceId: number) {
    return this.api.post<string>('Invoice', 'GenerateInvoice', taxInvoiceId);
  }

  addPayment(model: PaymentModel) {
    return this.api.post<InvoiceMessage>('Invoice', 'AddPayment', model);
  }
}
