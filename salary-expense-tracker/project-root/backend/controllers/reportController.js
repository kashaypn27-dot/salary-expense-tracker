const IncomeModel = require('../models/incomeModel');
const ExpenseModel = require('../models/expenseModel');
const asyncHandler = require('../utils/asyncHandler');

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// @desc    Dashboard summary: totals + monthly trend for charts
// @route   GET /api/reports/dashboard?year=2026
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const year = Number(req.query.year) || new Date().getFullYear();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [totalIncome, totalExpense, monthIncome, monthExpense, incomeTrend, expenseTrend, expenseByCategory] =
    await Promise.all([
      IncomeModel.sumForPeriod(userId, null, null),
      ExpenseModel.sumForPeriod(userId, null, null),
      IncomeModel.sumForPeriod(userId, currentMonth, currentYear),
      ExpenseModel.sumForPeriod(userId, currentMonth, currentYear),
      IncomeModel.monthlyTotals(userId, year),
      ExpenseModel.monthlyTotals(userId, year),
      ExpenseModel.categoryBreakdown(userId, currentMonth, currentYear)
    ]);

  // Build a full 12-month array (fill missing months with 0) for Chart.js
  const buildMonthly = (rows) => {
    const arr = new Array(12).fill(0);
    rows.forEach((r) => { arr[r.month - 1] = Number(r.total); });
    return arr;
  };

  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      currentMonth: {
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      },
      trend: {
        labels: MONTH_NAMES,
        income: buildMonthly(incomeTrend),
        expense: buildMonthly(expenseTrend)
      },
      expenseByCategory
    }
  });
});

// @desc    Monthly report (income + expenses + category breakdown for a given month/year)
// @route   GET /api/reports/monthly?month=7&year=2026
// @access  Private
const getMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  const [totalIncome, totalExpense, incomeByCategory, expenseByCategory] = await Promise.all([
    IncomeModel.sumForPeriod(userId, month, year),
    ExpenseModel.sumForPeriod(userId, month, year),
    IncomeModel.categoryBreakdown(userId, month, year),
    ExpenseModel.categoryBreakdown(userId, month, year)
  ]);

  res.status(200).json({
    success: true,
    data: {
      month,
      year,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory
    }
  });
});

// @desc    Yearly report (12-month trend + totals)
// @route   GET /api/reports/yearly?year=2026
// @access  Private
const getYearlyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const year = Number(req.query.year) || new Date().getFullYear();

  const [incomeTrend, expenseTrend, totalIncome, totalExpense] = await Promise.all([
    IncomeModel.monthlyTotals(userId, year),
    ExpenseModel.monthlyTotals(userId, year),
    IncomeModel.sumForPeriod(userId, null, year),
    ExpenseModel.sumForPeriod(userId, null, year)
  ]);

  const buildMonthly = (rows) => {
    const arr = new Array(12).fill(0);
    rows.forEach((r) => { arr[r.month - 1] = Number(r.total); });
    return arr;
  };

  res.status(200).json({
    success: true,
    data: {
      year,
      labels: MONTH_NAMES,
      income: buildMonthly(incomeTrend),
      expense: buildMonthly(expenseTrend),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  });
});

// @desc    Export expenses (or income) as CSV
// @route   GET /api/reports/csv?type=expense&month=7&year=2026
// @access  Private
const exportCsv = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type = 'expense', month, year, category } = req.query;

  const Model = type === 'income' ? IncomeModel : ExpenseModel;
  const rows = await Model.findAllForExport
    ? await Model.findAllForExport({ userId, category, month, year })
    : (await Model.findAll({ userId, category, month, year, page: 1, limit: 100000 })).rows;

  const dateField = type === 'income' ? 'income_date' : 'expense_date';
  const header = type === 'income'
    ? ['ID', 'Source', 'Category', 'Amount', 'Description', 'Date']
    : ['ID', 'Category', 'Amount', 'Description', 'Date'];

  const csvRows = [header.join(',')];

  rows.forEach((r) => {
    const line = type === 'income'
      ? [r.id, r.source, r.category, r.amount, (r.description || '').replace(/,/g, ';'), r[dateField]]
      : [r.id, r.category, r.amount, (r.description || '').replace(/,/g, ';'), r[dateField]];
    csvRows.push(line.join(','));
  });

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
  res.status(200).send(csv);
});

module.exports = { getDashboard, getMonthlyReport, getYearlyReport, exportCsv };
