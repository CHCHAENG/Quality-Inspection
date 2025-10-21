const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

function normalizeProcResult(rows) {
  if (Array.isArray(rows)) {
    const first = rows[0];
    return Array.isArray(first) ? first : rows;
  }
  return rows;
}

async function callProcedure(proc, params) {
  const placeholders = params.map(() => "?").join(", ");
  const sql = `CALL ${proc}(${placeholders})`;
  const [rows] = await pool.query(sql, params);
  return normalizeProcResult(rows);
}

module.exports = { pool, callProcedure };
