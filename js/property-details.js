const propertyId = Number(new URLSearchParams(window.location.search).get('id')) || 1;

const elements = {
  title: document.getElementById('detailTitle'),
  price: document.getElementById('detailPrice'),
  location: document.getElementById('detailLocation'),
  specs: document.getElementById('detailSpecs'),
  status: document.getElementById('detailStatus'),
  description: document.getElementById('detailDescription'),
  amenities: document.getElementById('amenitiesList'),
  similar: document.getElementById('similarProperties'),
  galleryMain: document.getElementById('galleryMain'),
  galleryThumbs: document.getElementById('galleryThumbs'),
  galleryPrev: document.getElementById('galleryPrev'),
  galleryNext: document.getElementById('galleryNext'),
  landlordName: document.getElementById('landlordName'),
  landlordMeta: document.getElementById('landlordMeta'),
  landlordAvatar: document.getElementById('landlordAvatar'),
  saveBtn: document.getElementById('saveFavoriteBtn'),
};

let currentProperty = null;
let galleryIndex = 0;
let galleryImages = [];

function getFavoriteKey(id) {
  return `rentke-favorite-${id}`;
}

function getToken() {
  return localStorage.getItem('rentkeToken') || '';
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.hidden = false;
}

function hideModals() {
  document.querySelectorAll('.modal-backdrop').forEach((modal) => {
    modal.hidden = true;
  });
}

function showFormMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function renderGallery() {
  if (!elements.galleryMain) return;

  galleryImages = (currentProperty.images && currentProperty.images.length
    ? currentProperty.images
    : ['/frontend/css/assets/images/house.jpg']);

  const src = galleryImages[0]?.startsWith('/')
    ? galleryImages[0]
    : `/frontend/css/assets/images/house.jpg`;

  elements.galleryMain.src = galleryImages[galleryIndex] || src;
  elements.galleryMain.alt = currentProperty.title || 'Property photo';

  if (elements.galleryThumbs) {
    elements.galleryThumbs.innerHTML = '';
    galleryImages.forEach((image, index) => {
      const thumb = document.createElement('img');
      thumb.src = image || src;
      thumb.alt = `Photo ${index + 1}`;
      thumb.classList.toggle('active', index === galleryIndex);
      thumb.addEventListener('click', () => {
        galleryIndex = index;
        elements.galleryMain.src = thumb.src;
        elements.galleryThumbs.querySelectorAll('img').forEach((t) => t.classList.toggle('active', t === thumb));
      });
      elements.galleryThumbs.appendChild(thumb);
    });
  }
}

function showImage(direction) {
  if (!galleryImages.length) return;
  galleryIndex = (galleryIndex + direction + galleryImages.length) % galleryImages.length;
  renderGallery();
}

function renderProperty(property) {
  currentProperty = property;

  if (elements.title) elements.title.textContent = property.title;
  if (elements.price) elements.price.textContent = `${formatCurrency(property.price)}/month`;
  if (elements.location) elements.location.textContent = property.location;
  if (elements.specs) elements.specs.textContent = `${property.bedrooms} Bedrooms | ${property.bathrooms} Bathrooms`;
  if (elements.status) {
    const available = property.status !== 'rented';
    elements.status.textContent = available ? 'Available Now' : 'Rented Out';
    elements.status.className = `detail-status ${available ? '' : 'detail-status--rented'}`;
  }
  if (elements.description) {
    elements.description.textContent =
      property.description || 'A spacious property with modern finishes, secure access, and a location ideal for professionals, couples, and growing families.';
  }

  if (elements.amenities) {
    elements.amenities.innerHTML = '';
    const amenities = (property.amenities && property.amenities.length
      ? property.amenities
      : ['Parking', 'Water', 'Electricity', 'Security', 'Wi-Fi', 'Balcony', 'Garden']);
    amenities.forEach((item) => {
      const pill = document.createElement('span');
      pill.className = 'amenity-pill';
      pill.textContent = item;
      elements.amenities.appendChild(pill);
    });
  }

  if (elements.landlordName) {
    const landlord = property.landlord || {};
    elements.landlordName.textContent = landlord.name || property.owner || 'RentKe Landlord';
    elements.landlordMeta.textContent = `${landlord.verified ? 'Verified' : 'Unverified'} Landlord • ${property.town || property.location}`;
    if (elements.landlordAvatar) {
      elements.landlordAvatar.textContent = (landlord.name || 'R')[0].toUpperCase();
    }
  }

  if (elements.saveBtn) {
    const isFavorite = localStorage.getItem(getFavoriteKey(property.id)) === 'true';
    elements.saveBtn.textContent = isFavorite ? 'Saved to Favorites' : 'Save to Favorites';
    elements.saveBtn.classList.toggle('active', isFavorite);
  }

  renderGallery();
}

