/* =====================================================================
   Renders the shared sidebar + topbar menu toggle on every app page
   ===================================================================== */

const NAV_ITEMS = [
  { href: 'dashboard.html', icon: '📊', label: 'Dashboard' },
  { href: 'income.html', icon: '💰', label: 'Income' },
  { href: 'expenses.html', icon: '🧾', label: 'Expenses' },
  { href: 'reports.html', icon: '📈', label: 'Reports' }
];

function renderSidebar() {
  requireAuth();
  const user = Auth.getUser() || { name: 'User', email: '' };
  const currentPage = window.location.pathname.split('/').pop();
  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'U';

  const navHtml = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${currentPage === item.href ? 'active' : ''}">
      <span class="icon">${item.icon}</span> ${item.label}
    </a>
  `).join('');

  const sidebarHtml = `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <span class="logo-dot">₹</span>
        <span>ExpenseWise</span>
      </div>
      <nav>${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="theme-toggle">
          <span>🌙 Dark mode</span>
          <label class="switch">
            <input type="checkbox" id="themeToggle">
            <span class="slider"></span>
          </label>
        </div>
        <div class="user-chip">
          <div class="avatar">${initials}</div>
          <div class="info">
            <div class="name">${user.name}</div>
            <div class="email">${user.email}</div>
          </div>
        </div>
        <a href="#" class="logout-link" id="logoutBtn">
          <span class="icon">🚪</span> Logout
        </a>
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  initTheme();

  // Mobile menu toggle button lives in each page's topbar
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && e.target !== menuToggle) {
        sidebar.classList.remove('open');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', renderSidebar);
