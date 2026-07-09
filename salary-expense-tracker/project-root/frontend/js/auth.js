/* =====================================================================
   Login & Register page logic
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) setupLoginForm(loginForm);
  if (registerForm) setupRegisterForm(registerForm);
});

function setFieldError(input, message) {
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.toggle('visible', !!message);
  }
  input.style.borderColor = message ? 'var(--color-danger)' : '';
}

function setupLoginForm(form) {
  const alertBox = document.getElementById('formAlert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('visible');

    const email = form.email.value.trim();
    const password = form.password.value;

    let valid = true;
    if (!email) { setFieldError(form.email, 'Email is required'); valid = false; }
    else setFieldError(form.email, '');
    if (!password) { setFieldError(form.password, 'Password is required'); valid = false; }
    else setFieldError(form.password, '');
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const res = await api.auth.login({ email, password });
      Auth.setToken(res.token);
      Auth.setUser(res.data);
      window.location.href = 'dashboard.html';
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
    }
  });
}

function setupRegisterForm(form) {
  const alertBox = document.getElementById('formAlert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('visible');

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    let valid = true;
    if (name.length < 2) { setFieldError(form.name, 'Name must be at least 2 characters'); valid = false; }
    else setFieldError(form.name, '');

    if (!/^\S+@\S+\.\S+$/.test(email)) { setFieldError(form.email, 'Enter a valid email'); valid = false; }
    else setFieldError(form.email, '');

    if (password.length < 6) { setFieldError(form.password, 'Password must be at least 6 characters'); valid = false; }
    else setFieldError(form.password, '');

    if (password !== confirmPassword) { setFieldError(form.confirmPassword, 'Passwords do not match'); valid = false; }
    else setFieldError(form.confirmPassword, '');

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const res = await api.auth.register({ name, email, password });
      Auth.setToken(res.token);
      Auth.setUser(res.data);
      window.location.href = 'dashboard.html';
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}
