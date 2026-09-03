export interface InvoiceListModel {
  TaxInvoiceId: number;
  InvoiceNumber: string;
  InvoiceDateString: string;
  DivisionName: string;
  CustomerName: string;
  CurrencySymbol: string;
  InvoiceTotal: number;
  TotalVAT: number;
  SExecutiveFirstName: string;
  SExecutiveLastName: string;
  SExecutiveName: string;
  InvoicePaidDate: string | null;
  PaymentRecdDateString: string | null;
  PaymentRecdDate: string | null;
  InvoiceDate: string;
  InvoiceRevNumber: number;
  IsPaid: boolean;
  ProductName: string;
  PreTaxTotal: number;
  IsEditable: number;
  ConversionRate: number;
}

export interface BusinessDivision {
  BusinessDivisionId: number;
  DivisionName: string;
}

export interface QuoteListModel {
  TaxInvoiceId: number;
  QuoteNumber: string;
  QuoteDateString: string;
  DivisionName: string;
  CustomerName: string;
  CurrencySymbol: string;
  InvoiceTotal: number | null;
  TotalVAT: number | null;
  SExecutiveFirstName: string;
  SExecutiveLastName: string;
  SExecutiveName: string;
  InvoicePaidDate: string | null;
  PaymentRecdDateString: string | null;
  PaymentRecdDate: string | null;
  InvoiceDate: string | null;
  InvoiceRevNumber: string | null;
  IsPaid: number;
  ProductName: string;
  QuotetypeText: string;
  Quotetype: number | null;
  QuotetypeValue: number | null;
}

export interface SalesExecutive {
  SalesExecutiveId: number;
  Name: string;
}

export interface CustomerOption {
  CustomerId: number;
  CustomerName: string;
}

export type InvoiceStatus = 'paid' | 'due' | 'cancelled';

export function deriveStatus(row: InvoiceListModel): InvoiceStatus {
  if (row.InvoiceTotal === 0 && row.TotalVAT === 0) return 'cancelled';
  if (row.PaymentRecdDateString) return 'paid';
  return 'due';
}

