/* =====================================================================
   Income page logic - list, filters, pagination, add/edit/delete
   ===================================================================== */

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let currentPage = 1;
const PAGE_LIMIT = 10;

document.addEventListener('DOMContentLoaded', () => {
  populateMonthYearFilters();
  loadIncome();

  document.getElementById('addIncomeBtn').addEventListener('click', () => openModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('incomeForm').addEventListener('submit', handleSubmit);

  document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; loadIncome(); }, 400));
  document.getElementById('categoryFilter').addEventListener('change', () => { currentPage = 1; loadIncome(); });
  document.getElementById('monthFilter').addEventListener('change', () => { currentPage = 1; loadIncome(); });
  document.getElementById('yearFilter').addEventListener('change', () => { currentPage = 1; loadIncome(); });

  document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadIncome(); } });
  document.getElementById('nextPage').addEventListener('click', () => { currentPage++; loadIncome(); });
});

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function populateMonthYearFilters() {
  const monthSelect = document.getElementById('monthFilter');
  MONTH_NAMES.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i + 1;
    opt.textContent = name;
    monthSelect.appendChild(opt);
  });

  const yearSelect = document.getElementById('yearFilter');
  const allOpt = document.createElement('option');
  allOpt.value = ''; allOpt.textContent = 'All Years';
  yearSelect.appendChild(allOpt);
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

function getFilters() {
  return {
    search: document.getElementById('searchInput').value.trim(),
    category: document.getElementById('categoryFilter').value,
    month: document.getElementById('monthFilter').value,
    year: document.getElementById('yearFilter').value,
    page: currentPage,
    limit: PAGE_LIMIT
  };
}

async function loadIncome() {
  try {
    const res = await api.income.list(getFilters());
    renderTable(res.data);
    renderPagination(res.pagination);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('incomeTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!rows || rows.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = rows.map(row => `
    <tr>
      <td>${formatDate(row.income_date)}</td>
      <td>${escapeHtml(row.source)}</td>
      <td><span class="badge">${escapeHtml(row.category)}</span></td>
      <td class="text-muted">${escapeHtml(row.description || '—')}</td>
      <td style="text-align:right;" class="amount-income">+${formatCurrency(row.amount)}</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="editIncome(${row.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteIncome(${row.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPagination(pagination) {
  const { total, page, totalPages } = pagination;
  const info = document.getElementById('paginationInfo');
  info.textContent = total === 0
    ? 'No results'
    : `Page ${page} of ${totalPages || 1} · ${total} total entries`;

  document.getElementById('prevPage').disabled = page <= 1;
  document.getElementById('nextPage').disabled = page >= totalPages;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Modal (Add/Edit) ---------- */
let incomeCache = {}; // id -> row, populated as pages load, used to prefill edit form

function openModal(row = null) {
  const form = document.getElementById('incomeForm');
  form.reset();
  document.getElementById('modalTitle').textContent = row ? 'Edit Income' : 'Add Income';
  document.getElementById('incomeId').value = row ? row.id : '';
  document.getElementById('source').value = row ? row.source : '';
  document.getElementById('category').value = row ? row.category : 'Salary';
  document.getElementById('amount').value = row ? row.amount : '';
  document.getElementById('incomeDate').value = row ? row.income_date.split('T')[0] : todayISO();
  document.getElementById('description').value = row ? (row.description || '') : '';
  document.querySelectorAll('#incomeForm .form-error').forEach(el => el.classList.remove('visible'));
  document.getElementById('incomeModalOverlay').classList.add('visible');
}

function closeModal() {
  document.getElementById('incomeModalOverlay').classList.remove('visible');
}

async function editIncome(id) {
  try {
    // Re-fetch the current page to guarantee we have fresh data for this row
    const res = await api.income.list({ ...getFilters(), page: currentPage });
    const row = res.data.find(r => r.id === id);
    if (row) openModal(row);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteIncome(id) {
  if (!confirm('Delete this income entry? This cannot be undone.')) return;
  try {
    await api.income.remove(id);
    showToast('Income deleted', 'success');
    loadIncome();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('incomeId').value;
  const payload = {
    source: document.getElementById('source').value.trim(),
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    incomeDate: document.getElementById('incomeDate').value,
    description: document.getElementById('description').value.trim()
  };

  const saveBtn = document.getElementById('saveIncomeBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.income.update(id, payload);
      showToast('Income updated', 'success');
    } else {
      await api.income.create(payload);
      showToast('Income added', 'success');
    }
    closeModal();
    loadIncome();
  } catch (err) {
    if (err.data?.errors) {
      showToast(err.data.errors[0].msg, 'error');
    } else {
      showToast(err.message, 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Income';
  }
}
