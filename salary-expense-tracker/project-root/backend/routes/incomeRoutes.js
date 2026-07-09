const express = require('express');
const { getIncome, createIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');
const { incomeValidation } = require('../utils/validators');

const router = express.Router();

router.use(protect); // every route below requires authentication

router.route('/')
  .get(getIncome)
  .post(incomeValidation, createIncome);

router.route('/:id')
  .put(incomeValidation, updateIncome)
  .delete(deleteIncome);

module.exports = router;
