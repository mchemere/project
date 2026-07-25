const propertyId = Number(new URLSearchParams(window.location.search).get('id')) || 1;
const property = properties.find((item) => item.id === propertyId) || properties[0];



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
