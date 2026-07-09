/* =====================================================================
   Dashboard page logic - stats + Chart.js visualizations
   ===================================================================== */

let trendChart, categoryChart;
const CATEGORY_COLORS = ['#4f46e5', '#f97316', '#16a34a', '#dc2626', '#0891b2', '#d946ef', '#eab308', '#64748b'];

document.addEventListener('DOMContentLoaded', () => {
  populateYearFilter();
  loadDashboard();

  document.getElementById('yearFilter').addEventListener('change', loadDashboard);
});

function populateYearFilter() {
  const select = document.getElementById('yearFilter');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

async function loadDashboard() {
  const year = document.getElementById('yearFilter').value || new Date().getFullYear();
  try {
    const res = await api.reports.dashboard({ year });
    const d = res.data;

    document.getElementById('statTotalIncome').textContent = formatCurrency(d.totalIncome);
    document.getElementById('statTotalExpense').textContent = formatCurrency(d.totalExpense);

    const balanceEl = document.getElementById('statBalance');
    balanceEl.textContent = formatCurrency(d.balance);
    balanceEl.className = 'stat-value ' + (d.balance < 0 ? 'negative' : 'positive');

    document.getElementById('statMonth').textContent =
      `${formatCurrency(d.currentMonth.income)} in / ${formatCurrency(d.currentMonth.expense)} out`;

    // Overspending alert: expenses exceed income for the current month
    const banner = document.getElementById('overspendBanner');
    if (d.currentMonth.expense > d.currentMonth.income && d.currentMonth.income > 0) {
      banner.style.display = 'block';
      banner.textContent = `⚠️ Heads up — your expenses this month (${formatCurrency(d.currentMonth.expense)}) have exceeded your income (${formatCurrency(d.currentMonth.income)}).`;
    } else {
      banner.style.display = 'none';
    }

    renderTrendChart(d.trend);
    renderCategoryChart(d.expenseByCategory);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTrendChart(trend) {
  const ctx = document.getElementById('trendChart');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#2b2f3f' : '#e6e8f0';
  const textColor = isDark ? '#9298ab' : '#6b7280';

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: trend.labels,
      datasets: [
        { label: 'Income', data: trend.income, backgroundColor: '#16a34a', borderRadius: 6 },
        { label: 'Expenses', data: trend.expense, backgroundColor: '#dc2626', borderRadius: 6 }
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

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9298ab' : '#6b7280';

  if (categoryChart) categoryChart.destroy();

  if (!categories || categories.length === 0) {
    categories = [{ category: 'No expenses yet', total: 1 }];
  }

  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => c.total),
        backgroundColor: CATEGORY_COLORS,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12 } } }
    }
  });
}
