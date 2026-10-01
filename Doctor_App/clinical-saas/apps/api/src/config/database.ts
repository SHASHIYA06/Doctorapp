import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// NEON POSTGRESQL CONNECTION POOL
// ============================================
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Error handling
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================
// QUERY EXECUTION WITH LOGGING
// ============================================
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_QUERIES === 'true') {
      console.log('⏱️ Query completed in', duration, 'ms', { rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// ============================================
// TRANSACTION SUPPORT
// ============================================
export const getClient = async () => {
  const client = await pool.connect();
  return {
    query: (text: string, params?: any[]) => client.query(text, params),
    release: () => client.release(),
  };
};

// ============================================
// BEGIN TRANSACTION
// ============================================
export const beginTransaction = async (client: PoolClient) => {
  await client.query('BEGIN');
};

// ============================================
// COMMIT TRANSACTION
// ============================================
export const commitTransaction = async (client: PoolClient) => {
  await client.query('COMMIT');
};

// ============================================
// ROLLBACK TRANSACTION
// ============================================
export const rollbackTransaction = async (client: PoolClient) => {
  await client.query('ROLLBACK');
};

// ============================================
// HEALTH CHECK
// ============================================
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default pool;
