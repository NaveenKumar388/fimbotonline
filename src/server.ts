import express from 'express';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { setupWebhook } from './webhook.js';
import { handleUpdate } from './bot.js';
import { pool } from './db.js';
import { redisClient } from './redis.js';
import initializeDatabase from './db-init.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: false });

app.use(express.json());

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (_, res) => {
  res.status(200).send('OK');
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    await setupWebhook(bot);
    await pool.connect();
    await initializeDatabase();
    console.log('Connected to PostgreSQL and Redis, database initialized');
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
});

bot.on('message', handleUpdate);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing connections...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

