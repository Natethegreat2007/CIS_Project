const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'tourist_tome_live',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  decimalNumbers: true,
};

const pool = mysql.createPool(dbConfig);

module.exports = {
  pool,
  dbConfig,
};
