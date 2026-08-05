const createPropertyForm = document.getElementById('createPropertyForm');
const propertyFormMessage = document.getElementById('propertyFormMessage');
const fileInput = document.getElementById('propertyImages');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('propertyFormSubmit');

const editParam = new URLSearchParams(window.location.search).get('edit');

let uploadedImageNames = [];

function showFormMessage(message, type) {
  if (!propertyFormMessage) return;
  propertyFormMessage.textContent = message;
  propertyFormMessage.className = `form-message ${type}`;
}

function renderImagePreviews() {
  if (!fileInput || !imagePreview) return;

  imagePreview.innerHTML = '';
  uploadedImageNames = [];

  const files = Array.from(fileInput.files || []).slice(0, 4);
  files.forEach((file) => {
    uploadedImageNames.push(file.name);
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    imagePreview.appendChild(img);
  });
}

function fillField(id, value) {
  const field = document.getElementById(id);
  if (field && value != null && value !== '') field.value = value;
}

function loadPropertyIntoForm(property) {
  fillField('propertyTitle', property.title);
  fillField('propertyDescription', property.description);
  fillField('propertyCounty', property.county);
  fillField('propertyTown', property.town);
  fillField('propertyNeighborhood', property.neighborhood);
  fillField('propertyAddress', property.address);
  fillField('propertySize', property.size);
  fillField('propertyRent', property.price);
  fillField('propertyBedrooms', property.bedrooms);
  fillField('propertyBathrooms', property.bathrooms);
  fillField('propertyType', property.type);
  fillField('propertyAvailability', property.status === 'rented' ? 'Rented' : 'Available');

  if (Array.isArray(property.amenities)) {
    document.querySelectorAll('input[name="amenities"]').forEach((checkbox) => {
      checkbox.checked = property.amenities.includes(checkbox.value);
    });
  }

  if (submitButton) submitButton.textContent = 'Update Listing';
  showFormMessage('Editing this listing. Update the details below and publish.', 'success-message');
}

async function handleSubmit(event) {
  event.preventDefault();

  const value = (id) => document.getElementById(id)?.value.trim() || '';
  const number = (id) => Number(document.getElementById(id)?.value) || 0;

  const title = value('propertyTitle');
  const county = value('propertyCounty');
  const town = value('propertyTown');
  const rent = number('propertyRent');

  if (!title || !county || !town || rent <= 0) {
    showFormMessage('Please complete the required fields (title, county, town and rent).', 'error-message');
    return;
  }

  const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(
    (checkbox) => checkbox.value,
  );

  const payload = {
    title,
    description: value('propertyDescription'),
    type: value('propertyType') || 'Apartment',
    county,
    town,
    neighborhood: value('propertyNeighborhood'),
    address: value('propertyAddress'),
    size: value('propertySize'),
    price: rent,
    bedrooms: number('propertyBedrooms'),
    bathrooms: number('propertyBathrooms'),
    amenities,
    images: uploadedImageNames,
    status: value('propertyAvailability').toLowerCase() === 'rented' ? 'rented' : 'available',
  };

  showFormMessage('Submitting your listing...', '');

  const result = editParam
    ? await updateProperty(editParam, payload)
    : await createProperty(payload);

  if (!result.ok) {
    showFormMessage(result.message || 'Unable to save your listing right now.', 'error-message');
    return;
  }

  showFormMessage(
    result.offline
      ? 'Listing saved locally. Start the API server to publish it.'
      : editParam
        ? 'Listing updated successfully.'
        : 'Property listed successfully. Pending review.',
    'success-message',
  );

  createPropertyForm.reset();
  if (imagePreview) imagePreview.innerHTML = '';
  uploadedImageNames = [];
}

if (createPropertyForm) {
  createPropertyForm.addEventListener('submit', handleSubmit);
}

fileInput?.addEventListener('change', renderImagePreviews);

if (editParam) {
  getPropertyById(editParam).then((property) => {
    if (property && property.id) loadPropertyIntoForm(property);
  });
}
