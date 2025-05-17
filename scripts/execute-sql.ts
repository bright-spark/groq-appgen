import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    db: {
      schema: 'public',
    },
  }
);

async function executeSql() {
  try {
    console.log('Executing SQL to add creator_ip_hash column...');
    
    const { data, error } = await supabase.rpc('pg_temp.add_creator_ip_hash_column');
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('✅ SQL executed successfully');
  } catch (err) {
    console.error('Error:', err);
  }
}

// First, create a function to add the column
const createFunctionSql = `
  CREATE OR REPLACE FUNCTION pg_temp.add_creator_ip_hash_column()
  RETURNS void AS $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'gallery_items' AND column_name = 'creator_ip_hash'
    ) THEN
      EXECUTE 'ALTER TABLE gallery_items ADD COLUMN creator_ip_hash TEXT';
      RAISE NOTICE 'Column creator_ip_hash added to gallery_items';
    ELSE
      RAISE NOTICE 'Column creator_ip_hash already exists in gallery_items';
    END IF;
  END;
  $$ LANGUAGE plpgsql;
`;

// Execute the function creation and then call it
async function run() {
  try {
    console.log('Creating temporary function...');
    await supabase.rpc('pg_temp.add_creator_ip_hash_column', {}, { head: true });
    console.log('Function created, executing it...');
    await executeSql();
  } catch (err) {
    console.error('Error in run:', err);
  }
}

run();
