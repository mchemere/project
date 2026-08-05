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

function countSavedProperties() {
  let count = 0;
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('rentke-favorite-') && localStorage.getItem(key) === 'true') {
      count += 1;
    }
  });
  return count;
}

function renderTenantDashboard() {
  const container = document.getElementById('tenantStats');
  if (container) {
    const dashboardStats = [
      { label: 'Saved Properties', value: countSavedProperties() },
      { label: 'Active Inquiries', value: 3 },
      { label: 'Recently Viewed', value: 8 },
      { label: 'Recommendations', value: 5 },
    ];

    container.innerHTML = dashboardStats
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
}

async function renderRecommended() {
  const propertiesContainer = document.getElementById('recommendedProperties');
  if (!propertiesContainer) return;

  propertiesContainer.innerHTML = '';
  const list = await getProperties();
  list.slice(0, 3).forEach((item) => {
    propertiesContainer.appendChild(createPropertyCard(item));
  });
}

renderTenantDashboard();
renderRecommended();
