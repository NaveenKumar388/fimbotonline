import pkg from 'pg';
const { Pool } = pkg;
import { redisClient } from './redis.js';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function saveUser(userData: any) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO users (name, whatsapp_number, gmail, crypto, amount, wallet, upi, transaction_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [userData.name, userData.whatsapp, userData.gmail, userData.crypto, userData.amount, userData.wallet, userData.upi, userData.transaction_id]
    );
  } finally {
    client.release();
  }
}

export async function getUserState(chatId: number): Promise<string> {
  const state = await redisClient.get(`user:${chatId}:state`);
  return state || 'START';
}

export async function setUserState(chatId: number, state: string): Promise<void> {
  await redisClient.set(`user:${chatId}:state`, state);
}

export async function setUserData(chatId: number, key: string, value: string): Promise<void> {
  await redisClient.hSet(`user:${chatId}`, key, value);
}

export async function getUserData(chatId: number): Promise<any> {
  return redisClient.hGetAll(`user:${chatId}`);
}

export async function clearUserData(chatId: number): Promise<void> {
  await redisClient.del(`user:${chatId}`);
  await redisClient.del(`user:${chatId}:state`);
}

