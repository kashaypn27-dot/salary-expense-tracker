const { pool } = require('../config/db');

function buildFilters({ userId, category, month, year, search }) {
  const clauses = ['user_id = ?'];
  const params = [userId];

  if (category) {
    clauses.push('category = ?');
    params.push(category);
  }
  if (month) {
    clauses.push('MONTH(expense_date) = ?');
    params.push(month);
  }
  if (year) {
    clauses.push('YEAR(expense_date) = ?');
    params.push(year);
  }
  if (search) {
    clauses.push('description LIKE ?');
    params.push(`%${search}%`);
  }

  return { where: clauses.join(' AND '), params };
}

const ExpenseModel = {
  async create({ userId, category, amount, description, expenseDate }) {
    const [result] = await pool.query(
      `INSERT INTO expenses (user_id, category, amount, description, expense_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, category, amount, description || null, expenseDate]
    );
    return result.insertId;
  },

  async findAll({ userId, category, month, year, search, page = 1, limit = 10 }) {
    const { where, params } = buildFilters({ userId, category, month, year, search });
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM expenses WHERE ${where}`,
      params
    );

    return { rows, total: countRows[0].total };
  },

  async findById(id, userId) {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0];
  },

  async update(id, userId, { category, amount, description, expenseDate }) {
    const [result] = await pool.query(
      `UPDATE expenses SET category = ?, amount = ?, description = ?, expense_date = ?
       WHERE id = ? AND user_id = ?`,
      [category, amount, description || null, expenseDate, id, userId]
    );
    return result.affectedRows;
  },

  async remove(id, userId) {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  },

  async sumForPeriod(userId, month, year) {
    const { where, params } = buildFilters({ userId, month, year });
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE ${where}`,
      params
    );
    return Number(rows[0].total);
  },

  async categoryBreakdown(userId, month, year) {
    const { where, params } = buildFilters({ userId, month, year });
    const [rows] = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) AS total FROM expenses WHERE ${where}
       GROUP BY category ORDER BY total DESC`,
      params
    );
    return rows;
  },

  async monthlyTotals(userId, year) {
    const [rows] = await pool.query(
      `SELECT MONTH(expense_date) AS month, COALESCE(SUM(amount),0) AS total
       FROM expenses WHERE user_id = ? AND YEAR(expense_date) = ?
       GROUP BY MONTH(expense_date) ORDER BY month`,
      [userId, year]
    );
    return rows;
  },

  async findAllForExport({ userId, category, month, year }) {
    const { where, params } = buildFilters({ userId, category, month, year });
    const [rows] = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC`,
      params
    );
    return rows;
  }
};

module.exports = ExpenseModel;
