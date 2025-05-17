import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Define the expected columns and their types
const expectedColumns = [
  { name: 'id', type: 'SERIAL PRIMARY KEY' },
  { name: 'session_id', type: 'TEXT NOT NULL' },
  { name: 'version', type: 'TEXT NOT NULL' },
  { name: 'title', type: 'TEXT NOT NULL' },
  { name: 'description', type: 'TEXT' },
  { name: 'signature', type: 'TEXT NOT NULL' },
  { name: 'created_at', type: 'TIMESTAMP NOT NULL DEFAULT NOW()' },
  { name: 'creator_ip_hash', type: 'TEXT' },
  { name: 'upvotes', type: 'INTEGER DEFAULT 0' },
  { name: 'creator_ip', type: 'TEXT' },
  { name: 'creator_id', type: 'TEXT' } // Made nullable by removing NOT NULL
];

async function fixDatabase() {
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

    // Get existing columns
    const { rows: existingColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'gallery_items'
    `);

    console.log('\nExisting columns in gallery_items:');
    console.table(existingColumns);

    // Check and add missing columns
    for (const expectedCol of expectedColumns) {
      const exists = existingColumns.some(col => col.column_name === expectedCol.name);
      
      if (!exists) {
        console.log(`\n⚠️  Adding missing column: ${expectedCol.name} (${expectedCol.type})`);
        try {
          await client.query(`
            ALTER TABLE gallery_items 
            ADD COLUMN ${expectedCol.name} ${expectedCol.type}
          `);
          console.log(`✅ Added column: ${expectedCol.name}`);
        } catch (err) {
          console.error(`❌ Error adding column ${expectedCol.name}:`, err.message);
        }
      } else {
        console.log(`✅ Column exists: ${expectedCol.name}`);
      }
    }

    console.log('\n✅ Database schema verification complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixDatabase();
