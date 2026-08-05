let landlordProperties = [
  { id: 1, title: 'Riverside Apartment', location: 'Kisumu', price: 26000, status: 'available', date: '15 Jul 2026' },
  { id: 2, title: 'Sunset Bungalow', location: 'Nairobi', price: 44000, status: 'rented', date: '11 Jul 2026' },
  { id: 3, title: 'Townview Studio', location: 'Mombasa', price: 19000, status: 'available', date: '09 Jul 2026' },
];

function getDetailsLink(id) {
  return window.location.pathname.includes('/pages/')
    ? `./property-details.html?id=${id}`
    : `./pages/property-details.html?id=${id}`;
}

function renderLandlordStats() {
  const total = landlordProperties.length;
  const active = landlordProperties.filter((p) => p.status !== 'rented').length;
  const rented = landlordProperties.filter((p) => p.status === 'rented').length;

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('statTotal', total);
  set('statActive', active);
  set('statRented', rented);
  set('statInquiries', 4);
}

async function deleteLandlordProperty(id, row) {
  const property = landlordProperties.find((p) => p.id === id);
  if (!property) return;

  const confirmed = window.confirm(`Delete "${property.title}"? This cannot be undone.`);
  if (!confirmed) return;

  const result = await deleteProperty(id);
  if (!result.ok && !result.offline) {
    window.alert(result.message || 'Unable to delete the property.');
    return;
  }

  landlordProperties = landlordProperties.filter((p) => p.id !== id);
  renderLandlordProperties();
  renderLandlordStats();
}

async function toggleLandlordStatus(id, button) {
  const property = landlordProperties.find((p) => p.id === id);
  if (!property) return;

  const nextStatus = property.status === 'rented' ? 'available' : 'rented';
  const result = await updateProperty(id, { status: nextStatus });

  if (!result.ok && !result.offline) {
    window.alert(result.message || 'Unable to update the property.');
    return;
  }

  property.status = nextStatus;
  button.textContent = nextStatus === 'rented' ? 'Mark Available' : 'Mark Rented';
  const badge = button.closest('.property-row')?.querySelector('.badge');
  if (badge) {
    badge.textContent = nextStatus === 'rented' ? 'Rented' : 'Active';
    badge.classList.toggle('rented', nextStatus === 'rented');
  }
  renderLandlordStats();
}

function renderLandlordProperties() {
  const container = document.getElementById('landlordPropertyList');
  if (!container) return;

  if (!landlordProperties.length) {
    container.innerHTML = '<p>No properties listed yet. <a href="./create-property.html">Add your first property</a>.</p>';
    renderLandlordStats();
    return;
  }

  container.innerHTML = landlordProperties
    .map((item) => {
      const rented = item.status === 'rented';
      return `
        <div class="property-row" data-id="${item.id}">
          <div>
            <strong>${item.title}</strong><br />
            <span>${item.location}</span>
          </div>
          <div>KES ${item.price.toLocaleString()}</div>
          <div><span class="badge ${rented ? 'rented' : ''}">${rented ? 'Rented' : 'Active'}</span></div>
          <div>${item.date || ''}</div>
          <div class="dashboard-actions">
            <a class="btn btn-secondary" href="${getDetailsLink(item.id)}">View</a>
            <a class="btn btn-secondary" href="./create-property.html?edit=${item.id}">Edit</a>
            <button class="btn btn-secondary" data-toggle-status="${item.id}">${rented ? 'Mark Available' : 'Mark Rented'}</button>
            <button class="btn btn-danger" data-delete="${item.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteLandlordProperty(Number(button.dataset.delete)));
  });

  container.querySelectorAll('[data-toggle-status]').forEach((button) => {
    button.addEventListener('click', () => toggleLandlordStatus(Number(button.dataset.toggleStatus), button));
  });

  renderLandlordStats();
}

async function loadLandlordProperties() {
  const list = await getProperties();
  if (Array.isArray(list) && list.length) {
    landlordProperties = list.map((p) => ({
      id: p.id,
      title: p.title,
      location: `${p.town || ''}, ${p.county || ''}`.replace(/^,\s*/, '') || p.location,
      price: p.price,
      status: p.status === 'rented' ? 'rented' : 'available',
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    }));
  }
  renderLandlordProperties();
}

loadLandlordProperties();
