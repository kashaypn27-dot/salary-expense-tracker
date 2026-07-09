/* =====================================================================
   Reports page logic - monthly report, yearly trend, CSV export
   ===================================================================== */

const REPORT_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let yearlyTrendChart, reportCategoryChart;
const REPORT_COLORS = ['#4f46e5', '#f97316', '#16a34a', '#dc2626', '#0891b2', '#d946ef', '#eab308', '#64748b'];

document.addEventListener('DOMContentLoaded', () => {
  populateReportFilters();
  loadReports();

  document.getElementById('monthFilter').addEventListener('change', loadReports);
  document.getElementById('yearFilter').addEventListener('change', loadReports);

  document.getElementById('downloadExpenseCsv').addEventListener('click', () => downloadCsv('expense'));
  document.getElementById('downloadIncomeCsv').addEventListener('click', () => downloadCsv('income'));
});

function populateReportFilters() {
  const monthSelect = document.getElementById('monthFilter');
  const now = new Date();
  REPORT_MONTH_NAMES.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i + 1;
    opt.textContent = name;
    if (i + 1 === now.getMonth() + 1) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  const yearSelect = document.getElementById('yearFilter');
  const currentYear = now.getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

function getSelectedMonthYear() {
  return {
    month: document.getElementById('monthFilter').value,
    year: document.getElementById('yearFilter').value
  };
}

async function loadReports() {
  const { month, year } = getSelectedMonthYear();
  try {
    const [monthlyRes, yearlyRes] = await Promise.all([
      api.reports.monthly({ month, year }),
      api.reports.yearly({ year })
    ]);

    renderMonthlyStats(monthlyRes.data);
    renderCategoryTables(monthlyRes.data);
    renderReportCategoryChart(monthlyRes.data.expenseByCategory);
    renderYearlyTrendChart(yearlyRes.data);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderMonthlyStats(data) {
  document.getElementById('monthIncome').textContent = formatCurrency(data.totalIncome);
  document.getElementById('monthExpense').textContent = formatCurrency(data.totalExpense);
  const balanceEl = document.getElementById('monthBalance');
  balanceEl.textContent = formatCurrency(data.balance);
  balanceEl.className = 'stat-value ' + (data.balance < 0 ? 'negative' : 'positive');
}

function renderCategoryTables(data) {
  const incomeBody = document.getElementById('incomeCategoryBody');
  const expenseBody = document.getElementById('expenseCategoryBody');

  incomeBody.innerHTML = data.incomeByCategory.length
    ? data.incomeByCategory.map(c => `<tr><td>${c.category}</td><td style="text-align:right;" class="amount-income">${formatCurrency(c.total)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="text-muted text-center">No income recorded for this period</td></tr>';

  expenseBody.innerHTML = data.expenseByCategory.length
    ? data.expenseByCategory.map(c => `<tr><td>${c.category}</td><td style="text-align:right;" class="amount-expense">${formatCurrency(c.total)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="text-muted text-center">No expenses recorded for this period</td></tr>';
}

function renderReportCategoryChart(categories) {
  const ctx = document.getElementById('reportCategoryChart');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9298ab' : '#6b7280';

  if (reportCategoryChart) reportCategoryChart.destroy();
  if (!categories || categories.length === 0) categories = [{ category: 'No expenses', total: 1 }];

  reportCategoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories.map(c => c.category),
      datasets: [{ data: categories.map(c => c.total), backgroundColor: REPORT_COLORS, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12 } } }
    }
  });
}

function renderYearlyTrendChart(data) {
  const ctx = document.getElementById('yearlyTrendChart');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#2b2f3f' : '#e6e8f0';
  const textColor = isDark ? '#9298ab' : '#6b7280';

  if (yearlyTrendChart) yearlyTrendChart.destroy();
  yearlyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'Income', data: data.income, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)', tension: 0.3, fill: true },
        { label: 'Expenses', data: data.expense, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', tension: 0.3, fill: true }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });
}

function downloadCsv(type) {
  const { month, year } = getSelectedMonthYear();
  const token = Auth.getToken();
  const url = api.reports.csvUrl({ type, month, year });

  // Fetch with auth header, then trigger a download (can't set headers on a plain <a> click)
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('Failed to export CSV');
      return res.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${type}_report_${year}_${month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(err => showToast(err.message, 'error'));
}
