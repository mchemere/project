const landlordProperties = [
  { title: 'Riverside Apartment', location: 'Kisumu', price: 26000, status: 'Active', date: '15 Jul 2026' },
  { title: 'Sunset Bungalow', location: 'Nairobi', price: 44000, status: 'Rented', date: '11 Jul 2026' },
  { title: 'Townview Studio', location: 'Mombasa', price: 19000, status: 'Active', date: '09 Jul 2026' },
];

function renderLandlordProperties() {
  const container = document.getElementById('landlordPropertyList');
  if (!container) return;

  container.innerHTML = landlordProperties
    .map(
      (item) => `
        <div class="property-row">
          <div>
            <strong>${item.title}</strong><br />
            <span>${item.location}</span>
          </div>
          <div>KES ${item.price.toLocaleString()}</div>
          <div><span class="badge ${item.status === 'Rented' ? 'rented' : ''}">${item.status}</span></div>
          <div>${item.date}</div>
          <div class="dashboard-actions">
            <button class="btn btn-secondary">View</button>
            <button class="btn btn-secondary">Edit</button>
          </div>
        </div>
      `,
    )
    .join('');
}

renderLandlordProperties();
