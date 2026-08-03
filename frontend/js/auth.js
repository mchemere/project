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

function getApiUrl(path) {
  if (window.location.protocol === 'file:') {
    return `http://localhost:3000${path}`;
  }

  return path;
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
    const response = await fetch(getApiUrl('/api/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    localStorage.setItem('rentkeToken', data.token || 'demo-token');
    showFormMessage(message, 'Login successful. Redirecting...', 'success-message');
    window.location.href = './tenant-dashboard.html';
  } catch (error) {
    showFormMessage(message, error.message || 'Login request failed. Please try again.', 'error-message');
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
    const response = await fetch(getApiUrl('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    showFormMessage(message, 'Account created successfully. Please login.', 'success-message');
    form.reset();
  } catch (error) {
    showFormMessage(message, error.message || 'Unable to create an account right now.', 'error-message');
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', loginUser);

const registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', registerUser);
