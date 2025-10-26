const express = require('express');
const {Pool} = require('pg');
const path = require('path');

const app = express();
app.use(express.json({limit: '1mb'})); // parse JSON bodies

// Heroku injects DATABASE_URL
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}, // required by Heroku Postgres
});

// POST /api/log  -> { userId?: number, eventKey: string, eventValue: any }
app.post('/api/log', async (req, res) => {
  const {user_id, event_key, event_value} = req.body ?? {};
  if (!event_key) return res.status(400).json({error: 'eventKey required'});

  try {
    await pool.query(
      'INSERT INTO logs (user_id, event_key, event_value) VALUES ($1, $2, $3)',
      [user_id, event_key, JSON.stringify(event_value)]
    );
    res.json({ok: true});
  } catch (err) {
    console.error('Failed to insert log:', err);
    res.status(500).json({error: 'insert_failed'});
  }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));

// Graceful shutdown (Heroku dynos)
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
