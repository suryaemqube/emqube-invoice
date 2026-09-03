/*
  EmQube Invoice — Quote / Proforma List REVISED — prototype behaviour
  =====================================================================
  Power for quotes-revised.html. Mirrors the revised Invoice list UX but:

    1. NO KPI cards (quotes have no payment/outstanding semantics).
    2. NO status column — quotes carry no confirmed accepted/rejected/
       converted status (do not invent one). Instead a 'Type' column shows a
       document-type badge: Proforma (type 2 → green) / Quote (amber),
       matching the current app's badge colours.
    3. Filter facets are Year / Type / Division / Customer (no Status).
    4. One product per quote (the list API exposes a single ProductName).

  Reused from the invoice list:
    - Collapsible filter panel with active-filter-count badge + removable chips.
    - Merged 'Customer / Products' column (customer link + bulleted product).
    - Reprioritised columns, bolded Total, First L. sales-exec.
    - Upfront icon actions: Copy (icon-docs) + Print (icon-printer).
*/
(function () {
  'use strict';

  // [number, quoteDate(DD-MM-YYYY), customer, currency, preTax, total, type, product]
  var RAW = [
    ['Q-2026-101', '01-09-2026', 'Motor Vehicle Trading Company (BMW)', 'AED', 124000, 130200, 'Proforma', 'Corporate Portal Build'],
    ['Q-2026-100', '28-08-2026', 'Dewan Motors (BMW)', 'AED', 45600, 47880, 'Quote', 'Showroom Web Portal'],
    ['Q-2026-099', '27-08-2026', 'Euro Motors (BMW)', 'AED', 22000, 23100, 'Quote', 'Parts e-Commerce Site'],
    ['Q-2026-098', '24-08-2026', 'Atheeqe Ansari (Q2)', 'AED', 9800, 10290, 'Proforma', 'Website AMC Q3'],
    ['Q-2026-097', '22-08-2026', 'BMW AG (F49WPJF)', 'AED', 48898.5, 51343.43, 'Quote', 'Portal Development'],
    ['Q-2026-096', '19-08-2026', 'Arabian Gulf Mechanical Centre LLC', 'AED', 35294, 37058.7, 'Proforma', 'CRM Integration'],
    ['Q-2026-095', '17-08-2026', 'Karam Food Industries Co LLC', 'AED', 8250, 8662.5, 'Quote', 'Production website'],
    ['Q-2026-094', '13-08-2026', 'Innerspace Trading LLC', 'AED', 3500, 3675, 'Quote', 'Email Migration'],
    ['Q-2026-093', '11-08-2026', 'Sentinel Ventures FZ-LLC', 'AED', 3000, 3150, 'Proforma', 'WhatsApp Chatbot'],
    ['Q-2026-092', '07-08-2026', 'Emovers International Logistics', 'AED', 7500, 7500, 'Quote', 'Digital Q3 2026'],
    ['Q-2026-091', '06-08-2026', 'The Leaders Organization DMCC', 'AED', 16750, 17587.5, 'Quote', 'Digital Q3 2026'],
    ['Q-2026-090', '05-08-2026', 'ELECTRICWAY-FZCO', 'AED', 21200, 22260, 'Proforma', 'Digital Q3 2026'],
    ['Q-2026-089', '04-08-2026', 'Executive Movers', 'AED', 27350, 27350, 'Quote', 'Digital Q3 2026'],
    ['Q-2026-088', '31-07-2026', 'E-Movers LLC', 'AED', 47600, 49980, 'Quote', 'Digital Q3 2026'],
    ['Q-2026-087', '29-07-2026', 'Distance Learning Providers', 'USD', 5271, 5271, 'Proforma', 'Learning Mgmt AMC'],
    ['Q-2026-086', '27-07-2026', 'E-Movers LLC', 'AED', 10115, 10620.75, 'Quote', 'HRMS-Finance CR'],
    ['Q-2026-085', '24-07-2026', 'Executive Movers', 'AED', 2750, 2750, 'Quote', 'Software AMC Q3'],
    ['Q-2026-084', '21-07-2026', 'E-Movers LLC', 'AED', 33480, 35154, 'Proforma', 'Software AMC Q3'],
    ['Q-2026-083', '20-07-2026', 'E-Movers LLC', 'AED', 3000, 3150, 'Quote', 'SalesIQ License'],
    ['Q-2026-082', '17-07-2026', 'Paramount Sovereign Trading L.L.C', 'AED', 2000, 2100, 'Proforma', 'B2B Catalogue'],
    ['Q-2026-081', '16-07-2026', 'The Total Office LLC', 'AED', 850, 892.5, 'Quote', 'New User Dashboard'],
    ['Q-2026-080', '14-07-2026', 'Nikai Gulf FZE', 'AED', 6500, 6825, 'Quote', 'Catalogue Update'],
    ['Q-2026-079', '10-07-2026', 'Crescent General Trading L.L.C', 'AED', 6000, 6300, 'Proforma', 'AMC 2026'],
    ['Q-2026-078', '08-07-2026', 'Orient Financial Brokers', 'AED', 6000, 6300, 'Quote', 'Digital Q2'],
    ['Q-2026-077', '06-07-2026', 'E-Movers LLC', 'AED', 19000, 19950, 'Quote', 'Automated Invoicing'],
    ['Q-2026-076', '30-06-2026', 'Karam Food Industries Co LLC', 'AED', 8250, 8662.5, 'Proforma', 'Production website'],
    ['Q-2026-075', '29-06-2026', 'Zoho Software Trading L.L.C', 'AED', 2104.78, 2210.02, 'Quote', 'Zoho Consulting'],
    ['Q-2026-074', '26-06-2026', 'ELECTRICWAY-FZCO', 'AED', 21200, 22260, 'Quote', 'Digital Q2 2026'],
    ['Q-2026-073', '25-06-2026', 'Executive Movers', 'AED', 27350, 27350, 'Proforma', 'Digital Q2 2026'],
    ['Q-2026-072', '24-06-2026', 'E-Movers LLC', 'AED', 47600, 49980, 'Quote', 'Digital Q2 2026']
  ];

  var DIVISIONS = ['Web', 'Software'];
  var EXECS = ['Alia R.', 'Omar K.', 'Fatima S.'];

  function toISO(ddmmyyyy) {
    if (!ddmmyyyy) return null;
    var p = ddmmyyyy.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }

  var quotes = RAW.map(function (r, idx) {
    return {
      number: r[0],
      quoteDate: toISO(r[1]),
      customer: r[2],
      currency: r[3],
      preTax: r[4],
      total: r[5],
      vat: Math.round((r[5] - r[4]) * 100) / 100,
      type: r[6],
      product: r[7] || '',
      division: DIVISIONS[idx % DIVISIONS.length],
      exec: EXECS[idx % EXECS.length]
    };
  });

  var els = {
    search: document.getElementById('inv-search'),
    filterToggle: document.getElementById('inv-filter-toggle'),
    filterToggleIcon: document.getElementById('inv-filter-toggle-icon'),
    filterCount: document.getElementById('inv-filter-count'),
    facets: document.getElementById('inv-facets'),
    year: document.getElementById('inv-year'),
    type: document.getElementById('inv-type'),
    division: document.getElementById('inv-division'),
    customer: document.getElementById('inv-customer'),
    clear: document.getElementById('inv-clear'),
    emptyClear: document.getElementById('inv-empty-clear'),
    chips: document.getElementById('inv-chips'),
    skeleton: document.getElementById('inv-skeleton'),
    tableWrap: document.getElementById('inv-table-wrap'),
    tbody: document.getElementById('inv-tbody'),
    count: document.getElementById('inv-count'),
    pagination: document.getElementById('inv-pagination'),
    empty: document.getElementById('inv-empty'),
    toast: document.getElementById('eq-toast'),
    headers: document.querySelectorAll('#inv-table th[data-sort]')
  };

  var state = { sortKey: 'quoteDate', sortDir: 'desc', page: 1, pageSize: 25, filtersOpen: false };

  function fmtMoney(currency, amount) {
    return currency + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    var d = parseInt(parts[2], 10);
    var m = MONTHS[parseInt(parts[1], 10) - 1];
    return (d < 10 ? '0' + d : d) + ' ' + m + ' ' + parts[0];
  }

  /* ---------- filter / search ---------- */
  function getFiltered() {
    var q = (els.search.value || '').trim().toLowerCase();
    var year = els.year.value;
    var type = els.type.value;
    var division = els.division.value;
    var customer = els.customer.value;
    return quotes.filter(function (qte) {
      if (q) {
        var hay = (qte.number + ' ' + qte.customer + ' ' + qte.exec + ' ' + qte.division + ' ' + qte.product).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (year && qte.quoteDate.slice(0, 4) !== year) return false;
      if (type && qte.type !== type) return false;
      if (division && qte.division !== division) return false;
      if (customer && qte.customer !== customer) return false;
      return true;
    });
  }

  /* ---------- sorting ---------- */
  function getSorted(list) {
    var key = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = a[key], bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv)) * dir;
    });
  }

  /* ---------- cell builders ---------- */
  // type badge: Proforma (type 2) in green / Quote in amber — matches the
  // current app's badge colours; NOT a status (quotes have none).
  function typeCell(qte) {
    var prose = qte.type === 'Proforma';
    return '<span class="eq-type-badge ' + (prose ? 'eq-type-proforma' : 'eq-type-quote') + '">' + qte.type + '</span>';
  }

  function itemCell(qte) {
    if (!qte.product) return '';
    return '<ul class="eq-item-list"><li>' +
           '<span class="eq-item-bullet">&bull;</span>' +
           '<span class="eq-item-text">' + qte.product + '</span>' +
           '</li></ul>';
  }

  function buildActions(qte) {
    var html = '<div class="eq-row-actions">';
    html += '<button type="button" class="eq-icon-btn" title="Copy ' + qte.number + '" data-coming-soon="Copy ' + qte.number + '"><i class="icon-docs"></i></button>';
    html += '<button type="button" class="eq-icon-btn" title="Print ' + qte.number + '" data-coming-soon="Print ' + qte.number + '"><i class="icon-printer"></i></button>';
    html += '</div>';
    return html;
  }

  function buildRow(qte) {
    var customer = qte.customer.replace(/"/g, '&quot;');
    return '' +
      '<tr>' +
        '<td data-label="Quote / Proforma" class="mono"><span class="eq-inv-no">' + qte.number + '</span></td>' +
        '<td data-label="Type">' + typeCell(qte) + '</td>' +
        '<td data-label="Date">' + fmtDate(qte.quoteDate) + '</td>' +
        '<td data-label="Customer / Products">' +
          '<a class="eq-customer-link" href="create-quote.html" title="' + customer + '">' + qte.customer + '</a>' +
          itemCell(qte) +
        '</td>' +
        '<td data-label="Pre-Tax" class="num">' + fmtMoney(qte.currency, qte.preTax) + '</td>' +
        '<td data-label="VAT" class="num">' + fmtMoney(qte.currency, qte.vat) + '</td>' +
        '<td data-label="Total" class="num col-total-cell">' + fmtMoney(qte.currency, qte.total) + '</td>' +
        '<td data-label="Sales Exec."><span class="eq-exec">' + qte.exec + '</span></td>' +
        '<td data-label="" class="actions">' + buildActions(qte) + '</td>' +
      '</tr>';
  }

  /* ---------- filter toggle + chips ---------- */
  function facetValues() {
    return { Search: els.search.value.trim(), Year: els.year.value, Type: els.type.value, Division: els.division.value, Customer: els.customer.value };
  }
  function activeFacetCount() {
    var f = facetValues();
    return Object.keys(f).reduce(function (n, k) { return n + (k !== 'Search' && f[k] ? 1 : 0); }, 0);
  }
  function renderFilterToggle() {
    var count = activeFacetCount();
    els.filterCount.hidden = count === 0;
    els.filterCount.textContent = count;
    if (count > 0) { els.filterToggle.classList.add('is-active'); } else { els.filterToggle.classList.remove('is-active'); }
  }
  function renderChips() {
    var f = facetValues();
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
  function toggleFilters() {
    state.filtersOpen = !state.filtersOpen;
    els.facets.hidden = !state.filtersOpen;
    els.filterToggle.setAttribute('aria-expanded', String(state.filtersOpen));
    els.filterToggleIcon.className = state.filtersOpen ? 'icon-minus' : 'icon-options';
    els.filterToggle.title = state.filtersOpen ? 'Hide filters' : 'Show / hide filters';
  }

  /* ---------- pagination ---------- */
  var ROWS_ON_PAGE_SET = [25, 50, 100];
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
    renderFilterToggle();
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
    els.count.textContent = filtered.length + ' quote' + (filtered.length === 1 ? '' : 's') + ' / proforma' + (filtered.length === 1 ? '' : 's');
    renderPagination(filtered.length);
  }

  function populateYears() {
    var years = {};
    quotes.forEach(function (qte) { years[qte.quoteDate.slice(0, 4)] = true; });
    Object.keys(years).sort().reverse().forEach(function (y) {
      var opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      els.year.appendChild(opt);
    });
  }
  function populateCustomers() {
    var seen = {};
    quotes.forEach(function (qte) { seen[qte.customer] = true; });
    Object.keys(seen).sort().forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      els.customer.appendChild(opt);
    });
  }

  function clearFilters() {
    els.search.value = '';
    els.year.value = '';
    els.type.value = '';
    els.division.value = '';
    els.customer.value = '';
    state.page = 1;
    render();
  }
  function removeChip(name) {
    if (name === 'Search') els.search.value = '';
    if (name === 'Year') els.year.value = '';
    if (name === 'Type') els.type.value = '';
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
    els.filterToggle.addEventListener('click', toggleFilters);

    ['input', 'change'].forEach(function (ev) {
      [els.search, els.year, els.type, els.division, els.customer].forEach(function (el) {
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

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a.eq-customer-link');
      if (link) { e.preventDefault(); showToast('Open quote for ' + link.getAttribute('title')); return; }

      var target = e.target.closest('[data-coming-soon]');
      if (target) { e.preventDefault(); showToast(target.getAttribute('data-coming-soon')); }
    });
  }

  function init() {
    populateYears();
    populateCustomers();
    attachListeners();
    setTimeout(function () {
      els.skeleton.hidden = true;
      render();
    }, 400);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
