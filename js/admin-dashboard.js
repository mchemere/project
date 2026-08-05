(function () {
  'use strict';

  const users = [
    { id: 1, name: 'Jane Njeri', email: 'jane@example.com', role: 'Tenant', registered: '2026-07-12', status: 'Active' },
    { id: 2, name: 'Peter Kimani', email: 'peter@example.com', role: 'Landlord', registered: '2026-07-08', status: 'Active' },
    { id: 3, name: 'Amina Hassan', email: 'amina@example.com', role: 'Tenant', registered: '2026-06-30', status: 'Suspended' },
    { id: 4, name: 'Brian Otieno', email: 'brian@example.com', role: 'Landlord', registered: '2026-06-21', status: 'Active' },
    { id: 5, name: 'Faith Wanjiru', email: 'faith@example.com', role: 'Tenant', registered: '2026-06-15', status: 'Active' },
    { id: 6, name: 'David Mwangi', email: 'david@example.com', role: 'Landlord', registered: '2026-05-28', status: 'Suspended' },
  ];

  const properties = [
    { id: 1, title: 'Modern 2 Bedroom Apartment', owner: 'Peter Kimani', location: 'Kisumu, Mamboleo', price: 25000, status: 'Active', approval: 'Approved', submitted: '2026-07-02' },
    { id: 2, title: 'Cozy Family House', owner: 'Brian Otieno', location: 'Nairobi, Kileleshwa', price: 42000, status: 'Active', approval: 'Approved', submitted: '2026-06-28' },
    { id: 3, title: 'Beachside Studio', owner: 'David Mwangi', location: 'Mombasa, Nyali', price: 18000, status: 'Inactive', approval: 'Approved', submitted: '2026-06-20' },
    { id: 4, title: 'Affordable 1 Bedroom Unit', owner: 'Peter Kimani', location: 'Nakuru, Milimani', price: 15500, status: 'Active', approval: 'Pending', submitted: '2026-07-10' },
    { id: 5, title: 'Luxury 3 Bedroom Home', owner: 'Brian Otieno', location: 'Eldoret, Kapsoya', price: 36000, status: 'Active', approval: 'Approved', submitted: '2026-07-01' },
    { id: 6, title: 'City Center Loft', owner: 'Amina Hassan', location: 'Nairobi, CBD', price: 30000, status: 'Inactive', approval: 'Rejected', submitted: '2026-06-25' },
    { id: 7, title: 'Garden Villa', owner: 'Faith Wanjiru', location: 'Kisumu, Milimani', price: 50000, status: 'Active', approval: 'Pending', submitted: '2026-07-12' },
  ];

  const reports = [
    { id: 1, property: 'Luxury 3 Bedroom Home', reason: 'Misleading listing', reporter: 'Esther', date: '2026-07-13' },
    { id: 2, property: 'City Center Loft', reason: 'Incorrect pricing', reporter: 'Kevin', date: '2026-07-11' },
    { id: 3, property: 'Modern 2 Bedroom Apartment', reason: 'Fake photos', reporter: 'Lucy', date: '2026-07-09' },
  ];

  const elements = {
    stats: {
      totalUsers: document.getElementById('statTotalUsers'),
      totalProperties: document.getElementById('statTotalProperties'),
      activeListings: document.getElementById('statActiveListings'),
      pendingApprovals: document.getElementById('statPendingApprovals'),
      reportedListings: document.getElementById('statReportedListings'),
    },
    dashboardUsersBody: document.getElementById('dashboardUsersBody'),
    usersBody: document.getElementById('usersTableBody'),
    userSearch: document.getElementById('userSearch'),
    userRoleFilter: document.getElementById('userRoleFilter'),
    userStatusFilter: document.getElementById('userStatusFilter'),
    propertiesBody: document.getElementById('propertiesTableBody'),
    propertySearch: document.getElementById('propertySearch'),
    propertyStatusFilter: document.getElementById('propertyStatusFilter'),
    propertyApprovalFilter: document.getElementById('propertyApprovalFilter'),
    approvalsBody: document.getElementById('approvalsTableBody'),
    approvalSearch: document.getElementById('approvalSearch'),
    reportsBody: document.getElementById('reportsTableBody'),
    reportSearch: document.getElementById('reportSearch'),
    reportReasonFilter: document.getElementById('reportReasonFilter'),
    settingsForm: document.getElementById('settingsForm'),
  };

  const confirmModal = {
    overlay: document.getElementById('confirmModal'),
    title: document.getElementById('confirmTitle'),
    message: document.getElementById('confirmMessage'),
    cancel: document.getElementById('modalCancel'),
    confirm: document.getElementById('modalConfirm'),
  };

  const viewModal = {
    overlay: document.getElementById('viewModal'),
    details: document.getElementById('viewDetails'),
    close: document.getElementById('viewClose'),
    cancel: document.getElementById('viewCancel'),
  };

  const toastEl = document.getElementById('toast');

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch]);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getInitials(name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ------------------------------ Stats ------------------------------ */
  function renderStats() {
    elements.stats.totalUsers.textContent = users.length;
    elements.stats.totalProperties.textContent = properties.length;
    elements.stats.activeListings.textContent = properties.filter((p) => p.status === 'Active').length;
    elements.stats.pendingApprovals.textContent = properties.filter((p) => p.approval === 'Pending').length;
    elements.stats.reportedListings.textContent = reports.length;
  }

  /* ------------------------------ Users ------------------------------ */
  function userRowHtml(user) {
    const suspendLabel = user.status === 'Active' ? 'Suspend' : 'Reactivate';
    return `
      <tr data-user-id="${user.id}">
        <td>
          <div class="user-cell">
            <span class="avatar">${escapeHtml(getInitials(user.name))}</span>
            <div>
              <div class="user-name">${escapeHtml(user.name)}</div>
              <div class="user-email">${escapeHtml(user.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(user.role)}</td>
        <td>${formatDate(user.registered)}</td>
        <td><span class="badge badge-${user.status.toLowerCase()}">${escapeHtml(user.status)}</span></td>
        <td>
          <div class="actions-group">
            <button class="btn btn-secondary btn-small btn-action" data-action="view" data-id="${user.id}">View</button>
            <button class="btn btn-secondary btn-small btn-action" data-action="suspend" data-id="${user.id}">${suspendLabel}</button>
            <button class="btn btn-danger btn-small btn-action" data-action="delete" data-id="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  function userSummaryRowHtml(user) {
    return `
      <tr>
        <td>
          <div class="user-cell">
            <span class="avatar">${escapeHtml(getInitials(user.name))}</span>
            <div>
              <div class="user-name">${escapeHtml(user.name)}</div>
              <div class="user-email">${escapeHtml(user.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(user.role)}</td>
        <td>${formatDate(user.registered)}</td>
        <td><span class="badge badge-${user.status.toLowerCase()}">${escapeHtml(user.status)}</span></td>
      </tr>
    `;
  }

  function getFilteredUsers() {
    const search = (elements.userSearch.value || '').toLowerCase().trim();
    const role = elements.userRoleFilter.value;
    const status = elements.userStatusFilter.value;

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesRole = !role || user.role === role;
      const matchesStatus = !status || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  function renderUsers() {
    const list = getFilteredUsers();
    if (!list.length) {
      elements.usersBody.innerHTML = '<tr><td colspan="6"><div class="table-empty">No users match your filters.</div></td></tr>';
      return;
    }
    elements.usersBody.innerHTML = list.map(userRowHtml).join('');
  }

  function renderDashboardUsers() {
    const recent = [...users].sort((a, b) => new Date(b.registered) - new Date(a.registered)).slice(0, 5);
    if (!recent.length) {
      elements.dashboardUsersBody.innerHTML = '<tr><td colspan="4"><div class="table-empty">No users yet.</div></td></tr>';
      return;
    }
    elements.dashboardUsersBody.innerHTML = recent.map(userSummaryRowHtml).join('');
  }

  /* ---------------------------- Properties --------------------------- */
  function propertyBadges(property) {
    return `
      <span class="badge badge-${property.status.toLowerCase()}">${escapeHtml(property.status)}</span>
      <span class="badge badge-${property.approval.toLowerCase()}">${escapeHtml(property.approval)}</span>
    `;
  }

  function propertyRowHtml(property) {
    return `
      <tr data-property-id="${property.id}">
        <td><strong>${escapeHtml(property.title)}</strong></td>
        <td>${escapeHtml(property.owner)}</td>
        <td>${escapeHtml(property.location)}</td>
        <td>${formatCurrency(property.price)}/month</td>
        <td>${propertyBadges(property)}</td>
        <td>
          <div class="actions-group">
            <button class="btn btn-approve btn-small btn-action" data-action="approve" data-id="${property.id}">Approve</button>
            <button class="btn btn-reject btn-small btn-action" data-action="reject" data-id="${property.id}">Reject</button>
            <button class="btn btn-danger btn-small btn-action" data-action="remove" data-id="${property.id}">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }

  function getFilteredProperties() {
    const search = (elements.propertySearch.value || '').toLowerCase().trim();
    const status = elements.propertyStatusFilter.value;
    const approval = elements.propertyApprovalFilter.value;

    return properties.filter((property) => {
      const matchesSearch =
        !search ||
        property.title.toLowerCase().includes(search) ||
        property.owner.toLowerCase().includes(search) ||
        property.location.toLowerCase().includes(search);
      const matchesStatus = !status || property.status === status;
      const matchesApproval = !approval || property.approval === approval;
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }

  function renderProperties() {
    const list = getFilteredProperties();
    if (!list.length) {
      elements.propertiesBody.innerHTML = '<tr><td colspan="6"><div class="table-empty">No properties match your filters.</div></td></tr>';
      return;
    }
    elements.propertiesBody.innerHTML = list.map(propertyRowHtml).join('');
  }

  /* ----------------------------- Approvals --------------------------- */
  function approvalRowHtml(property) {
    return `
      <tr data-property-id="${property.id}">
        <td><strong>${escapeHtml(property.title)}</strong></td>
        <td>${escapeHtml(property.owner)}</td>
        <td>${escapeHtml(property.location)}</td>
        <td>${formatCurrency(property.price)}/month</td>
        <td>${formatDate(property.submitted)}</td>
        <td>
          <div class="actions-group">
            <button class="btn btn-approve btn-small btn-action" data-action="approve" data-id="${property.id}">Approve</button>
            <button class="btn btn-reject btn-small btn-action" data-action="reject" data-id="${property.id}">Reject</button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderApprovals() {
    const search = (elements.approvalSearch.value || '').toLowerCase().trim();
    const list = properties.filter(
      (p) => p.approval === 'Pending' && (!search || p.title.toLowerCase().includes(search) || p.owner.toLowerCase().includes(search)),
    );

    if (!list.length) {
      elements.approvalsBody.innerHTML = '<tr><td colspan="6"><div class="table-empty">No pending approvals.</div></td></tr>';
      return;
    }
    elements.approvalsBody.innerHTML = list.map(approvalRowHtml).join('');
  }

  /* ------------------------------ Reports ---------------------------- */
  function reportRowHtml(report) {
    return `
      <tr data-report-id="${report.id}">
        <td><strong>${escapeHtml(report.property)}</strong></td>
        <td>${escapeHtml(report.reason)}</td>
        <td>${escapeHtml(report.reporter)}</td>
        <td>${formatDate(report.date)}</td>
        <td>
          <div class="actions-group">
            <button class="btn btn-danger btn-small btn-action" data-action="remove-property" data-id="${report.id}">Remove Property</button>
            <button class="btn btn-secondary btn-small btn-action" data-action="dismiss" data-id="${report.id}">Dismiss</button>
          </div>
        </td>
      </tr>
    `;
  }

  function getFilteredReports() {
    const search = (elements.reportSearch.value || '').toLowerCase().trim();
    const reason = elements.reportReasonFilter.value;

    return reports.filter((report) => {
      const matchesSearch =
        !search ||
        report.property.toLowerCase().includes(search) ||
        report.reason.toLowerCase().includes(search) ||
        report.reporter.toLowerCase().includes(search);
      const matchesReason = !reason || report.reason === reason;
      return matchesSearch && matchesReason;
    });
  }

  function renderReports() {
    const list = getFilteredReports();
    if (!list.length) {
      elements.reportsBody.innerHTML = '<tr><td colspan="5"><div class="table-empty">No reports match your filters.</div></td></tr>';
      return;
    }
    elements.reportsBody.innerHTML = list.map(reportRowHtml).join('');
  }

  function populateReportReasons() {
    const reasons = [...new Set(reports.map((r) => r.reason))];
    reasons.forEach((reason) => {
      const option = document.createElement('option');
      option.value = reason;
      option.textContent = reason;
      elements.reportReasonFilter.appendChild(option);
    });
  }

  /* ------------------------------ Modals ----------------------------- */
  let confirmCallback = null;

  function openConfirm(title, message, onConfirm) {
    confirmModal.title.textContent = title;
    confirmModal.message.textContent = message;
    confirmCallback = onConfirm;
    confirmModal.overlay.classList.add('open');
  }

  function closeConfirm() {
    confirmModal.overlay.classList.remove('open');
    confirmCallback = null;
  }

  function openViewUser(user) {
    viewModal.details.innerHTML = `
      <div class="detail-row"><dt>Name</dt><dd>${escapeHtml(user.name)}</dd></div>
      <div class="detail-row"><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
      <div class="detail-row"><dt>Role</dt><dd>${escapeHtml(user.role)}</dd></div>
      <div class="detail-row"><dt>Registered</dt><dd>${formatDate(user.registered)}</dd></div>
      <div class="detail-row"><dt>Status</dt><dd><span class="badge badge-${user.status.toLowerCase()}">${escapeHtml(user.status)}</span></dd></div>
    `;
    viewModal.overlay.classList.add('open');
  }

  function closeView() {
    viewModal.overlay.classList.remove('open');
  }

  /* --------------------------- Action handling ------------------------ */
  function handleUserAction(action, id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    if (action === 'view') {
      openViewUser(user);
      return;
    }

    if (action === 'suspend') {
      const suspending = user.status === 'Active';
      openConfirm(
        suspending ? 'Suspend user?' : 'Reactivate user?',
        `${suspending ? 'Suspend' : 'Reactivate'} ${user.name} (${user.email})?`,
        () => {
          user.status = suspending ? 'Suspended' : 'Active';
          renderAll();
          showToast(`${user.name} ${suspending ? 'suspended' : 'reactivated'}.`);
        },
      );
      return;
    }

    if (action === 'delete') {
      openConfirm('Delete user?', `This will permanently remove ${user.name}. This action cannot be undone.`, () => {
        const index = users.indexOf(user);
        if (index !== -1) users.splice(index, 1);
        renderAll();
        showToast(`${user.name} deleted.`);
      });
    }
  }

  function handlePropertyAction(action, id) {
    const property = properties.find((p) => p.id === id);
    if (!property) return;

    if (action === 'approve') {
      openConfirm('Approve listing?', `Approve "${property.title}"?`, () => {
        property.approval = 'Approved';
        renderAll();
        showToast(`"${property.title}" approved.`);
      });
      return;
    }

    if (action === 'reject') {
      openConfirm('Reject listing?', `Reject "${property.title}"?`, () => {
        property.approval = 'Rejected';
        renderAll();
        showToast(`"${property.title}" rejected.`);
      });
      return;
    }

    if (action === 'remove') {
      openConfirm('Remove property?', `This will permanently remove "${property.title}". This action cannot be undone.`, () => {
        const index = properties.indexOf(property);
        if (index !== -1) properties.splice(index, 1);
        renderAll();
        showToast(`"${property.title}" removed.`);
      });
    }
  }

  function handleReportAction(action, id) {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    if (action === 'dismiss') {
      openConfirm('Dismiss report?', `Dismiss the report on "${report.property}"?`, () => {
        const index = reports.indexOf(report);
        if (index !== -1) reports.splice(index, 1);
        renderAll();
        showToast('Report dismissed.');
      });
      return;
    }

    if (action === 'remove-property') {
      const property = properties.find((p) => p.title === report.property);
      openConfirm('Remove reported property?', `Remove "${report.property}" from the platform?`, () => {
        if (property) {
          const pIndex = properties.indexOf(property);
          if (pIndex !== -1) properties.splice(pIndex, 1);
        }
        const rIndex = reports.indexOf(report);
        if (rIndex !== -1) reports.splice(rIndex, 1);
        renderAll();
        showToast(`"${report.property}" removed.`);
      });
    }
  }

  function bindTableActions() {
    elements.usersBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      handleUserAction(button.dataset.action, Number(button.dataset.id));
    });

    elements.propertiesBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      handlePropertyAction(button.dataset.action, Number(button.dataset.id));
    });

    elements.approvalsBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      handlePropertyAction(button.dataset.action, Number(button.dataset.id));
    });

    elements.reportsBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      handleReportAction(button.dataset.action, Number(button.dataset.id));
    });
  }

  /* ----------------------------- Navigation -------------------------- */
  const pageMeta = {
    dashboard: { eyebrow: 'Admin dashboard', title: 'Platform overview' },
    users: { eyebrow: 'User management', title: 'Manage users' },
    properties: { eyebrow: 'Property management', title: 'Manage properties' },
    approvals: { eyebrow: 'Pending approvals', title: 'Approve or reject listings' },
    reports: { eyebrow: 'Reports', title: 'Reported properties' },
    settings: { eyebrow: 'Settings', title: 'Platform settings' },
  };

  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach((section) => section.classList.remove('active'));
    const target = document.getElementById(`section-${name}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-link[data-section]').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === name);
    });

    const meta = pageMeta[name] || pageMeta.dashboard;
    document.getElementById('pageEyebrow').textContent = meta.eyebrow;
    document.getElementById('pageTitle').textContent = meta.title;

    closeSidebar();
  }

  function bindNavigation() {
    document.querySelectorAll('.sidebar-link[data-section]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(link.dataset.section);
      });
    });

    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    window.closeSidebar = closeSidebar;

    toggle.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener('click', closeSidebar);
  }

  /* ------------------------------ Settings --------------------------- */
  function bindSettings() {
    const stored = JSON.parse(localStorage.getItem('rentkeAdminSettings') || '{}');
    if (stored.platformName) document.getElementById('settingPlatformName').value = stored.platformName;
    if (stored.contactEmail) document.getElementById('settingContactEmail').value = stored.contactEmail;
    if (stored.maintenance) document.getElementById('settingMaintenance').value = stored.maintenance;

    elements.settingsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      localStorage.setItem(
        'rentkeAdminSettings',
        JSON.stringify({
          platformName: document.getElementById('settingPlatformName').value.trim(),
          contactEmail: document.getElementById('settingContactEmail').value.trim(),
          maintenance: document.getElementById('settingMaintenance').value,
        }),
      );
      showToast('Settings saved.');
    });
  }

  function renderAll() {
    renderStats();
    renderDashboardUsers();
    renderUsers();
    renderProperties();
    renderApprovals();
    renderReports();
  }

  function bindFilters() {
    elements.userSearch.addEventListener('input', renderUsers);
    elements.userRoleFilter.addEventListener('change', renderUsers);
    elements.userStatusFilter.addEventListener('change', renderUsers);

    elements.propertySearch.addEventListener('input', renderProperties);
    elements.propertyStatusFilter.addEventListener('change', renderProperties);
    elements.propertyApprovalFilter.addEventListener('change', renderProperties);

    elements.approvalSearch.addEventListener('input', renderApprovals);

    elements.reportSearch.addEventListener('input', renderReports);
    elements.reportReasonFilter.addEventListener('change', renderReports);
  }

  function init() {
    bindTableActions();
    bindNavigation();
    bindSettings();
    bindFilters();
    populateReportReasons();
    renderAll();
  }

  init();
})();
