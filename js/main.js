const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const homeSearchForm = document.getElementById('homeSearchForm');

if (homeSearchForm) {
  homeSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const location = document.getElementById('location')?.value.trim() || '';
    const propertyType = document.getElementById('propertyType')?.value || '';
    const price = document.getElementById('price')?.value || '';

    const query = new URLSearchParams({
      search: location,
      type: propertyType,
      maxPrice: price,
    });

    window.location.href = `./pages/properties.html?${query.toString()}`;
  });
}

const propertySearchForm = document.getElementById('propertySearchForm');

if (propertySearchForm) {
  const searchParams = new URLSearchParams(window.location.search);
  const searchInput = document.getElementById('searchInput');
  const typeInput = document.getElementById('typeInput');
  const maxPriceInput = document.getElementById('maxPriceInput');

  if (searchInput) searchInput.value = searchParams.get('search') || '';
  if (typeInput) typeInput.value = searchParams.get('type') || '';
  if (maxPriceInput) maxPriceInput.value = searchParams.get('maxPrice') || '';
}
