const { validationResult } = require('express-validator');
const ExpenseModel = require('../models/expenseModel');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all expense entries for logged-in user (filters + pagination)
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const { category, month, year, search, page = 1, limit = 10 } = req.query;

  const { rows, total } = await ExpenseModel.findAll({
    userId: req.user.id,
    category,
    month,
    year,
    search,
    page: Number(page),
    limit: Number(limit)
  });

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create a new expense entry
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { category, amount, description, expenseDate } = req.body;

  const id = await ExpenseModel.create({
    userId: req.user.id,
    category,
    amount,
    description,
    expenseDate
  });

  res.status(201).json({ success: true, message: 'Expense added successfully', data: { id } });
});

// @desc    Update an expense entry
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const existing = await ExpenseModel.findById(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Expense entry not found' });
  }

  const { category, amount, description, expenseDate } = req.body;
  await ExpenseModel.update(req.params.id, req.user.id, { category, amount, description, expenseDate });

  res.status(200).json({ success: true, message: 'Expense updated successfully' });
});

// @desc    Delete an expense entry
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const existing = await ExpenseModel.findById(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Expense entry not found' });
  }

  await ExpenseModel.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Expense deleted successfully' });
});

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
