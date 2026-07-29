const properties = [
  {
    id: 1,
    title: 'Modern 2 Bedroom Apartment',
    location: 'Kisumu, Kenya',
    price: 25000,
    bedrooms: 2,
    bathrooms: 1,
    type: 'Apartment',
    county: 'Kisumu',
    town: 'Kisumu Town',
    neighborhood: 'Mamboleo',
  },
  {
    id: 2,
    title: 'Cozy Family House',
    location: 'Nairobi, Kenya',
    price: 42000,
    bedrooms: 3,
    bathrooms: 2,
    type: 'House',
    county: 'Nairobi',
    town: 'Westlands',
    neighborhood: 'Kileleshwa',
  },
  {
    id: 3,
    title: 'Beachside Studio',
    location: 'Mombasa, Kenya',
    price: 18000,
    bedrooms: 1,
    bathrooms: 1,
    type: 'Studio',
    county: 'Mombasa',
    town: 'Mombasa',
    neighborhood: 'Nyali',
  },
  {
    id: 4,
    title: 'Affordable 1 Bedroom Unit',
    location: 'Nakuru, Kenya',
    price: 15500,
    bedrooms: 1,
    bathrooms: 1,
    type: 'Apartment',
    county: 'Nakuru',
    town: 'Nakuru Town',
    neighborhood: 'Milimani',
  },
  {
    id: 5,
    title: 'Luxury 3 Bedroom Home',
    location: 'Eldoret, Kenya',
    price: 36000,
    bedrooms: 3,
    bathrooms: 2,
    type: 'House',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    neighborhood: 'Kapsoya',
  },
  {
    id: 6,
    title: 'City Center Loft',
    location: 'Nairobi, Kenya',
    price: 30000,
    bedrooms: 2,
    bathrooms: 2,
    type: 'Apartment',
    county: 'Nairobi',
    town: 'Nairobi',
    neighborhood: 'CBD',
  },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPropertyDetailsLink(propertyId) {
  const isInPagesFolder = window.location.pathname.includes('/pages/');
  return isInPagesFolder ? `./property-details.html?id=${propertyId}` : `./pages/property-details.html?id=${propertyId}`;
}

function getFavoriteKey(propertyId) {
  return `rentke-favorite-${propertyId}`;
}

function createPropertyCard(property) {
  const article = document.createElement('article');
  article.className = 'property-card';

  const isFavorite = localStorage.getItem(getFavoriteKey(property.id)) === 'true';

  article.innerHTML = `
    <div class="property-body">
      <div class="property-meta">
        <span class="property-type">${property.type}</span>
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-property-id="${property.id}" aria-label="Save favorite">♥</button>
      </div>
      <h3 class="property-title">${property.title}</h3>
      <div class="property-location">${property.location}</div>
      <div class="property-price">${formatCurrency(property.price)}/month</div>
      <div class="property-specs">${property.bedrooms} Bedrooms | ${property.bathrooms} Bathroom</div>
      <div class="property-actions">
        <a href="${getPropertyDetailsLink(property.id)}" class="btn btn-secondary">View Details</a>
      </div>
    </div>
  `;

  const favoriteButton = article.querySelector('.favorite-btn');
  favoriteButton?.addEventListener('click', () => {
    const nextState = localStorage.getItem(getFavoriteKey(property.id)) !== 'true';
    localStorage.setItem(getFavoriteKey(property.id), String(nextState));
    favoriteButton.classList.toggle('active', nextState);
  });

  return article;
}

function renderProperties(list, emptyMessage = 'No properties match your filters.') {
  const container = document.getElementById('propertyGrid');
  const resultsCount = document.getElementById('resultsCount');
  const statusMessage = document.getElementById('statusMessage');

  if (!container) return;

  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><h3>No listings found</h3><p>${emptyMessage}</p></div>`;
    if (resultsCount) resultsCount.textContent = '0 properties found';
    if (statusMessage) statusMessage.textContent = 'Try widening your search criteria.';
    return;
  }

  list.forEach((property) => container.appendChild(createPropertyCard(property)));

  if (resultsCount) resultsCount.textContent = `${list.length} properties found`;
  if (statusMessage) statusMessage.textContent = 'Showing matching listings.';
}

async function getProperties() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(properties), 300);
  });
}

function filterProperties(list, filters = {}) {
  return list.filter((property) => {
    const matchesSearch = !filters.search || `${property.title} ${property.location} ${property.county} ${property.town} ${property.neighborhood}`.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCounty = !filters.county || property.county.toLowerCase().includes(filters.county.toLowerCase());
    const matchesTown = !filters.town || property.town.toLowerCase().includes(filters.town.toLowerCase());
    const matchesNeighborhood = !filters.neighborhood || property.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase());
    const matchesType = !filters.type || property.type.toLowerCase() === filters.type.toLowerCase();
    const matchesMinPrice = !filters.minPrice || property.price >= Number(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || property.price <= Number(filters.maxPrice);
    const matchesBedrooms = !filters.bedrooms || property.bedrooms >= Number(filters.bedrooms);
    const matchesBathrooms = !filters.bathrooms || property.bathrooms >= Number(filters.bathrooms);

    return matchesSearch && matchesCounty && matchesTown && matchesNeighborhood && matchesType && matchesMinPrice && matchesMaxPrice && matchesBedrooms && matchesBathrooms;
  });
}

function sortProperties(list, sortBy) {
  const sorted = [...list];

  if (sortBy === 'price-low') {
    sorted.sort((a, b) => a.price - b.price);
  }

  if (sortBy === 'price-high') {
    sorted.sort((a, b) => b.price - a.price);
  }

  return sorted;
}

async function initializePropertySearch() {
  const container = document.getElementById('propertyGrid');
  const form = document.getElementById('propertySearchForm');

  if (!container || !form) {
    renderProperties(properties);
    return;
  }

  const data = await getProperties();
  renderProperties(data);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const filters = {
      search: document.getElementById('searchInput')?.value.trim() || '',
      county: document.getElementById('countyInput')?.value.trim() || '',
      town: document.getElementById('townInput')?.value.trim() || '',
      neighborhood: document.getElementById('neighborhoodInput')?.value.trim() || '',
      type: document.getElementById('typeInput')?.value || '',
      minPrice: document.getElementById('minPriceInput')?.value || '',
      maxPrice: document.getElementById('maxPriceInput')?.value || '',
      bedrooms: document.getElementById('bedroomsInput')?.value || '',
      bathrooms: document.getElementById('bathroomsInput')?.value || '',
      sortBy: document.getElementById('sortInput')?.value || 'featured',
    };

    const filtered = filterProperties(data, filters);
    const sorted = sortProperties(filtered, filters.sortBy);
    renderProperties(sorted);
  });
}

initializePropertySearch();
