

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
