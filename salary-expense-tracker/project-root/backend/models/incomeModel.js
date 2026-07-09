const { pool } = require('../config/db');

// Builds the WHERE clause + params shared by list/summary queries
function buildFilters({ userId, category, month, year, search }) {
  const clauses = ['user_id = ?'];
  const params = [userId];

  if (category) {
    clauses.push('category = ?');
    params.push(category);
  }
  if (month) {
    clauses.push('MONTH(income_date) = ?');
    params.push(month);
  }
  if (year) {
    clauses.push('YEAR(income_date) = ?');
    params.push(year);
  }
  if (search) {
    clauses.push('(source LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  return { where: clauses.join(' AND '), params };
}

const IncomeModel = {
  async create({ userId, source, category, amount, description, incomeDate }) {
    const [result] = await pool.query(
      `INSERT INTO income (user_id, source, category, amount, description, income_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, source, category, amount, description || null, incomeDate]
    );
    return result.insertId;
  },

  async findAll({ userId, category, month, year, search, page = 1, limit = 10 }) {
    const { where, params } = buildFilters({ userId, category, month, year, search });
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM income WHERE ${where} ORDER BY income_date DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM income WHERE ${where}`,
      params
    );

    return { rows, total: countRows[0].total };
  },

  async findById(id, userId) {
    const [rows] = await pool.query('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0];
  },

  async update(id, userId, { source, category, amount, description, incomeDate }) {
    const [result] = await pool.query(
      `UPDATE income SET source = ?, category = ?, amount = ?, description = ?, income_date = ?
       WHERE id = ? AND user_id = ?`,
      [source, category, amount, description || null, incomeDate, id, userId]
    );
    return result.affectedRows;
  },

  async remove(id, userId) {
    const [result] = await pool.query('DELETE FROM income WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  },

  async sumForPeriod(userId, month, year) {
    const { where, params } = buildFilters({ userId, month, year });
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE ${where}`,
      params
    );
    return Number(rows[0].total);
  },

  async categoryBreakdown(userId, month, year) {
    const { where, params } = buildFilters({ userId, month, year });
    const [rows] = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) AS total FROM income WHERE ${where}
       GROUP BY category ORDER BY total DESC`,
      params
    );
    return rows;
  },

  async monthlyTotals(userId, year) {
    const [rows] = await pool.query(
      `SELECT MONTH(income_date) AS month, COALESCE(SUM(amount),0) AS total
       FROM income WHERE user_id = ? AND YEAR(income_date) = ?
       GROUP BY MONTH(income_date) ORDER BY month`,
      [userId, year]
    );
    return rows;
  }
};

module.exports = IncomeModel;
