/**
 * Authentication Client Script (Login & Register)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if already authenticated; if so, redirect to dashboard
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        window.location.href = '/dashboard.html';
        return;
      }
    }
  } catch (e) {
    // Continue on auth pages
  }

  // Toggle Password Visibility
  const toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const pwdInput = document.getElementById('password');
      if (pwdInput) {
        const isPassword = pwdInput.getAttribute('type') === 'password';
        pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
      }
    });
  }

  const alertBox = document.getElementById('alertBox');
  function showAlert(message, type = 'danger') {
    if (!alertBox) return;
    alertBox.className = `alert alert-${type} d-block`;
    alertBox.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${message}`;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.className = 'alert d-none';
    alertBox.innerHTML = '';
  }

  // Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitBtn = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');

      let isValid = true;
      if (!emailInput.value || !emailInput.checkValidity()) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
      }

      if (!passwordInput.value) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
      } else {
        passwordInput.classList.remove('is-invalid');
      }

      if (!isValid) return;

      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value
          })
        });

        const data = await res.json();
        if (!res.ok) {
          showAlert(data.message || 'Login failed. Please check your credentials.', 'danger');
          submitBtn.disabled = false;
          if (spinner) spinner.classList.add('d-none');
          return;
        }

        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 500);
      } catch (err) {
        showAlert('Network or server error. Please try again.', 'danger');
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }

  // Handle Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmInput = document.getElementById('confirmPassword');
      const submitBtn = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');

      let isValid = true;

      if (!nameInput.value || nameInput.value.trim().length < 2) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput.classList.remove('is-invalid');
      }

      if (!emailInput.value || !emailInput.checkValidity()) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
      }

      if (!passwordInput.value || passwordInput.value.length < 6) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
      } else {
        passwordInput.classList.remove('is-invalid');
      }

      if (confirmInput.value !== passwordInput.value) {
        confirmInput.classList.add('is-invalid');
        isValid = false;
      } else {
        confirmInput.classList.remove('is-invalid');
      }

      if (!isValid) return;

      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value
          })
        });

        const data = await res.json();
        if (!res.ok) {
          showAlert(data.message || 'Registration failed. Email may already be in use.', 'danger');
          submitBtn.disabled = false;
          if (spinner) spinner.classList.add('d-none');
          return;
        }

        showAlert('Account created successfully! Logging you in...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 800);
      } catch (err) {
        showAlert('Network or server error. Please try again.', 'danger');
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }
});
