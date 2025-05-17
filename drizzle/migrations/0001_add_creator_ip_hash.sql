-- Add creator_ip_hash column to gallery_items table
ALTER TABLE gallery_items
ADD COLUMN IF NOT EXISTS creator_ip_hash TEXT;
