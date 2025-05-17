import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create the Drizzle client
export const db = drizzle(pool, { schema });

// Export types for type safety
export type DbClient = typeof db;

// Helper function to close the connection
export async function closeConnection() {
  await pool.end();
}