export interface KpiCard {
  label: string;
  value: string;
  currency?: string;
  cssClass?: string;
  valueIsCount?: boolean;
  badge?: { text: string; tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral' };
  note?: string;
}

export interface InvoiceMessage {
  Code: number;
  Text: string;
  MessageTypeValue: number;
}

export interface PaymentModel {
  TaxInvoiceId: number;
  PaymentRecdDate: string;
  PaymentRecdDateString: string;
}

// ---------------------------------------------------------------------------
// Create / Edit Invoice — master-data list shapes
// Field names match the backend DTOs exactly (see API-NOTES.md).
// ---------------------------------------------------------------------------

export interface ApiError {
  Code: number;
  Text: string;
  MessageTypeValue: number;
}

export interface CurrencyModel {
  CurrencyId: number;
  CurrencyName: string;
  CurrencySymbol: string;
  ConversionRate: string;
}

export interface PaymentTermModel {
  PaymentTermId: number;
  Name: string;
  NoOfDays: number;
  Visibility: boolean;
}

export interface ParameterModel {
  ParameterId: number;
  ParameterTypeId: number;
  Text: string;
  ParameterValue: number;
  DisplayOrder: number;
  Visibility: boolean;
}

export interface AccountLedgerModel {
  AccountLedgerId: number;
  AccountLedgerCode: string;
  AccountLedgerName: string;
}

export interface UOMModel {
  UOMId: number;
  Name: string;
  Visibility: boolean;
}

export interface VATCodeModel {
  VatCodeId: number;
  VATCodeName: string;
  VATRate: number;
  Description: string;
}

export interface StateModel {
  StateId: number;
  StateName: string;
  StateCode: string;
}

export interface ProductModel {
  ProductId: number;
  ProductName: string;
  ProductDescription: string;
  UOM: number | null;
  VATCode: number | null;
  VATRate: number;
  VATCodeName: string;
  PurchaseRate: number | null;
  SellRate: number | null;
}

export interface CustomerDetail extends CustomerOption {
  CustomerCode: string;
  CountryId: number;
  StateId: number;
  Address: string;
  FirstName: string;
  LastName: string;
  VATNo: string;
  ConversionRate: string;
  CurrencyId: number;
  CurrencySymbol: string;
  InvoiceStartDate: string | null;
  TermsandConditions: string;
}

// ---------------------------------------------------------------------------
// Customer List / Add-Edit — full backend shape
// ---------------------------------------------------------------------------

export interface CustomerListModel {
  CustomerId: number;
  CustomerCode: string;
  CustomerName: string;
  CustomerType: number;
  IndustryId: number | null;
  IsIndividual: boolean;
  IsProspect: boolean;
  Website: string;
  ProfileId: number | null;
  Designation: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  UserType: number | null;
  AddressType: number | null;
  AddressId: number | null;
  IsPrimaryAddress: boolean | null;
  Address: string;
  CityName: string;
  StateId: number | null;
  Zipcode: string;
  CountryId: number | null;
  StateName: string;
  CountryName: string;
  IsActive: boolean;
  Status: string;
  VATEligible: boolean;
  VATNo: string;
  CurrencyId: number | null;
  CurrencySymbol: string;
  CurrencyName: string;
  ConversionRate: string;
  InvoiceStartDate: string | null;
  TermsandConditions: string;
}

export interface AddressModel {
  CountryId: number | null;
  AddressId: number;
  Address: string;
  CityName: string;
  StateId: number | null;
  Zipcode: string;
  IsActive: boolean;
}

export interface CustomerModel {
  // all CustomerListModel fields
  CustomerId: number;
  CustomerCode: string;
  CustomerName: string;
  CustomerType: number;
  IndustryId: number | null;
  IsIndividual: boolean;
  IsProspect: boolean;
  Website: string;
  ProfileId: number | null;
  Designation: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  UserType: number | null;
  AddressType: number | null;
  AddressId: number | null;
  IsPrimaryAddress: boolean | null;
  Address: string;
  CityName: string;
  StateId: number | null;
  Zipcode: string;
  CountryId: number | null;
  StateName: string;
  CountryName: string;
  IsActive: boolean;
  Status: string;
  VATEligible: boolean;
  VATNo: string;
  CurrencyId: number | null;
  CurrencySymbol: string;
  CurrencyName: string;
  ConversionRate: string;
  InvoiceStartDate: string | null;
  TermsandConditions: string;
  // add/edit extras
  SiteUserId: number | null;
  CustomerTypeValue: number | null;
  BillingAddress: AddressModel;
  ShippingAddress: AddressModel;
}

export interface CountryModel {
  CountryId: number;
  CountryName: string;
  CountryCode: string;
  CountryShortName: string;
}

export interface RCountryList {
  Error: ApiError | null;
  CountryList: CountryModel[];
}

export function emptyAddress(): AddressModel {
  return {
    CountryId: 0,
    AddressId: 0,
    Address: '',
    CityName: '',
    StateId: 0,
    Zipcode: '',
    IsActive: true,
  };
}

export function emptyCustomerModel(): CustomerModel {
  return {
    CustomerId: 0,
    CustomerCode: '',
    CustomerName: '',
    CustomerType: 2,
    IndustryId: null,
    IsIndividual: false,
    IsProspect: false,
    Website: '',
    ProfileId: null,
    Designation: '',
    Email: '',
    FirstName: '',
    LastName: '',
    Phone: '',
    UserType: null,
    AddressType: null,
    AddressId: null,
    IsPrimaryAddress: true,
    Address: '',
    CityName: '',
    StateId: null,
    Zipcode: '',
    CountryId: null,
    StateName: '',
    CountryName: '',
    IsActive: true,
    Status: 'Active',
    VATEligible: false,
    VATNo: '',
    CurrencyId: null,
    CurrencySymbol: '',
    CurrencyName: '',
    ConversionRate: '',
    InvoiceStartDate: null,
    TermsandConditions: '',
    SiteUserId: null,
    CustomerTypeValue: 2,
    BillingAddress: emptyAddress(),
    ShippingAddress: emptyAddress(),
  };
}

export interface QuoteOption {
  QuoteId: number | null;
  QuoteNumber: string;
}

export interface QuoteDetailsModel {
  QuoteId: number | null;
  QuoteDetailId: number | null;
  ProductId: number;
  ProductName: string;
  ProductDescription: string;
  UOMId: number;
  Quantity: number;
  Rate: number;
  ProductDiscountRate: number;
  ProductDiscountAmount: number;
  VATCodeId: number;
  VATRate: number;
  VATCodeName: string;
  Amount: number;
}

export interface QuoteModel extends QuoteOption {
  CustomerId: number;
  BillingAddress: string;
  PlaceOfSupply: number | null;
  DeliveryDate: string | null;
  DeliveryDateString: string | null;
  QuoteDate: string | null;
  QuoteDateString: string | null;
  QuoteRevNumber: string;
  QuoteType: number | null;
  AttentionOf: string;
  LPONumber: string;
  InvoiceType: number | null;
  AccountLedgerId: number | null;
  CustomerVATNo: string;
  SalesExecutiveId: number | null;
  BusinessDivisionId: number | null;
  PaymentTermId: number | null;
  CurrencyId: number | null;
  ConversionRate: number | null;
  DiscountRate: number | null;
  DiscountAmount: number | null;
  VATType: number;
  PreTaxTotal: number;
  TotalVAT: number;
  InvoiceTotal: number;
  FooterText: string;
  ITypeValue: number;
  VTypeValue: number;
  IsTaxInclusive: boolean;
  showtotal: boolean;
  SimplifiedVATCodeId: number;
  SimplifiedDiscountRateId: number;
  SimplifiedDiscount: number;
  ProductList: QuoteDetailsModel[];
  CreatedBy: number;
}

export interface QuoteRevisionModel {
  QuoteId: number;
  QuoteNumber: string;
  QuoteDate: string | null;
  QuoteDateString: string | null;
  CreatedBy: number | null;
  CreatedOn: string | null;
}

export interface QuoteLineItem {
  QuoteId: number | null;
  QuoteDetailId: number | null;
  ProductId: number;
  ProductName: string;
  ProductDescription: string;
  UOMId: number;
  Quantity: number;
  Rate: number;
  VatCodeId: number;
  VATCodeName: string;
  VATRate: number;
  PreTaxAmount: number;
  TaxAmount: number;
  Amount: number;
}

export interface RPaymentTermList {
  Error: ApiError | null;
  PaymentTermList: PaymentTermModel[];
}

export interface RParameterList {
  Error: ApiError | null;
  ParameterList: ParameterModel[];
}

export interface RStateList {
  Error: ApiError | null;
  StateList: StateModel[];
}

// ---------------------------------------------------------------------------
// Create / Edit Invoice — line item + payload shapes
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  TAXInvoiceDetailId: number;
  TaxInvoiceId: number | null;
  ProductId: number;
  ProductName: string;
  ProductDescription: string;
  UOMId: number;
  Quantity: number;
  Rate: number;
  Discount: number;
  ParameterValue: number;
  VatCodeId: number;
  VATCodeName: string;
  VATRate: number;
  PreTaxAmount: number;
  TaxAmount: number;
  Amount: number;
  ProductDiscountRate: number;
  ProductDiscountAmount: number;
}

