import { pool } from './db.js';

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(20) NOT NULL,
        gmail VARCHAR(255) NOT NULL,
        crypto VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        wallet VARCHAR(255) NOT NULL,
        upi VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}

export default initializeDatabase;

