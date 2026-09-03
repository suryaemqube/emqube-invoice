/*
  EmQube Invoice — Customers screen (prototype)
  Vanilla JS only, no framework/build dependency. Search, sort, filter and
  pagination all run client-side over the in-memory array below. No network
  requests are made and no backend logic was introduced or changed.

  Data: the 9 rows are the exact rows shown in the screenshot supplied for
  this screen — no additional customers were invented to pad the list.
  Row 1 ("3 S Middle East Services LLC") also carries the full detail
  supplied in the "Add Customer/Prospect" edit screenshot (billing address,
  currency, phone, customer code, registered) so the Edit modal has one
  fully realistic example. Every other row falls back to placeholder
  billing/shipping detail since that wasn't supplied — clearly not real
  data, and never claimed to be.
*/
(function () {
  'use strict';

  var customers = [
    {
      name: '3 S Middle East Services LLC', firstName: 'Varun', lastName: 'Jaitly',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Active', type: 'Customer',
      isIndividual: false,
      billing: { address: 'Office No. 2205, 22nd Floor, Dubai', city: 'Dubai', zip: '231400', country: '1', state: '1' },
      currency: '1', designation: 'General Manager', phone: '+971 43955747', email: '', web: '',
      customerCode: '3 S Middle', registered: true, taxNo: ''
    },
    {
      name: 'A F Marzooqi Trading', firstName: 'Sunil', lastName: 'Talreja',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Active', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'ABF Resourcing', firstName: 'Mr. Bilal', lastName: 'Oomer',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Inactive', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'ABQ Zawya LLC', firstName: 'Mubarak', lastName: 'Hussain',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Inactive', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'Abra Visual Merchandise & Store Design LLC', firstName: 'Indu', lastName: '',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Active', type: 'Customer',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'Abu Baker Salem Advocates & Legal Consultants', firstName: 'Ahmed', lastName: 'Odeh',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Inactive', type: 'Customer',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'Abu Dhabi Motors (BMW)', firstName: 'Hussam Tareq', lastName: 'Zarqa',
      city: 'Abu Dhabi', country: 'United Arab Emirates', status: 'Active', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Abu Dhabi', zip: '', country: '1', state: '2' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'Acacia LLC', firstName: 'Haridas', lastName: 'K',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Inactive', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    },
    {
      name: 'Academy of Law', firstName: 'Salman', lastName: 'Shaukat',
      city: 'Dubai', country: 'United Arab Emirates', status: 'Inactive', type: 'Prospect',
      isIndividual: false,
      billing: { address: '', city: 'Dubai', zip: '', country: '1', state: '1' },
      currency: '1', designation: '', phone: '', email: '', web: '',
      customerCode: '', registered: false, taxNo: ''
    }
  ];

  var state = { search: '', status: '', type: '', sortKey: 'name', sortDir: 'asc', page: 1, pageSize: 8 };

  var els = {
    search: document.getElementById('cust-search'),
    status: document.getElementById('cust-status'),
    type: document.getElementById('cust-type'),
    clear: document.getElementById('cust-clear'),
    emptyClear: document.getElementById('cust-empty-clear'),
    skeleton: document.getElementById('cust-skeleton'),
    tableWrap: document.getElementById('cust-table-wrap'),
    tbody: document.getElementById('cust-tbody'),
    headers: document.querySelectorAll('#cust-table th[data-sort]'),
    empty: document.getElementById('cust-empty'),
    count: document.getElementById('cust-count'),
    pagination: document.getElementById('cust-pagination'),
    toast: document.getElementById('eq-toast'),
    addBtn: document.getElementById('cust-add-btn')
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getFiltered() {
    var q = state.search.trim().toLowerCase();
    return customers.filter(function (c) {
      if (state.status && c.status !== state.status) { return false; }
      if (state.type && c.type !== state.type) { return false; }
      if (q) {
        var hay = (c.name + ' ' + c.firstName + ' ' + c.lastName).toLowerCase();
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });
  }

  function getSorted(list) {
    var key = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
    var mapped = list.map(function (c) {
      var val;
      switch (key) {
        case 'contact': val = (c.firstName + ' ' + c.lastName).trim().toLowerCase(); break;
        case 'city': val = c.city.toLowerCase(); break;
        case 'country': val = c.country.toLowerCase(); break;
        case 'status': val = c.status.toLowerCase(); break;
        case 'type': val = c.type.toLowerCase(); break;
        default: val = c.name.toLowerCase();
      }
      return { c: c, v: val };
    });
    mapped.sort(function (a, b) { return a.v < b.v ? -1 * dir : a.v > b.v ? 1 * dir : 0; });
    return mapped.map(function (m) { return m.c; });
  }

  function rowHtml(c) {
    var statusBadge = c.status === 'Active' ? 'eq-badge-success' : 'eq-badge-neutral';
    var typeBadge = c.type === 'Customer' ? 'eq-badge-customer' : 'eq-badge-prospect';
    return '' +
      '<tr>' +
        '<td class="name">' + escapeHtml(c.name) + '</td>' +
        '<td>' + escapeHtml((c.firstName + ' ' + c.lastName).trim()) + '</td>' +
        '<td class="muted">' + escapeHtml(c.city) + '</td>' +
        '<td class="muted">' + escapeHtml(c.country) + '</td>' +
        '<td><span class="eq-badge ' + statusBadge + '">' + c.status + '</span></td>' +
        '<td><span class="eq-badge ' + typeBadge + '">' + c.type + '</span></td>' +
        '<td>' +
          '<div class="eq-row-actions">' +
            '<button type="button" class="eq-icon-btn" title="Edit ' + escapeHtml(c.name) + '" data-edit="' + escapeHtml(c.name) + '"><i class="icon-pencil"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
  }

  function buildPagination(total, page, pageSize) {
    var pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) { page = pages; }
    var html = '<ul class="pagination">';
    html += '<li class="page-item ' + (page === 1 ? 'disabled' : '') + '" data-page="' + (page - 1) + '"><a class="page-link">&laquo;</a></li>';
    for (var i = 1; i <= pages; i++) {
      html += '<li class="page-item ' + (i === page ? 'active' : '') + '" data-page="' + i + '"><a class="page-link">' + i + '</a></li>';
    }
    html += '<li class="page-item ' + (page === pages ? 'disabled' : '') + '" data-page="' + (page + 1) + '"><a class="page-link">&raquo;</a></li>';
    html += '</ul>';

    html += '<ul class="pagination pull-right">';
    [8, 25, 50].forEach(function (n) {
      html += '<li class="page-item ' + (n === pageSize ? 'active' : '') + '" data-rows="' + n + '"><a class="page-link">' + n + '</a></li>';
    });
    html += '</ul>';
    return html;
  }

  function render() {
    var filtered = getSorted(getFiltered());
    var total = filtered.length;

    els.headers.forEach(function (th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.getAttribute('data-sort') === state.sortKey) {
        th.classList.add(state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });

    if (total === 0) {
      els.tableWrap.hidden = true;
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;
    els.tableWrap.hidden = false;

    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > pages) { state.page = pages; }
    var start = (state.page - 1) * state.pageSize;
    var pageRows = filtered.slice(start, start + state.pageSize);

    els.tbody.innerHTML = pageRows.map(rowHtml).join('');
    els.count.textContent = total + (total === 1 ? ' customer' : ' customers');
    els.pagination.innerHTML = buildPagination(total, state.page, state.pageSize);
  }

  var toastTimer;
  function showToast(message) {
    els.toast.textContent = message + ' — not wired up in this prototype.';
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2200);
  }

  function clearFilters() {
    state.search = ''; state.status = ''; state.type = ''; state.page = 1;
    els.search.value = ''; els.status.value = ''; els.type.value = '';
    render();
  }

  /* ---------------- Add / Edit Customer modal ---------------- */
  var modal = document.getElementById('customerModal');
  var backdrop = document.getElementById('customerBackdrop');
  var modalTitle = document.getElementById('cust-modal-title');

  var f = {
    individual: document.getElementById('cust-individual'),
    prospect: document.getElementById('cust-prospect'),
    name: document.getElementById('cust-name'),
    billAddress: document.getElementById('cust-bill-address'),
    billCity: document.getElementById('cust-bill-city'),
    billZip: document.getElementById('cust-bill-zip'),
    billCountry: document.getElementById('cust-bill-country'),
    billState: document.getElementById('cust-bill-state'),
    currency: document.getElementById('cust-currency'),
    contactFirst: document.getElementById('cust-contact-first'),
    contactLast: document.getElementById('cust-contact-last'),
    designation: document.getElementById('cust-designation'),
    phone: document.getElementById('cust-phone'),
    email: document.getElementById('cust-email'),
    web: document.getElementById('cust-web'),
    statusSelect: document.getElementById('cust-status-select'),
    codeField: document.getElementById('cust-code-field'),
    code: document.getElementById('cust-code'),
    registered: document.getElementById('cust-registered'),
    taxnoRow: document.getElementById('cust-taxno-row'),
    taxno: document.getElementById('cust-taxno'),
    shipSame: document.getElementById('cust-ship-same'),
    shippingFields: document.getElementById('cust-shipping-fields')
  };

  function syncConditionalFields() {
    f.codeField.hidden = !!f.individual.checked;
    f.taxnoRow.hidden = !f.registered.checked;
    f.shippingFields.hidden = !!f.shipSame.checked;
  }

  function openModal(mode, customer) {
    modalTitle.textContent = mode === 'edit' ? 'Edit Customer/Prospect' : 'Add Customer/Prospect';

    f.individual.checked = customer ? !!customer.isIndividual : false;
    f.prospect.checked = customer ? customer.type === 'Prospect' : false;
    f.name.value = customer ? customer.name : '';
    f.billAddress.value = customer ? customer.billing.address : '';
    f.billCity.value = customer ? customer.billing.city : '';
    f.billZip.value = customer ? customer.billing.zip : '';
    f.billCountry.value = customer ? customer.billing.country : '1';
    f.billState.value = customer ? customer.billing.state : '1';
    f.currency.value = customer ? customer.currency : '1';
    f.contactFirst.value = customer ? customer.firstName : '';
    f.contactLast.value = customer ? customer.lastName : '';
    f.designation.value = customer ? customer.designation : '';
    f.phone.value = customer ? customer.phone : '';
    f.email.value = customer ? customer.email : '';
    f.web.value = customer ? customer.web : '';
    f.statusSelect.value = customer ? String(customer.status === 'Active') : 'true';
    f.code.value = customer ? customer.customerCode : '';
    f.registered.checked = customer ? !!customer.registered : false;
    f.taxno.value = customer ? customer.taxNo : '';
    f.shipSame.checked = true;

    syncConditionalFields();

    modal.classList.add('in');
    backdrop.classList.add('in');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('in');
    backdrop.classList.remove('in');
    document.body.classList.remove('modal-open');
  }

  function attachListeners() {
    els.search.addEventListener('input', function () { state.search = els.search.value; state.page = 1; render(); });
    els.status.addEventListener('change', function () { state.status = els.status.value; state.page = 1; render(); });
    els.type.addEventListener('change', function () { state.type = els.type.value; state.page = 1; render(); });
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

    els.addBtn.addEventListener('click', function () { openModal('add', null); });

    els.tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-edit]');
      if (!btn) { return; }
      var name = btn.getAttribute('data-edit');
      var customer = customers.filter(function (c) { return c.name === name; })[0];
      if (customer) { openModal('edit', customer); }
    });

    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-coming-soon]');
      if (!target) { return; }
      e.preventDefault();
      showToast(target.getAttribute('data-coming-soon'));
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]') || e.target.id === 'customerBackdrop') {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); }
    });

    f.individual.addEventListener('change', syncConditionalFields);
    f.registered.addEventListener('change', syncConditionalFields);
    f.shipSame.addEventListener('change', syncConditionalFields);
  }

  function init() {
    attachListeners();
    setTimeout(function () {
      els.skeleton.hidden = true;
      render();
    }, 550);
  }

  init();
})();
