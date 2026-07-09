/* =====================================================================
   Dark mode handling - shared across all pages
   ===================================================================== */

function initTheme() {
  const saved = localStorage.getItem('set_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = saved === 'dark';
    toggle.addEventListener('change', () => {
      const theme = toggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('set_theme', theme);
    });
  }
}

document.addEventListener('DOMContentLoaded', initTheme);
