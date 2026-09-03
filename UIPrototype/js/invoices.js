/*
  EmQube Invoice — Invoice List screen (Stage 2 prototype)

  RAW below is real sample invoice data supplied for this prototype
  (Invoice Number, Invoice Date, Customer Name, Pre Tax, Total, Payment
  Date). It has no Status field, so status is DERIVED HERE for display
  only, using fields the app already has on InvoiceListModel:

    - "Cancelled" if Total is 0 (matches the real app's own rule: an
      invoice with InvoiceTotal = 0 && TotalVAT = 0 is cancelled)
    - "Paid" if a Payment Date is present (PaymentRecdDate / IsPaid)
    - "Due" otherwise

  No Due Date and no "Overdue" state: InvoiceListModel carries no due
  date, so neither can be shown without a model/stored-procedure change.

  This derivation is presentational only — it does not read, call, or
  modify any backend status logic. VAT is likewise just Total − Pre Tax,
  computed here for display; TotalVAT already exists on the real model.

  Search/sort/filter/pagination all run client-side over the resulting
  array. Nothing is fetched from a server.
*/
(function () {
  'use strict';

  // [number, invoiceDate(DD-MM-YYYY), customer, currency, preTax, total, paymentDate(DD-MM-YYYY)|null]
  var RAW = [
    ['2026-77', '06-08-2026', 'Motor Vehicle Trading Company (BMW)', 'AED', 2425, 2425, '06-08-2026'],
    ['2026-76', '06-08-2026', 'Dewan Motors (BMW)', 'AED', 2440, 2440, '06-08-2026'],
    ['2026-75', '06-08-2026', 'Euro Motors (BMW)', 'AED', 3666, 3666, '06-08-2026'],
    ['2026-74', '06-08-2026', 'Atheeqe Ansari (Q2)', 'AED', 3000, 3150, null],
    ['2026-73', '29-07-2026', 'BMW AG (F49WPJF)', 'AED', 48898.5, 51343.43, null],
    ['2026-72', '27-07-2026', 'Arabian Gulf Mechanical Centre LLC (BMW) (17113)', 'AED', 35294, 37058.7, '10-08-2026'],
    ['2026-71', '22-07-2026', 'Karam Food Industries Co LLC (20260089)', 'AED', 8250, 8662.5, null],
    ['2026-70', '21-07-2026', 'Innerspace Trading LLC (Your Email)', 'AED', 3500, 3675, null],
    ['2026-69', '10-07-2026', 'Sentinel Ventures FZ-LLC (Whatsapp Chatbot)', 'AED', 3000, 3150, '22-07-2026'],
    ['2026-68', '03-07-2026', 'Emovers International Logistics Services Company (Q3 2026 Digital)', 'AED', 7500, 7500, null],
    ['2026-67', '03-07-2026', 'The Leaders Organization DMCC (Q3 2026 Digital)', 'AED', 16750, 17587.5, null],
    ['2026-66', '03-07-2026', 'ELECTRICWAY-FZCO (Q3 2026 Digital)', 'AED', 21200, 22260, null],
    ['2026-65', '03-07-2026', 'Executive Movers (Q3 2026 Digital)', 'AED', 27350, 27350, null],
    ['2026-64', '03-07-2026', 'E-Movers LLC (Q3 2026 Digital)', 'AED', 47600, 49980, '22-07-2026'],
    ['2026-63', '03-07-2026', 'Distance Learning Providers, Inc. (Jun_AMC)', 'USD', 5271, 5271, null],
    ['2026-62', '02-07-2026', 'E-Movers LLC (HRMS-Finance CR)', 'AED', 10115, 10620.75, null],
    ['2026-61', '02-07-2026', 'Executive Movers (SW AMC 2026 Q3)', 'AED', 2750, 2750, null],
    ['2026-60', '02-07-2026', 'E-Movers LLC (SW AMC Q3 2026)', 'AED', 33480, 35154, '22-07-2026'],
    ['2026-59', '02-07-2026', 'E-Movers LLC (SalesIQ)', 'AED', 3000, 3150, '07-07-2026'],
    ['2026-58', '29-06-2026', 'Innerspace Trading LLC (Your Email)', 'AED', 3500, 3675, '14-07-2026'],
    ['2026-57', '26-06-2026', 'Paramount Sovereign Trading L.L.C', 'AED', 2000, 2100, null],
    ['2026-56', '25-06-2026', 'Innerspace Trading LLC (Your Email)', 'AED', 3500, 3675, '25-06-2026'],
    ['2026-55', '09-06-2026', 'The Total Office LLC (10083-NewUserDashBoard)', 'AED', 850, 892.5, '16-06-2026'],
    ['2026-54', '05-06-2026', 'Distance Learning Providers, Inc. (MAY_AMC)', 'USD', 4611, 4611, '05-06-2026'],
    ['2026-53', '02-06-2026', 'Nikai Gulf FZE (Nikai - Catalogue Update 2026)', 'AED', 6500, 6825, null],
    ['2026-52', '02-06-2026', 'Nikai Gulf FZE (Nikura - Catalogue)', 'AED', 0, 0, null],
    ['2026-51', '02-06-2026', 'Crescent General Trading (L.L.C) (Nikai - AMC 2026)', 'AED', 6000, 6300, null],
    ['2026-50', '02-06-2026', 'Crescent General Trading (L.L.C) (Nikai - 3PL New Page)', 'AED', 0, 0, null],
    ['2026-49', '02-06-2026', 'Orient Financial Brokers (Q2)', 'AED', 6000, 6300, '29-06-2026'],
    ['2026-48', '20-05-2026', 'E-Movers LLC (Automated Invoicing and JCC)', 'AED', 19000, 19950, null],
    ['2026-47', '20-05-2026', 'E-Movers LLC (Manpower Capacity Dev)', 'AED', 5600, 5880, '08-06-2026'],
    ['2026-46', '08-05-2026', 'Karam Food Industries Co LLC (20260089)', 'AED', 8250, 8662.5, '09-07-2026'],
    ['2026-45', '08-05-2026', 'Dhiral Doshi', 'AED', 9350, 9350, '12-05-2026'],
    ['2026-44', '05-05-2026', 'Distance Learning Providers, Inc. (Apr_AMC)', 'USD', 6284, 6284, '05-06-2026'],
    ['2026-43', '04-05-2026', 'Zoho Software Trading L.L.C', 'AED', 2104.78, 2210.02, '19-05-2026'],
    ['2026-42', '29-04-2026', 'Crescent General Trading (L.L.C) (10074-NikaiLP)', 'AED', 4000, 4200, '10-06-2026'],
    ['2026-41', '27-04-2026', 'Flymac Holdings', 'AED', 1620, 1701, '28-04-2026'],
    ['2026-40', '03-04-2026', 'ELECTRICWAY-FZCO (Q2 2026 Digital)', 'AED', 21200, 22260, '08-04-2026'],
    ['2026-39', '03-04-2026', 'Emovers International Logistics Services Company (Q2 2026 Digital)', 'AED', 7500, 7500, '27-05-2026'],
    ['2026-38', '03-04-2026', 'The Leaders Organization DMCC (Q2 2026 Digital)', 'AED', 16750, 17587.5, '16-04-2026'],
    ['2026-37', '03-04-2026', 'Executive Movers (Q2 2026 Digital)', 'AED', 27350, 27350, '20-04-2026'],
    ['2026-36', '03-04-2026', 'E-Movers LLC (Q2 2026 Digital)', 'AED', 47600, 49980, '17-04-2026'],
    ['2026-35', '02-04-2026', 'E-Movers LLC (SW AMC Q2 2026)', 'AED', 33480, 35154, '17-04-2026'],
    ['2026-34', '01-04-2026', 'Executive Movers (SW AMC 2026 Q2)', 'AED', 2750, 2750, '20-04-2026'],
    ['2026-33', '31-03-2026', 'Distance Learning Providers, Inc. (JFM_AMC)', 'USD', 16250, 16250, '31-03-2026'],
    ['2026-32', '31-03-2026', 'ELECTRICWAY-FZCO', 'AED', 6000, 6300, '07-04-2026'],
    ['2026-31', '23-03-2026', 'BMW AG (F47TNYM)', 'EUR', 2285.71, 2400, '10-04-2026'],
    ['2026-30', '12-03-2026', 'Sentinel Ventures FZ-LLC (Whatsapp Chatbot)', 'AED', 3000, 3150, '12-03-2026'],
    ['2026-29', '10-03-2026', 'Innerspace Trading LLC (Dec, Jan, Feb)', 'AED', 10500, 11025, '13-04-2026'],
    ['2026-28', '02-03-2026', 'BMW AG (F47MJ65)', 'AED', 51313.5, 53879.18, '01-04-2026']
  ];

  function toISO(ddmmyyyy) {
    var p = ddmmyyyy.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }

  var invoices = RAW.map(function (r) {
    var preTax = r[4], total = r[5], paidOn = r[6];
    var status;
    if (total === 0) { status = 'cancelled'; }
    else if (paidOn) { status = 'paid'; }
    else { status = 'due'; }
    return {
      number: r[0],
      invoiceDate: toISO(r[1]),
      customer: r[2],
      currency: r[3],
      preTax: preTax,
      vat: Math.round((total - preTax) * 100) / 100,
      total: total,
      status: status
    };
  });

  var STATUS = {
    paid:      { label: 'Paid',      badge: 'eq-badge-success' },
    due:       { label: 'Due',       badge: 'eq-badge-warning' },
    cancelled: { label: 'Cancelled', badge: 'eq-badge-neutral' }
  };

  var els = {
    search: document.getElementById('inv-search'),
    year: document.getElementById('inv-year'),
    status: document.getElementById('inv-status'),
    clear: document.getElementById('inv-clear'),
    emptyClear: document.getElementById('inv-empty-clear'),
    skeleton: document.getElementById('inv-skeleton'),
    tableWrap: document.getElementById('inv-table-wrap'),
    tbody: document.getElementById('inv-tbody'),
    count: document.getElementById('inv-count'),
    pagination: document.getElementById('inv-pagination'),
    empty: document.getElementById('inv-empty'),
    toast: document.getElementById('eq-toast'),
    headers: document.querySelectorAll('#inv-table th[data-sort]')
  };

  var state = { sortKey: 'invoiceDate', sortDir: 'desc', page: 1, pageSize: 10 };

  function formatMoney(currency, amount) {
    return currency + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function formatDate(iso) {
    var parts = iso.split('-');
    var d = parseInt(parts[2], 10);
    var m = MONTHS[parseInt(parts[1], 10) - 1];
    return (d < 10 ? '0' + d : d) + ' ' + m + ' ' + parts[0];
  }

  function getFiltered() {
    var q = (els.search.value || '').trim().toLowerCase();
    var year = els.year.value;
    var status = els.status.value;

    return invoices.filter(function (inv) {
      if (q && inv.number.toLowerCase().indexOf(q) === -1 && inv.customer.toLowerCase().indexOf(q) === -1) { return false; }
      if (year && inv.invoiceDate.slice(0, 4) !== year) { return false; }
      if (status && inv.status !== status) { return false; }
      return true;
    });
  }

  function getSorted(list) {
    var key = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = a[key], bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') { return (av - bv) * dir; }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  function buildActions(inv) {
    if (inv.status === 'cancelled') {
      return '<button type="button" class="eq-icon-btn" title="View Invoice" data-coming-soon="View ' + inv.number + '"><i class="icon-eye"></i></button>';
    }
    var html = '<a href="create-invoice.html" class="eq-icon-btn" title="Edit Invoice"><i class="icon-pencil"></i></a>';
    if (inv.status === 'due') {
      html += '<button type="button" class="eq-icon-btn" title="Record Payment" data-payment="' + inv.number + '"><i class="icon-credit-card"></i></button>';
    }
    html += '<button type="button" class="eq-icon-btn" title="Print Invoice" data-coming-soon="Print ' + inv.number + '"><i class="icon-printer"></i></button>';
    return html;
  }

  function buildRow(inv) {
    var s = STATUS[inv.status];
    var voided = inv.status === 'cancelled' ? ' style="text-decoration:line-through;opacity:.6;"' : '';
    return '' +
      '<tr>' +
        '<td data-label="Invoice No." class="mono">' + inv.number + '</td>' +
        '<td data-label="Customer" class="wrap" title="' + inv.customer.replace(/"/g, '&quot;') + '">' + inv.customer + '</td>' +
        '<td data-label="Invoice Date">' + formatDate(inv.invoiceDate) + '</td>' +
        '<td data-label="Pre-Tax Amount" class="num"' + voided + '>' + formatMoney(inv.currency, inv.preTax) + '</td>' +
        '<td data-label="VAT" class="num"' + voided + '>' + formatMoney(inv.currency, inv.vat) + '</td>' +
        '<td data-label="Total" class="num"' + voided + '>' + formatMoney(inv.currency, inv.total) + '</td>' +
        '<td data-label="Status"><span class="eq-badge ' + s.badge + '">' + s.label + '</span></td>' +
        '<td data-label="" class="actions"><div class="eq-row-actions">' + buildActions(inv) + '</div></td>' +
      '</tr>';
  }

  /* Reproduces <mfBootstrapPaginator>'s own template exactly — same
     element structure, same class names, same page-window rules — so the
     CSS written against it transfers to the real component untouched.
     (angular2-datatable/src/BootstrapPaginator.ts) */
  var ROWS_ON_PAGE_SET = [10, 25, 50];

  function pageItem(page, label, extraClass) {
    return '<li class="page-item' + (extraClass ? ' ' + extraClass : '') + '" data-page="' + page + '">' +
             '<a class="page-link" style="cursor: pointer">' + label + '</a>' +
           '</li>';
  }

  function renderPagination(totalItems) {
    var lastPage = Math.max(1, Math.ceil(totalItems / state.pageSize));
    var active = state.page;
    var html = '';

    if (totalItems > state.pageSize) {
      html += '<ul class="pagination">';
      html += pageItem(1, '&laquo;', active <= 1 ? 'disabled' : '');
      if (active > 4 && active + 1 > lastPage) { html += pageItem(active - 4, active - 4); }
      if (active > 3 && active + 2 > lastPage) { html += pageItem(active - 3, active - 3); }
      if (active > 2) { html += pageItem(active - 2, active - 2); }
      if (active > 1) { html += pageItem(active - 1, active - 1); }
      html += pageItem(active, active, 'active');
      if (active + 1 <= lastPage) { html += pageItem(active + 1, active + 1); }
      if (active + 2 <= lastPage) { html += pageItem(active + 2, active + 2); }
      if (active + 3 <= lastPage && active < 3) { html += pageItem(active + 3, active + 3); }
      if (active + 4 <= lastPage && active < 2) { html += pageItem(active + 4, active + 4); }
      html += pageItem(lastPage, '&raquo;', active >= lastPage ? 'disabled' : '');
      html += '</ul>';
    }

    if (totalItems > ROWS_ON_PAGE_SET[0]) {
      html += '<ul class="pagination pull-right float-sm-right">';
      ROWS_ON_PAGE_SET.forEach(function (rows) {
        html += '<li class="page-item' + (state.pageSize === rows ? ' active' : '') + '" data-rows="' + rows + '">' +
                  '<a class="page-link" style="cursor: pointer">' + rows + '</a>' +
                '</li>';
      });
      html += '</ul>';
    }

    els.pagination.innerHTML = html;
  }

  function render() {
    var filtered = getSorted(getFiltered());

    els.headers.forEach(function (th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.getAttribute('data-sort') === state.sortKey) {
        th.classList.add(state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });

    if (filtered.length === 0) {
      els.tableWrap.hidden = true;
      els.empty.hidden = false;
      return;
    }
    els.tableWrap.hidden = false;
    els.empty.hidden = true;

    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.page > totalPages) { state.page = totalPages; }
    var start = (state.page - 1) * state.pageSize;
    var pageItems = filtered.slice(start, start + state.pageSize);

    els.tbody.innerHTML = pageItems.map(buildRow).join('');
    els.count.textContent = filtered.length + ' invoice' + (filtered.length === 1 ? '' : 's');
    renderPagination(filtered.length);
  }

  function populateYears() {
    var years = {};
    invoices.forEach(function (inv) { years[inv.invoiceDate.slice(0, 4)] = true; });
    Object.keys(years).sort().reverse().forEach(function (y) {
      var opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      els.year.appendChild(opt);
    });
  }

  function clearFilters() {
    els.search.value = '';
    els.year.value = '';
    els.status.value = '';
    state.page = 1;
    render();
  }

  var toastTimer;
  function showToast(message) {
    els.toast.textContent = message + ' — not wired up in this prototype.';
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2200);
  }

  function attachListeners() {
    els.search.addEventListener('input', function () { state.page = 1; render(); });
    els.year.addEventListener('change', function () { state.page = 1; render(); });
    els.status.addEventListener('change', function () { state.page = 1; render(); });
    els.clear.addEventListener('click', clearFilters);
    els.emptyClear.addEventListener('click', clearFilters);

    els.headers.forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = 'asc';
        }
        render();
      });
    });

    els.pagination.addEventListener('click', function (e) {
      var item = e.target.closest('.page-item');
      if (!item || item.classList.contains('disabled')) { return; }
      if (item.hasAttribute('data-rows')) {
        state.pageSize = parseInt(item.getAttribute('data-rows'), 10);
        state.page = 1;
      } else if (item.hasAttribute('data-page')) {
        state.page = parseInt(item.getAttribute('data-page'), 10);
      }
      render();
    });

    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-coming-soon]');
      if (!target) { return; }
      e.preventDefault();
      showToast(target.getAttribute('data-coming-soon'));
    });

    /* ---- record payment modal ----
       In the real app addNewItem(modal, row) assigns the whole row to
       InvoiceData and calls modal.show(); here we fill the same fields
       from the same row object and toggle the modal classes ngx-bootstrap
       toggles (.in + display) so the styling matches one-for-one. */
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-payment]');
      if (trigger) {
        e.preventDefault();
        openPaymentModal(trigger.getAttribute('data-payment'));
        return;
      }
      if (e.target.closest('[data-modal-close]') || e.target.id === 'paymentBackdrop') {
        closePaymentModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closePaymentModal(); }
    });
  }

  var modal = document.getElementById('paymentModal');
  var backdrop = document.getElementById('paymentBackdrop');

  function openPaymentModal(number) {
    var inv = invoices.filter(function (i) { return i.number === number; })[0];
    if (!inv) { return; }
    document.getElementById('pay-invoice-no').textContent = inv.number;
    document.getElementById('pay-customer').textContent = inv.customer;
    document.getElementById('pay-invoice-date').textContent = formatDate(inv.invoiceDate);
    document.getElementById('pay-total').textContent = formatMoney(inv.currency, inv.total);
    document.getElementById('pay-date').value = '';
    modal.classList.add('in');
    backdrop.classList.add('in');
    document.body.classList.add('modal-open');
  }

  function closePaymentModal() {
    modal.classList.remove('in');
    backdrop.classList.remove('in');
    document.body.classList.remove('modal-open');
  }

  function init() {
    populateYears();
    attachListeners();
    setTimeout(function () {
      els.skeleton.hidden = true;
      render();
    }, 550);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