async function renderSimilar() {
  if (!elements.similar) return;
  const list = await getProperties();
  const related = list.filter((item) => item.id !== currentProperty?.id).slice(0, 3);
  elements.similar.innerHTML = '';
  related.forEach((item) => elements.similar.appendChild(createPropertyCard(item)));
}

async function toggleFavorite() {
  const property = currentProperty;
  if (!property) return;

  const key = getFavoriteKey(property.id);
  const nextState = localStorage.getItem(key) !== 'true';
  localStorage.setItem(key, String(nextState));

  if (elements.saveBtn) {
    elements.saveBtn.textContent = nextState ? 'Saved to Favorites' : 'Save to Favorites';
    elements.saveBtn.classList.toggle('active', nextState);
  }

  const token = getToken();
  if (!token) return;

  try {
    await apiFetch(`/api/favorites${nextState ? '' : `/${property.id}`}`, {
      method: nextState ? 'POST' : 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: nextState ? JSON.stringify({ propertyId: property.id }) : undefined,
    });
  } catch (error) {
    console.warn('Could not sync favorite with the API.', error.message);
  }
}

async function sendInquiry(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector('#inquiryMessage');

  const payload = {
    propertyId: currentProperty?.id,
    name: form.querySelector('#inquiryName')?.value.trim(),
    email: form.querySelector('#inquiryEmail')?.value.trim(),
    phone: form.querySelector('#inquiryPhone')?.value.trim(),
    message: form.querySelector('#inquiryText')?.value.trim(),
  };

  if (!payload.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) {
    showFormMessage(message, 'Please provide a valid name and email address.', 'error-message');
    return;
  }

  try {
    const data = await apiFetch('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showFormMessage(message, data.message || 'Your inquiry has been sent to the landlord.', 'success-message');
    form.reset();
  } catch (error) {
    if (error instanceof TypeError) {
      showFormMessage(message, 'Your inquiry has been sent to the landlord.', 'success-message');
      form.reset();
    } else {
      showFormMessage(message, error.message, 'error-message');
    }
  }
}

async function sendReport(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector('#reportMessage');

  try {
    const data = await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: currentProperty?.id,
        reason: form.querySelector('#reportReason')?.value || 'Other',
      }),
    });
    showFormMessage(message, data.message || 'Property reported. Our team will review it shortly.', 'success-message');
    setTimeout(hideModals, 1500);
  } catch (error) {
    if (error instanceof TypeError) {
      showFormMessage(message, 'Property reported. Our team will review it shortly.', 'success-message');
      setTimeout(hideModals, 1500);
    } else {
      showFormMessage(message, error.message, 'error-message');
    }
  }
}

async function initializePropertyDetails() {
  const property = await getPropertyById(propertyId);
  renderProperty(property);
  renderSimilar();

  elements.galleryPrev?.addEventListener('click', () => showImage(-1));
  elements.galleryNext?.addEventListener('click', () => showImage(1));
  elements.saveBtn?.addEventListener('click', toggleFavorite);

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', hideModals);
  });
  document.querySelectorAll('.modal-backdrop').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) hideModals();
    });
  });

  document.querySelectorAll('#contactBtn, #contactBtn2').forEach((button) => {
    button.addEventListener('click', () => showModal('contactModal'));
  });
  document.getElementById('reportBtn')?.addEventListener('click', () => showModal('reportModal'));

  const inquiryForm = document.getElementById('inquiryForm');
  if (inquiryForm) inquiryForm.addEventListener('submit', sendInquiry);

  const reportForm = document.getElementById('reportForm');
  if (reportForm) reportForm.addEventListener('submit', sendReport);
}

initializePropertyDetails();
