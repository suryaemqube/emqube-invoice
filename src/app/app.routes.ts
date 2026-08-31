import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
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
          import('./shared/components/page-placeholder/page-placeholder')
            .then(m => m.PagePlaceholder),
        data: { title: 'Quote List', icon: 'icon-note' },
      },
      {
        path: 'customerlist',
        loadComponent: () =>
          import('./shared/components/page-placeholder/page-placeholder')
            .then(m => m.PagePlaceholder),
        data: { title: 'Customer List', icon: 'icon-people' },
      },
      {
        path: 'master',
        loadComponent: () =>
          import('./shared/components/page-placeholder/page-placeholder')
            .then(m => m.PagePlaceholder),
        data: { title: 'Master Data', icon: 'icon-list' },
      },
    ],
  },
];
