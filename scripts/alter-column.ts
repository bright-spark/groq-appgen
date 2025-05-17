import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function alterColumn() {
  // Extract connection details from the DATABASE_URL
  const dbUrl = process.env.DATABASE_URL!;
  const url = new URL(dbUrl);
  
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port, 10),
    database: url.pathname.slice(1), // Remove leading '/'
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false // For Supabase connection
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Make creator_id nullable
    console.log('\nMaking creator_id column nullable...');
    await client.query(`
      ALTER TABLE gallery_items 
      ALTER COLUMN creator_id DROP NOT NULL
    `);
    
    console.log('✅ Made creator_id column nullable');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

alterColumn();
