const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const incomeValidation = [
  body('source').trim().notEmpty().withMessage('Source is required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('incomeDate').isISO8601().withMessage('A valid date (YYYY-MM-DD) is required'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 })
];

const expenseValidation = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('expenseDate').isISO8601().withMessage('A valid date (YYYY-MM-DD) is required'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 })
];

module.exports = { registerValidation, loginValidation, incomeValidation, expenseValidation };
