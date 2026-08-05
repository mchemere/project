function setupPasswordToggle(button, input) {
  if (!button || !input) return;

  button.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? '🙈' : '👁';
  });
}

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  const input = document.querySelector(button.dataset.togglePassword);
  setupPasswordToggle(button, input);
});

const loginToggle = document.getElementById('togglePassword');
const loginInput = document.getElementById('loginPassword') || document.getElementById('password');
setupPasswordToggle(loginToggle, loginInput);