export interface InvoiceFormModel {
  TaxInvoiceId: number | null;
  InvoiceNumber: string;
  CustomerId: number;
  BillingAddress: string;
  PlaceOfSupply: number | null;
  DeliveryDate: string | null;
  DeliveryDateString: string | null;
  InvoiceDate: string | null;
  InvoiceDateString: string | null;
  PaymentRecdDate: string | null;
  PaymentRecdDateString: string | null;
  AttentionOf: string;
  LPONumber: string;
  InvoiceType: number | null;
  AccountLedgerId: number | null;
  CustomerVATNo: string;
  SalesExecutiveId: number | null;
  BusinessDivisionId: number | null;
  PaymentTermId: number | null;
  CurrencyId: number | null;
  ConversionRate: number | null;
  PreTaxStdTotal: number;
  PreTaxZeroTotal: number;
  PreTaxExemptTotal: number;
  PreTaxTotal: number;
  TotalVAT: number;
  InvoiceTotal: number;
  FooterText: string;
  CreatedBy: number;
  CreatedOn: string | null;
  ModifiedBy: number | null;
  ModifiedOn: string | null;
  InvoiceDiscountRate: number;
  DiscountAmount: number;
  VATType: number;
  IsTaxInclusive: boolean;
  SimplifiedVATCodeId: number;
  SimplifiedDiscountRateId: number;
  SimplifiedDiscount: number;
  ProductList: InvoiceLineItem[];
  ITypeValue?: number;
  VTypeValue?: number;
  VTypeId?: number;
}

