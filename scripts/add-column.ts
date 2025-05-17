import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

async function addCreatorIpHashColumn() {
  try {
    console.log('Attempting to add creator_ip_hash column to gallery_items table...');
    
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'gallery_items' AND column_name = 'creator_ip_hash'
          ) THEN
            ALTER TABLE gallery_items ADD COLUMN creator_ip_hash TEXT;
            RAISE NOTICE 'Column creator_ip_hash added to gallery_items';
          ELSE
            RAISE NOTICE 'Column creator_ip_hash already exists in gallery_items';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ Successfully checked/added creator_ip_hash column');
  } catch (err) {
    console.error('Error:', err);
  }
}

addCreatorIpHashColumn();
