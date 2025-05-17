import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

async function checkTable() {
  try {
    // Get table information
    const { data: tableInfo, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'gallery_items');

    if (error) throw error;

    console.log('Columns in gallery_items table:');
    console.table(tableInfo);

    // Check if creator_ip_hash exists
    const hasCreatorIpHash = tableInfo?.some(col => col.column_name === 'creator_ip_hash');
    console.log(`\nCreator IP Hash column exists: ${hasCreatorIpHash ? '✅ Yes' : '❌ No'}`);

    if (!hasCreatorIpHash) {
      console.log('\nAttempting to add creator_ip_hash column...');
      const { error: alterError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS creator_ip_hash TEXT;',
      });

      if (alterError) {
        console.error('Error adding column:', alterError);
      } else {
        console.log('✅ Successfully added creator_ip_hash column');
      }
    }
  } catch (err) {
    console.error('Error checking table:', err);
  }
}

checkTable();
