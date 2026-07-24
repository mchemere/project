const propertyId = Number(new URLSearchParams(window.location.search).get('id')) || 1;
const property = properties.find((item) => item.id === propertyId) || properties[0];

const galleryImages = [
  property.image,
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
];

let currentIndex = 0;

function updateGallery() {
  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.getElementById('galleryThumbnails');

  if (!mainImage || !thumbnails) return;

  mainImage.src = galleryImages[currentIndex];
  thumbnails.innerHTML = '';

  galleryImages.forEach((image, index) => {
    const thumb = document.createElement('img');
    thumb.src = image;
    thumb.alt = `Gallery ${index + 1}`;
    thumb.addEventListener('click', () => {
      currentIndex = index;
      updateGallery();
    });
    thumbnails.appendChild(thumb);
  });
}

document.getElementById('prevImage')?.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  updateGallery();
});

document.getElementById('nextImage')?.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % galleryImages.length;
  updateGallery();
});

const detailTitle = document.getElementById('detailTitle');
const detailPrice = document.getElementById('detailPrice');
const detailLocation = document.getElementById('detailLocation');
const detailSpecs = document.getElementById('detailSpecs');
const detailStatus = document.getElementById('detailStatus');
const detailDescription = document.getElementById('detailDescription');
const amenitiesList = document.getElementById('amenitiesList');
const similarProperties = document.getElementById('similarProperties');

if (detailTitle) detailTitle.textContent = property.title;
if (detailPrice) detailPrice.textContent = `${formatCurrency(property.price)}/month`;
if (detailLocation) detailLocation.textContent = property.location;
if (detailSpecs) detailSpecs.textContent = `${property.bedrooms} Bedrooms | ${property.bathrooms} Bathrooms`;
if (detailStatus) detailStatus.textContent = 'Available Now';
if (detailDescription) detailDescription.textContent = 'A spacious property with modern finishes, secure access, and a location ideal for professionals, couples, and growing families.';

const amenities = ['Parking', 'Water', 'Electricity', 'Security', 'Wi-Fi', 'Balcony', 'Garden'];
amenities.forEach((item) => {
  const pill = document.createElement('span');
  pill.className = 'amenity-pill';
  pill.textContent = item;
  amenitiesList?.appendChild(pill);
});

const related = properties.filter((item) => item.id !== property.id).slice(0, 3);
related.forEach((item) => {
  similarProperties?.appendChild(createPropertyCard(item));
});

updateGallery();
