/* =====================================================================
   API helper - central place for talking to the backend + auth storage
   ===================================================================== */

// Change this if your backend runs on a different host/port
const API_BASE_URL = 'http://localhost:5000/api';

const Auth = {
  getToken() { return localStorage.getItem('set_token'); },
  setToken(token) { localStorage.setItem('set_token', token); },
  getUser() {
    const raw = localStorage.getItem('set_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) { localStorage.setItem('set_user', JSON.stringify(user)); },
  clear() {
    localStorage.removeItem('set_token');
    localStorage.removeItem('set_user');
  },
  isLoggedIn() { return !!Auth.getToken(); },
  logout() {
    Auth.clear();
    window.location.href = 'index.html';
  }
};

// Redirect helpers used at the top of protected/guest-only pages
function requireAuth() {
  if (!Auth.isLoggedIn()) window.location.href = 'index.html';
}
function redirectIfLoggedIn() {
  if (Auth.isLoggedIn()) window.location.href = 'dashboard.html';
}

/**
 * Core fetch wrapper. Automatically attaches the JWT, parses JSON,
 * and throws a normalized Error with a `.data` payload on failure.
 */
async function apiRequest(path, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  // CSV export returns plain text, not JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new Error('Request failed');
    return response;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      Auth.clear();
      if (!path.includes('/auth/')) window.location.href = 'index.html';
    }
    const message = data.errors?.[0]?.msg || data.message || 'Something went wrong';
    const err = new Error(message);
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  auth: {
    register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
    login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
    me: () => apiRequest('/auth/me')
  },
  income: {
    list: (params) => apiRequest('/income', { params }),
    create: (payload) => apiRequest('/income', { method: 'POST', body: payload }),
    update: (id, payload) => apiRequest(`/income/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => apiRequest(`/income/${id}`, { method: 'DELETE' })
  },
  expenses: {
    list: (params) => apiRequest('/expenses', { params }),
    create: (payload) => apiRequest('/expenses', { method: 'POST', body: payload }),
    update: (id, payload) => apiRequest(`/expenses/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => apiRequest(`/expenses/${id}`, { method: 'DELETE' })
  },
  reports: {
    dashboard: (params) => apiRequest('/reports/dashboard', { params }),
    monthly: (params) => apiRequest('/reports/monthly', { params }),
    yearly: (params) => apiRequest('/reports/yearly', { params }),
    csvUrl: (params) => {
      const query = new URLSearchParams(params).toString();
      return `${API_BASE_URL}/reports/csv?${query}`;
    }
  }
};

/* ---------- Toast notifications ---------- */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ---------- Formatting helpers ---------- */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
    .format(Number(amount) || 0);
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
