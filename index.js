const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Ensure the calculations table exists
async function ensureTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS calculations (
      id SERIAL PRIMARY KEY,
      operation TEXT,
      x NUMERIC,
      y NUMERIC,
      result NUMERIC,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
}

ensureTable().catch((err) => {
  console.error('Error ensuring table', err);
});

// Root route to check service status
app.get('/', (req, res) => {
  res.send('Calculator API is running');
});

// Addition route: /add?x=1&y=2
app.get('/add', async (req, res) => {
  const x = parseFloat(req.query.x);
  const y = parseFloat(req.query.y);
  if (isNaN(x) || isNaN(y)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  const result = x + y;
  try {
    await pool.query(
      'INSERT INTO calculations(operation, x, y, result) VALUES($1, $2, $3, $4)',
      ['add', x, y, result]
    );
  } catch (err) {
    console.error('Database insert error:', err);
  }
  res.json({ result });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
