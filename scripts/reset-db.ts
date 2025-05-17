import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const client = await pool.connect();

  try {
    // Disable foreign key checks
    await client.query('SET session_replication_role = "replica";');

    // Get all tables
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'spatial_ref_sys';
    `;
    
    const { rows: tables } = await client.query(tablesQuery);

    // Drop all tables
    for (const { tablename } of tables) {
      await client.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
      console.log(`Dropped table: ${tablename}`);
    }

    // Re-enable foreign key checks
    await client.query('SET session_replication_role = "origin";');
    
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase().catch(console.error);
