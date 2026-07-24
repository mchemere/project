const imageInput = document.getElementById('propertyImages');
const previewContainer = document.getElementById('imagePreview');

imageInput?.addEventListener('change', (event) => {
  const files = Array.from(event.target.files || []);
  previewContainer.innerHTML = '';

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = document.createElement('img');
      img.src = loadEvent.target.result;
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

const createPropertyForm = document.getElementById('createPropertyForm');
if (createPropertyForm) {
  createPropertyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.getElementById('propertyFormMessage');
    if (message) {
      message.textContent = 'Property listed successfully. Pending review.';
      message.className = 'form-message success-message';
    }
  });
}
