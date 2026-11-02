const user = (() => {
  try {
    return JSON.parse(localStorage.getItem('rentkeUser') || '{}');
  } catch {
    return {};
  }
})();

const welcomeHeading = document.querySelector('.dashboard-content .topbar h1');
if (welcomeHeading && user.name) {
  welcomeHeading.textContent = `Welcome back, ${user.name}`;
}

function getFavoriteIds() {
  const ids = [];
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('rentke-favorite-') && localStorage.getItem(key) === 'true') {
      ids.push(Number(key.replace('rentke-favorite-', '')));
    }
  });
  return ids;
}

function getViewedEntries() {
  const entries = [];
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('rentke-viewed-')) {
      const at = localStorage.getItem(key);
      if (at) {
        entries.push({ id: Number(key.replace('rentke-viewed-', '')), at: new Date(at).getTime() });
      }
    }
  });
  return entries.sort((a, b) => b.at - a.at);
}

function getStoredInquiries() {
  try {
    const raw = localStorage.getItem('rentke-inquiries');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countSavedProperties() {
  return getFavoriteIds().length;
}

function countViewedProperties() {
  return getViewedEntries().length;
}

function countInquiries() {
  return getStoredInquiries().length;
}

function getRecentActivity(properties) {
  const activity = [];

  getFavoriteIds().forEach((id) => {
    const property = properties.find((item) => Number(item.id) === id);
    if (property) {
      activity.push({ text: `Saved property: ${property.title}`, at: Date.now() });
    }
  });

  getViewedEntries().forEach(({ id, at }) => {
    const property = properties.find((item) => Number(item.id) === id);
    if (property) {
      activity.push({ text: `Viewed property: ${property.title}`, at });
    }
  });

  getStoredInquiries().forEach((inquiry) => {
    if (inquiry && inquiry.propertyTitle) {
      activity.push({
        text: `Inquired about: ${inquiry.propertyTitle}`,
        at: new Date(inquiry.createdAt || Date.now()).getTime(),
      });
    }
  });

  return activity.sort((a, b) => b.at - a.at).slice(0, 5);
}

function renderRecentActivity(activity) {
  const container = document.querySelector('.activity-list');
  if (!container) return;

  if (!activity.length) {
    container.innerHTML = '<div class="activity-item"><span>No recent activity yet. Save a property or send an inquiry to see it here.</span><span></span></div>';
    return;
  }

  container.innerHTML = activity
    .map(
      (item) => `
        <div class="activity-item">
          <span>${item.text}</span>
          <span>${new Date(item.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      `,
    )
    .join('');
}

async function renderTenantDashboard() {
  const statsContainer = document.getElementById('tenantStats');
  const recommendedContainer = document.getElementById('recommendedProperties');

  const propertiesList = await getProperties();
  const recommended = propertiesList.slice(0, 3);

  if (statsContainer) {
    const dashboardStats = [
      { label: 'Saved Properties', value: countSavedProperties() },
      { label: 'Recently Viewed', value: countViewedProperties() },
      { label: 'Recommendations', value: recommended.length },
      { label: 'Active Inquiries', value: countInquiries() },
    ];

    statsContainer.innerHTML = dashboardStats
      .map(
        (item) => `
          <div class="stat-card">
            <h3 class="card-title">${item.value}</h3>
            <p>${item.label}</p>
          </div>
        `,
      )
      .join('');
  }

  if (recommendedContainer) {
    recommendedContainer.innerHTML = '';
    recommended.forEach((item) => recommendedContainer.appendChild(createPropertyCard(item)));
  }

  renderRecentActivity(getRecentActivity(propertiesList));
}

const tenantSearchInput = document.getElementById('tenantSearchInput');
tenantSearchInput?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const query = tenantSearchInput.value.trim();
  window.location.href = `./properties.html${query ? `?search=${encodeURIComponent(query)}` : ''}`;
});

const sidebarToggle = document.getElementById('sidebarToggle');
const tenantSidebar = document.getElementById('tenantSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openTenantSidebar() {
  tenantSidebar?.classList.add('open');
  sidebarOverlay?.classList.add('show');
}

function closeTenantSidebar() {
  tenantSidebar?.classList.remove('open');
  sidebarOverlay?.classList.remove('show');
}

if (sidebarToggle && tenantSidebar && sidebarOverlay) {
  sidebarToggle.addEventListener('click', () => {
    if (tenantSidebar.classList.contains('open')) closeTenantSidebar();
    else openTenantSidebar();
  });
  sidebarOverlay.addEventListener('click', closeTenantSidebar);
}

renderTenantDashboard();
