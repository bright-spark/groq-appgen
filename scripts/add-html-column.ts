import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addHtmlColumn() {
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

    // Add html column if it doesn't exist
    console.log('\nAdding html column to gallery_items table...');
    await client.query(`
      ALTER TABLE gallery_items 
      ADD COLUMN IF NOT EXISTS html TEXT
    `);
    
    console.log('✅ Added html column to gallery_items table');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addHtmlColumn();
