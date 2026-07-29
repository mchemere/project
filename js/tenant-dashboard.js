const dashboardStats = [
  { label: 'Saved Properties', value: 12 },
  { label: 'Active Inquiries', value: 3 },
  { label: 'Recently Viewed', value: 8 },
  { label: 'Recommendations', value: 5 },
];

function renderTenantDashboard() {
  const container = document.getElementById('tenantStats');
  if (!container) return;

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

  const propertiesContainer = document.getElementById('recommendedProperties');
  if (propertiesContainer) {
    propertiesContainer.innerHTML = '';
    properties.slice(0, 3).forEach((item) => {
      propertiesContainer.appendChild(createPropertyCard(item));
    });
  }
}

renderTenantDashboard();
