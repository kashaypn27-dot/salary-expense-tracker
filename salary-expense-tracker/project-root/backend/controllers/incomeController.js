const { validationResult } = require('express-validator');
const IncomeModel = require('../models/incomeModel');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all income entries for logged-in user (filters + pagination)
// @route   GET /api/income
// @access  Private
const getIncome = asyncHandler(async (req, res) => {
  const { category, month, year, search, page = 1, limit = 10 } = req.query;

  const { rows, total } = await IncomeModel.findAll({
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

// @desc    Create a new income entry
// @route   POST /api/income
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { source, category, amount, description, incomeDate } = req.body;

  const id = await IncomeModel.create({
    userId: req.user.id,
    source,
    category,
    amount,
    description,
    incomeDate
  });

  res.status(201).json({ success: true, message: 'Income added successfully', data: { id } });
});

// @desc    Update an income entry
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const existing = await IncomeModel.findById(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Income entry not found' });
  }

  const { source, category, amount, description, incomeDate } = req.body;
  await IncomeModel.update(req.params.id, req.user.id, { source, category, amount, description, incomeDate });

  res.status(200).json({ success: true, message: 'Income updated successfully' });
});

// @desc    Delete an income entry
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = asyncHandler(async (req, res) => {
  const existing = await IncomeModel.findById(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Income entry not found' });
  }

  await IncomeModel.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Income deleted successfully' });
});

module.exports = { getIncome, createIncome, updateIncome, deleteIncome };