export function emptyLineItem(): InvoiceLineItem {
  return {
    TAXInvoiceDetailId: 0,
    TaxInvoiceId: null,
    ProductId: 0,
    ProductName: '',
    ProductDescription: '',
    UOMId: 0,
    Quantity: 1,
    Rate: 0,
    Discount: 0,
    ParameterValue: 0,
    VatCodeId: 1,
    VATCodeName: '',
    VATRate: 0,
    PreTaxAmount: 0,
    TaxAmount: 0,
    Amount: 0,
    ProductDiscountRate: 0,
    ProductDiscountAmount: 0,
  };
}

export function emptyInvoiceForm(): InvoiceFormModel {
  return {
    TaxInvoiceId: null,
    InvoiceNumber: '',
    CustomerId: 0,
    BillingAddress: '',
    PlaceOfSupply: null,
    DeliveryDate: null,
    DeliveryDateString: null,
    InvoiceDate: null,
    InvoiceDateString: null,
    PaymentRecdDate: null,
    PaymentRecdDateString: null,
    AttentionOf: '',
    LPONumber: '',
    InvoiceType: null,
    AccountLedgerId: null,
    CustomerVATNo: '',
    SalesExecutiveId: null,
    BusinessDivisionId: null,
    PaymentTermId: null,
    CurrencyId: null,
    ConversionRate: null,
    PreTaxStdTotal: 0,
    PreTaxZeroTotal: 0,
    PreTaxExemptTotal: 0,
    PreTaxTotal: 0,
    TotalVAT: 0,
    InvoiceTotal: 0,
    FooterText: '',
    CreatedBy: 1,
    CreatedOn: null,
    ModifiedBy: null,
    ModifiedOn: null,
    InvoiceDiscountRate: 0,
    DiscountAmount: 0,
    VATType: 0,
    IsTaxInclusive: false,
    SimplifiedVATCodeId: 1,
    SimplifiedDiscountRateId: 0,
    SimplifiedDiscount: 0,
    ProductList: [emptyLineItem()],
  };
}

export function emptyQuoteLine(): QuoteLineItem {
  return {
    QuoteId: null,
    QuoteDetailId: null,
    ProductId: 0,
    ProductName: '',
    ProductDescription: '',
    UOMId: 0,
    Quantity: 1,
    Rate: 0,
    VatCodeId: 1,
    VATCodeName: '',
    VATRate: 0,
    PreTaxAmount: 0,
    TaxAmount: 0,
    Amount: 0,
  };
}

export function emptyQuote(): QuoteModel {
  return {
    QuoteId: null,
    QuoteNumber: '',
    QuoteRevNumber: '',
    QuoteType: 1,
    CustomerId: 0,
    BillingAddress: '',
    PlaceOfSupply: null,
    DeliveryDate: null,
    DeliveryDateString: null,
    QuoteDate: null,
    QuoteDateString: null,
    AttentionOf: '',
    LPONumber: '',
    InvoiceType: null,
    AccountLedgerId: 1,
    CustomerVATNo: '',
    SalesExecutiveId: null,
    BusinessDivisionId: null,
    PaymentTermId: null,
    CurrencyId: null,
    ConversionRate: null,
    DiscountRate: null,
    DiscountAmount: null,
    VATType: 2,
    PreTaxTotal: 0,
    TotalVAT: 0,
InvoiceTotal: 0,
  FooterText: '',
  ITypeValue: 0,
  VTypeValue: 2,
  IsTaxInclusive: true,
  showtotal: true,
  SimplifiedVATCodeId: 1,
  SimplifiedDiscountRateId: 0,
  SimplifiedDiscount: 0,
  ProductList: [],
  CreatedBy: 1,
};
}
