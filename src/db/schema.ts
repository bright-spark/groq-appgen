import { pgTable, serial, text, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Gallery items table
export const galleryItems = pgTable('gallery_items', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  version: text('version').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  signature: text('signature').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  creatorIp: text('creator_ip'),
  creatorIpHash: text('creator_ip_hash'),
  creatorId: text('creator_id').notNull(), // For RLS
}, (table) => {
  return {
    // Add any additional indexes here if needed
  };
});

// Upvotes table
export const upvotes = pgTable('upvotes', {
  id: serial('id'),
  galleryItemId: integer('gallery_item_id').notNull().references(() => galleryItems.id, { onDelete: 'cascade' }),
  voterIp: text('voter_ip').notNull(),
  voterId: text('voter_id').notNull(), // For RLS
  votedAt: timestamp('voted_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Composite primary key to prevent duplicate upvotes from the same user
    pk: primaryKey({ columns: [table.galleryItemId, table.voterId] }),
  };
});

// Blocked IPs table
export const blockedIps = pgTable('blocked_ips', {
  id: serial('id').primaryKey(),
  ipAddress: text('ip_address').notNull().unique(),
  blockedAt: timestamp('blocked_at').defaultNow().notNull(),
  reason: text('reason'),
}, (table) => {
  return {
    // Add any additional indexes here if needed
  };
});

// Indexes
export const galleryItemsSessionVersionIndex = sql`CREATE INDEX IF NOT EXISTS gallery_items_session_version_idx ON gallery_items (session_id, version)`;
export const upvotesGalleryItemIdIndex = sql`CREATE INDEX IF NOT EXISTS upvotes_gallery_item_id_idx ON upvotes (gallery_item_id)`;
export const blockedIpsIpAddressIndex = sql`CREATE INDEX IF NOT EXISTS blocked_ips_ip_address_idx ON blocked_ips (ip_address)`;
