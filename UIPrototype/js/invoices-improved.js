/*
  EmQube Invoice — Invoice List (IMPROVED) — prototype behaviour
  =============================================================
  Mirror of js/invoices.js but for the improved layout in
  invoices-improved.html. Uses the SAME sample data and the SAME status
  derivation rules (Cancelled iff total==0 && vat==0; Paid iff payment date
  present; else Due) — no backend logic is invented or changed. It adds:
    - a 4-card KPI strip (Outstanding / Invoiced / Paid / Due),
    - an active-filter chip row,
    - column sorting (invoice no., status, date, customer, pre-tax, vat,
      total, paid date),
    - per-row division tags,
    - a filtered totals summary row in the table footer,
    - a single kebab ⋮ action menu per row instead of inline icon buttons.
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

  // seed division + sales exec per row (sample-only, for the improved columns)
  var DIVISIONS = ['Web', 'Software'];
  var EXECS = ['Alia R.', 'Omar K.', 'Fatima S.', 'Sara M.'];

  function toISO(ddmmyyyy) {
    var p = ddmmyyyy.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }
  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  var invoices = RAW.map(function (r, idx) {
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
      paidDate: paidOn ? toISO(paidOn) : null,
      status: status,
      division: DIVISIONS[idx % DIVISIONS.length],
      exec: EXECS[idx % EXECS.length]
    };
  });

  var STATUS = {
    paid:      { label: 'Paid',      cls: 'eq-status-paid' },
    due:       { label: 'Due',       cls: 'eq-status-due' },
    cancelled: { label: 'Cancelled', cls: 'eq-status-cancelled' }
  };

  var els = {
    search: document.getElementById('inv-search'),
    year: document.getElementById('inv-year'),
    status: document.getElementById('inv-status'),
    division: document.getElementById('inv-division'),
    customer: document.getElementById('inv-customer'),
    clear: document.getElementById('inv-clear'),
    emptyClear: document.getElementById('inv-empty-clear'),
    chips: document.getElementById('inv-chips'),
    skeleton: document.getElementById('inv-skeleton'),
    tableWrap: document.getElementById('inv-table-wrap'),
    tbody: document.getElementById('inv-tbody'),
    tfoot: document.getElementById('inv-tfoot'),
    count: document.getElementById('inv-count'),
    pagination: document.getElementById('inv-pagination'),
    empty: document.getElementById('inv-empty'),
    toast: document.getElementById('eq-toast'),
    headers: document.querySelectorAll('#inv-table th[data-sort]')
  };

  var state = { sortKey: 'invoiceDate', sortDir: 'desc', page: 1, pageSize: 10 };

  function fmtMoney(currency, amount) {
    return currency + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtNum(amount) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    var d = parseInt(parts[2], 10);
    var m = MONTHS[parseInt(parts[1], 10) - 1];
    return (d < 10 ? '0' + d : d) + ' ' + m + ' ' + parts[0];
  }

  /* ---------- KPI ---------- */
  function computeKpis() {
    var year = new Date().getFullYear();
    var now = new Date();
    var thisMonth = now.getMonth(), thisYear = now.getFullYear();
    var outstanding = 0, outstandingCount = 0;
    var invoiced = 0, invoicedCount = 0;
    var paid = 0, paidCount = 0;
    var due = 0;

    invoices.forEach(function (inv) {
      if (inv.status === 'cancelled') return;
      var d = new Date(inv.invoiceDate);
      var isThisMonth = d.getMonth() === thisMonth && d.getFullYear() === thisYear;

      // Outstanding = current-year unpaid (AED only in this mock, for clarity)
      if (inv.status === 'due' && d.getFullYear() === year) {
        outstanding += inv.currency === 'AED' ? inv.total : 0;
        outstandingCount++;
      }
      if (isThisMonth) { invoiced += inv.currency === 'AED' ? inv.total : 0; invoicedCount++; }
      if (inv.status === 'paid' && inv.paidDate) {
        var pd = new Date(inv.paidDate);
        if (pd.getMonth() === thisMonth && pd.getFullYear() === thisYear) {
          paid += inv.currency === 'AED' ? inv.total : 0; paidCount++;
        }
      }
      if (inv.status === 'due') due++;
    });

    setText('kpi-outstanding', fmtNum(outstanding));
    setText('kpi-outstanding-badge', outstandingCount > 0 ? outstandingCount + ' unpaid' : 'no unpaid');
    setText('kpi-outstanding-note', outstandingCount + ' open invoice' + (outstandingCount === 1 ? '' : 's') + ' this year');
    setText('kpi-invoiced', fmtNum(invoiced));
    setText('kpi-invoiced-badge', invoicedCount + ' invoice' + (invoicedCount === 1 ? '' : 's'));
    setText('kpi-paid', fmtNum(paid));
    setText('kpi-paid-badge', paidCount + ' paid');
    setText('kpi-due', String(due));
    setText('kpi-due-note', 'awaiting payment');
  }
  function setText(id, text) { var e = document.getElementById(id); if (e) e.textContent = text; }

  /* ---------- filter / search ---------- */
  function getFiltered() {
    var q = (els.search.value || '').trim().toLowerCase();
    var year = els.year.value;
    var status = els.status.value;
    var division = els.division.value;
    var customer = els.customer.value;
    return invoices.filter(function (inv) {
      if (q) {
        var hay = (inv.number + ' ' + inv.customer + ' ' + inv.exec + ' ' + inv.division).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (year && inv.invoiceDate.slice(0, 4) !== year) return false;
      if (status && inv.status !== status) return false;
      if (division && inv.division !== division) return false;
      if (customer && inv.customer !== customer) return false;
      return true;
    });
  }

  /* ---------- sorting ---------- */
  function getSorted(list) {
    var key = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = a[key], bv = b[key];
      if (key === 'status') { av = { paid: 0, due: 1, cancelled: 2 }[a.status]; bv = { paid: 0, due: 1, cancelled: 2 }[b.status]; }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv)) * dir;
    });
  }

  /* ---------- actions ---------- */
  function buildActions(inv) {
    var html = '<div class="eq-row-actions">';
    html += '<div class="eq-kebab">' +
              '<button type="button" class="eq-icon-btn" data-kebab title="Actions"><i class="icon-options-vertical"></i></button>' +
              '<div class="eq-kebab-menu">';
    if (inv.status === 'cancelled') {
      html += '<button type="button" data-coming-soon="View ' + inv.number + '"><i class="icon-eye"></i>View</button>';
    } else {
      html += '<button type="button" data-coming-soon="Edit ' + inv.number + '"><i class="icon-pencil"></i>Edit</button>';
      if (inv.status === 'due') {
        html += '<button type="button" data-payment="' + inv.number + '"><i class="icon-credit-card"></i>Record Payment</button>';
      }
      html += '<button type="button" data-coming-soon="Print ' + inv.number + '"><i class="icon-printer"></i>Print</button>';
    }
    html += '</div></div>';
    html += '</div>';
    return html;
  }

  function buildRow(inv) {
    var s = STATUS[inv.status];
    return '' +
      '<tr class="tr-' + inv.status + '">' +
        '<td data-label="Invoice" class="mono"><span class="eq-inv-no">' + inv.number + '</span></td>' +
        '<td data-label="Status"><span class="eq-status ' + s.cls + '"><span class="dot"></span>' + s.label + '</span></td>' +
        '<td data-label="Date">' + fmtDate(inv.invoiceDate) + '</td>' +
        '<td data-label="Customer" class="col-customer-cell" title="' + inv.customer.replace(/"/g, '&quot;') + '">' + inv.customer + '</td>' +
        '<td data-label="Product"><div class="eq-product-cell"><span class="eq-product-name">' + inv.customer.split(' (')[0] + '</span><span class="eq-product-division">' + inv.division + ' division</span></div></td>' +
        '<td data-label="Pre-Tax" class="num">' + fmtMoney(inv.currency, inv.preTax) + '</td>' +
        '<td data-label="VAT" class="num">' + fmtMoney(inv.currency, inv.vat) + '</td>' +
        '<td data-label="Total" class="num col-total-cell">' + fmtMoney(inv.currency, inv.total) + '</td>' +
        '<td data-label="Sales Exec."><span class="eq-exec"><span class="eq-exec-avatar">' + initials(inv.exec) + '</span>' + inv.exec + '</span></td>' +
        '<td data-label="Paid Date">' + fmtDate(inv.paidDate) + '</td>' +
        '<td data-label="" class="actions"><div class="eq-row-actions">' + buildActions(inv) + '</div></td>' +
      '</tr>';
  }

  function renderTotals(filtered) {
    var preTax = 0, vat = 0, total = 0;
    filtered.forEach(function (inv) {
      if (inv.currency === 'AED') { preTax += inv.preTax; vat += inv.vat; total += inv.total; }
    });
    els.tfoot.hidden = filtered.length === 0;
    if (els.tfoot.hidden) return;
    setText('tot-pretax', 'AED ' + fmtNum(preTax));
    setText('tot-vat', 'AED ' + fmtNum(vat));
    setText('tot-total', 'AED ' + fmtNum(total));
  }

  /* ---------- filter chips ---------- */
  function activeFilters() {
    return {
      Search: els.search.value.trim(),
      Year: els.year.value,
      Status: els.status.value,
      Division: els.division.value,
      Customer: els.customer.value
    };
  }
  function renderChips() {
    var f = activeFilters();
    var html = '<span>Active filters:</span>';
    Object.keys(f).forEach(function (k) {
      var v = f[k];
      if (!v) return;
      html += '<span class="eq-filter-chip" data-chip="' + k + '">' + k + ': ' + v +
              '<button type="button" title="Remove ' + k + ' filter">&times;</button></span>';
    });
    els.chips.innerHTML = html;
    els.chips.hidden = Object.keys(f).filter(function (k) { return f[k]; }).length === 0;
  }

  /* ---------- pagination ---------- */
  var ROWS_ON_PAGE_SET = [10, 25, 50];
  function pageItem(page, label, extraClass) {
    return '<li class="page-item' + (extraClass ? ' ' + extraClass : '') + '" data-page="' + page + '">' +
             '<a class="page-link" style="cursor: pointer">' + label + '</a></li>';
  }
  function renderPagination(totalItems) {
    var lastPage = Math.max(1, Math.ceil(totalItems / state.pageSize));
    var active = state.page, html = '';
    if (totalItems > state.pageSize) {
      html += '<ul class="pagination">';
      html += pageItem(1, '&laquo;', active <= 1 ? 'disabled' : '');
      if (active > 4 && active + 1 > lastPage) html += pageItem(active - 4, active - 4);
      if (active > 3 && active + 2 > lastPage) html += pageItem(active - 3, active - 3);
      if (active > 2) html += pageItem(active - 2, active - 2);
      if (active > 1) html += pageItem(active - 1, active - 1);
      html += pageItem(active, active, 'active');
      if (active + 1 <= lastPage) html += pageItem(active + 1, active + 1);
      if (active + 2 <= lastPage) html += pageItem(active + 2, active + 2);
      if (active + 3 <= lastPage && active < 3) html += pageItem(active + 3, active + 3);
      if (active + 4 <= lastPage && active < 2) html += pageItem(active + 4, active + 4);
      html += pageItem(lastPage, '&raquo;', active >= lastPage ? 'disabled' : '');
      html += '</ul>';
    }
    if (totalItems > ROWS_ON_PAGE_SET[0]) {
      html += '<ul class="pagination pull-right float-sm-right">';
      ROWS_ON_PAGE_SET.forEach(function (rows) {
        html += '<li class="page-item' + (state.pageSize === rows ? ' active' : '') + '" data-rows="' + rows + '">' +
                  '<a class="page-link" style="cursor: pointer">' + rows + '</a></li>';
      });
      html += '</ul>';
    }
    els.pagination.innerHTML = html;
  }

  function render() {
    var filtered = getSorted(getFiltered());
    renderChips();

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
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageItems = filtered.slice(start, start + state.pageSize);

    els.tbody.innerHTML = pageItems.map(buildRow).join('');
    els.count.textContent = filtered.length + ' invoice' + (filtered.length === 1 ? '' : 's');
    renderTotals(filtered);
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
  function populateCustomers() {
    var seen = {};
    invoices.forEach(function (inv) { seen[inv.customer] = true; });
    Object.keys(seen).sort().forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      els.customer.appendChild(opt);
    });
  }

  function clearFilters() {
    els.search.value = '';
    els.year.value = '';
    els.status.value = '';
    els.division.value = '';
    els.customer.value = '';
    state.page = 1;
    render();
  }
  function removeChip(name) {
    if (name === 'Search') els.search.value = '';
    if (name === 'Year') els.year.value = '';
    if (name === 'Status') els.status.value = '';
    if (name === 'Division') els.division.value = '';
    if (name === 'Customer') els.customer.value = '';
    state.page = 1;
    render();
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function showToast(message) {
    els.toast.textContent = message + ' — not wired up in this prototype.';
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2200);
  }

  /* ---------- events ---------- */
  function attachListeners() {
    ['input', 'change'].forEach(function (ev) {
      [els.search, els.year, els.status, els.division, els.customer].forEach(function (el) {
        el.addEventListener(ev, function () { state.page = 1; render(); });
      });
    });
    els.clear.addEventListener('click', clearFilters);
    els.emptyClear.addEventListener('click', clearFilters);

    els.chips.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-chip]');
      if (chip) removeChip(chip.getAttribute('data-chip'));
    });

    els.headers.forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = key; state.sortDir = 'asc'; }
        render();
      });
    });

    els.pagination.addEventListener('click', function (e) {
      var item = e.target.closest('.page-item');
      if (!item || item.classList.contains('disabled')) return;
      if (item.hasAttribute('data-rows')) { state.pageSize = parseInt(item.getAttribute('data-rows'), 10); state.page = 1; }
      else if (item.hasAttribute('data-page')) state.page = parseInt(item.getAttribute('data-page'), 10);
      render();
    });

    // kebab menus: open/close + outside click
    document.addEventListener('click', function (e) {
      var kebab = e.target.closest('[data-kebab]');
      if (kebab) {
        e.stopPropagation();
        var host = kebab.parentElement;
        var open = host.classList.contains('open');
        document.querySelectorAll('.eq-kebab.open').forEach(function (h) { h.classList.remove('open'); });
        if (!open) host.classList.add('open');
        return;
      }
      document.querySelectorAll('.eq-kebab.open').forEach(function (h) { h.classList.remove('open'); });

      var target = e.target.closest('[data-coming-soon]');
      if (target) { e.preventDefault(); showToast(target.getAttribute('data-coming-soon')); return; }

      var pay = e.target.closest('[data-payment]');
      if (pay) { e.preventDefault(); showToast('Record payment for ' + pay.getAttribute('data-payment')); }
    });
  }

  function init() {
    populateYears();
    populateCustomers();
    attachListeners();
    computeKpis();
    setTimeout(function () {
      els.skeleton.hidden = true;
      render();
    }, 400);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
