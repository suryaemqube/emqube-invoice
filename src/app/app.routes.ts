import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/login/login').then((m) => m.Login),
      },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard),
      },
      {
        path: 'invoicelist',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-list/invoice-list')
            .then(m => m.InvoiceList),
      },
      {
        path: 'createinvoice',
        loadComponent: () =>
          import('./features/invoices/pages/create-invoice/create-invoice')
            .then(m => m.CreateInvoice),
      },
      {
        path: 'createinvoice/:id',
        loadComponent: () =>
          import('./features/invoices/pages/create-invoice/create-invoice')
            .then(m => m.CreateInvoice),
      },
      {
        path: 'quotelist',
        loadComponent: () =>
          import('./features/quotes/pages/quote-list/quote-list')
            .then(m => m.QuoteList),
      },
      {
        path: 'createquote',
        loadComponent: () =>
          import('./features/quotes/pages/create-quote/create-quote')
            .then(m => m.CreateQuote),
      },
      {
        path: 'createquote/:id',
        loadComponent: () =>
          import('./features/quotes/pages/create-quote/create-quote')
            .then(m => m.CreateQuote),
      },
      {
        path: 'customerlist',
        loadComponent: () =>
          import('./features/customers/pages/customer-list/customer-list')
            .then(m => m.CustomerList),
      },
      {
        path: 'customer',
        loadComponent: () =>
          import('./features/customers/pages/customer-list/customer-list')
            .then(m => m.CustomerList),
      },
      {
        path: 'employee',
        loadComponent: () =>
          import('./shared/components/page-placeholder/page-placeholder')
            .then(m => m.PagePlaceholder),
        data: { title: 'Employee', icon: 'icon-user' },
      },
      {
        path: 'master',
        loadComponent: () =>
          import('./shared/components/page-placeholder/page-placeholder')
            .then(m => m.PagePlaceholder),
        data: { title: 'Master Data', icon: 'icon-list' },
      },
      {
        path: 'changepassword',
        loadComponent: () =>
          import('./features/login/change-password/change-password')
            .then(m => m.ChangePassword),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
