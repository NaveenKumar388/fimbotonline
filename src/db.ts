import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from 'redis';

// Define a type for user data
export interface UserData {
  name: string;
  whatsapp: string;
  gmail: string;
  crypto: string;
  amount: string;
  wallet: string;
  upi: string;
  transaction_id: string;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize Redis connection
export async function initializeRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function saveUser(userData: UserData): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO users (name, whatsapp_number, gmail, crypto, amount, wallet, upi, transaction_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [userData.name, userData.whatsapp, userData.gmail, userData.crypto, userData.amount, userData.wallet, userData.upi, userData.transaction_id]
    );
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserState(chatId: number): Promise<string> {
  try {
    const state = await redisClient.get(`user:${chatId}:state`);
    return state || 'START';
  } catch (error) {
    console.error('Error getting user state:', error);
    return 'START';
  }
}

export async function setUserState(chatId: number, state: string): Promise<void> {
  await redisClient.set(`user:${chatId}:state`, state);
}

export async function setUserData(chatId: number, key: string, value: string): Promise<void> {
  await redisClient.hSet(`user:${chatId}`, key, value);
}

export async function getUserData(chatId: number): Promise<Partial<UserData>> {
  const data = await redisClient.hGetAll(`user:${chatId}`);
  return data as Partial<UserData>;
}

export async function clearUserData(chatId: number): Promise<void> {
  await redisClient.del(`user:${chatId}`);
  await redisClient.del(`user:${chatId}:state`);
}

// Error handling wrapper for database operations
export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    throw new Error('An error occurred during the database operation');
  }
}

// Function to close database connections
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    await redisClient.quit();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}

