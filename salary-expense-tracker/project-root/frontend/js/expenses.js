/* =====================================================================
   Expenses page logic - list, filters, pagination, add/edit/delete
   ===================================================================== */

const EXP_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let expCurrentPage = 1;
const EXP_PAGE_LIMIT = 10;

document.addEventListener('DOMContentLoaded', () => {
  populateExpMonthYearFilters();
  loadExpenses();

  document.getElementById('addExpenseBtn').addEventListener('click', () => openExpModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeExpModal);
  document.getElementById('cancelBtn').addEventListener('click', closeExpModal);
  document.getElementById('expenseForm').addEventListener('submit', handleExpSubmit);

  document.getElementById('searchInput').addEventListener('input', expDebounce(() => { expCurrentPage = 1; loadExpenses(); }, 400));
  document.getElementById('categoryFilter').addEventListener('change', () => { expCurrentPage = 1; loadExpenses(); });
  document.getElementById('monthFilter').addEventListener('change', () => { expCurrentPage = 1; loadExpenses(); });
  document.getElementById('yearFilter').addEventListener('change', () => { expCurrentPage = 1; loadExpenses(); });

  document.getElementById('prevPage').addEventListener('click', () => { if (expCurrentPage > 1) { expCurrentPage--; loadExpenses(); } });
  document.getElementById('nextPage').addEventListener('click', () => { expCurrentPage++; loadExpenses(); });
});

function expDebounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function populateExpMonthYearFilters() {
  const monthSelect = document.getElementById('monthFilter');
  EXP_MONTH_NAMES.forEach((name, i) => {
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

function getExpFilters() {
  return {
    search: document.getElementById('searchInput').value.trim(),
    category: document.getElementById('categoryFilter').value,
    month: document.getElementById('monthFilter').value,
    year: document.getElementById('yearFilter').value,
    page: expCurrentPage,
    limit: EXP_PAGE_LIMIT
  };
}

async function loadExpenses() {
  try {
    const res = await api.expenses.list(getExpFilters());
    renderExpTable(res.data);
    renderExpPagination(res.pagination);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderExpTable(rows) {
  const tbody = document.getElementById('expenseTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!rows || rows.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = rows.map(row => `
    <tr>
      <td>${formatDate(row.expense_date)}</td>
      <td><span class="badge">${escapeExpHtml(row.category)}</span></td>
      <td class="text-muted">${escapeExpHtml(row.description || '—')}</td>
      <td style="text-align:right;" class="amount-expense">-${formatCurrency(row.amount)}</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="editExpense(${row.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteExpense(${row.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderExpPagination(pagination) {
  const { total, page, totalPages } = pagination;
  const info = document.getElementById('paginationInfo');
  info.textContent = total === 0
    ? 'No results'
    : `Page ${page} of ${totalPages || 1} · ${total} total entries`;

  document.getElementById('prevPage').disabled = page <= 1;
  document.getElementById('nextPage').disabled = page >= totalPages;
}

function escapeExpHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Modal (Add/Edit) ---------- */
function openExpModal(row = null) {
  const form = document.getElementById('expenseForm');
  form.reset();
  document.getElementById('modalTitle').textContent = row ? 'Edit Expense' : 'Add Expense';
  document.getElementById('expenseId').value = row ? row.id : '';
  document.getElementById('category').value = row ? row.category : 'Food';
  document.getElementById('amount').value = row ? row.amount : '';
  document.getElementById('expenseDate').value = row ? row.expense_date.split('T')[0] : todayISO();
  document.getElementById('description').value = row ? (row.description || '') : '';
  document.querySelectorAll('#expenseForm .form-error').forEach(el => el.classList.remove('visible'));
  document.getElementById('expenseModalOverlay').classList.add('visible');
}

function closeExpModal() {
  document.getElementById('expenseModalOverlay').classList.remove('visible');
}

async function editExpense(id) {
  try {
    const res = await api.expenses.list({ ...getExpFilters(), page: expCurrentPage });
    const row = res.data.find(r => r.id === id);
    if (row) openExpModal(row);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense entry? This cannot be undone.')) return;
  try {
    await api.expenses.remove(id);
    showToast('Expense deleted', 'success');
    loadExpenses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleExpSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('expenseId').value;
  const payload = {
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    expenseDate: document.getElementById('expenseDate').value,
    description: document.getElementById('description').value.trim()
  };

  const saveBtn = document.getElementById('saveExpenseBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.expenses.update(id, payload);
      showToast('Expense updated', 'success');
    } else {
      await api.expenses.create(payload);
      showToast('Expense added', 'success');
    }
    closeExpModal();
    loadExpenses();
  } catch (err) {
    if (err.data?.errors) {
      showToast(err.data.errors[0].msg, 'error');
    } else {
      showToast(err.message, 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Expense';
  }
}
