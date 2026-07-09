const express = require('express');
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { expenseValidation } = require('../utils/validators');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(expenseValidation, createExpense);

router.route('/:id')
  .put(expenseValidation, updateExpense)
  .delete(deleteExpense);

module.exports = router;
