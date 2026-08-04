const showPasswordButtons = document.querySelectorAll('[data-show-password]');

showPasswordButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.showPassword);
    if (!target) return;

    const isPassword = target.type === 'password';
    target.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? 'Hide' : 'Show';
  });
});

function showFormMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function loginUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.querySelector('#loginEmail')?.value.trim();
  const password = form.querySelector('#loginPassword')?.value.trim();
  const message = form.parentElement.querySelector('#authMessage');

  if (!validateEmail(email)) {
    showFormMessage(message, 'Please enter a valid email address.', 'error-message');
    return;
  }

  if (!password) {
    showFormMessage(message, 'Password is required.', 'error-message');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showFormMessage(message, data.error || 'Login failed.', 'error-message');
      return;
    }

    localStorage.setItem('rentkeToken', data.token || 'demo-token');
    localStorage.setItem('rentkeUser', JSON.stringify(data.user || {}));
    showFormMessage(message, 'Login successful. Redirecting...', 'success-message');
    const dashboard = data.user && data.user.role === 'landlord'
      ? './landlord-dashboard.html'
      : './tenant-dashboard.html';
    window.location.href = dashboard;
  } catch (error) {
    showFormMessage(message, 'Login request failed. Please try again.', 'error-message');
  }
}

async function registerUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.querySelector('#registerName')?.value.trim();
  const email = form.querySelector('#registerEmail')?.value.trim();
  const phone = form.querySelector('#registerPhone')?.value.trim();
  const password = form.querySelector('#registerPassword')?.value.trim();
  const confirmPassword = form.querySelector('#registerConfirmPassword')?.value.trim();
  const role = form.querySelector('#registerRole')?.value;
  const message = form.parentElement.querySelector('#authMessage');

  if (!name || !email || !phone || !password || !confirmPassword) {
    showFormMessage(message, 'Please complete all fields.', 'error-message');
    return;
  }

  if (!validateEmail(email)) {
    showFormMessage(message, 'Please use a valid email address.', 'error-message');
    return;
  }

  if (password.length < 8) {
    showFormMessage(message, 'Password must be at least 8 characters long.', 'error-message');
    return;
  }

  if (password !== confirmPassword) {
    showFormMessage(message, 'Passwords do not match.', 'error-message');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showFormMessage(message, data.error || 'Registration failed.', 'error-message');
      return;
    }

    showFormMessage(message, data.message || 'Account created successfully. Please login.', 'success-message');
    form.reset();
  } catch (error) {
    showFormMessage(message, 'Unable to create an account right now.', 'error-message');
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', loginUser);

const registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', registerUser);
