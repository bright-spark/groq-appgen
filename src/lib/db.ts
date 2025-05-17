import { createClient } from '@supabase/supabase-js';
import { GalleryItem, NewGalleryItem } from './validation';
import logger from './logger';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const TABLES = {
  GALLERY_ITEMS: 'gallery_items',
  UPVOTES: 'upvotes',
  BLOCKED_IPS: 'blocked_ips',
} as const;

export async function executeInTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const { data, error } = await supabase.rpc('begin');
  
  if (error) {
    logger.error('Error beginning transaction', { error });
    throw error;
  }

  try {
    const result = await callback();
    await supabase.rpc('commit');
    return result;
  } catch (error) {
    await supabase.rpc('rollback');
    throw error;
  }
}

export async function findOne<T>(
  table: string,
  conditions: Record<string, any>
): Promise<T | null> {
  let query = supabase.from(table).select('*');
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null;
    }
    logger.error(`Error finding one in ${table}`, { error, conditions });
    throw error;
  }

  return data as T;
}

export async function findMany<T>(
  table: string,
  conditions: Record<string, any> = {},
  options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderAsc?: boolean;
  } = {}
): Promise<T[]> {
  let query = supabase.from(table).select('*', { count: 'exact' });

  // Apply conditions
  Object.entries(conditions).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });

  // Apply pagination
  if (options.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    );
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.orderAsc ?? true,
    });
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Error finding many in ${table}`, { error, conditions, options });
    throw error;
  }

  return data as T[];
}

export async function createOne<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();

  if (error) {
    logger.error(`Error creating in ${table}`, { error, data });
    throw error;
  }

  return result as T;
}

export async function updateOne<T>(
  table: string,
  conditions: Record<string, any>,
  data: Partial<T>
): Promise<T | null> {
  let query = supabase.from(table).update(data);

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data: result, error } = await query.select().single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null;
    }
    logger.error(`Error updating in ${table}`, { error, conditions, data });
    throw error;
  }

  return result as T;
}

export async function deleteOne(
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  let query = supabase.from(table).delete();

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { error } = await query;

  if (error) {
    logger.error(`Error deleting from ${table}`, { error, conditions });
    throw error;
  }

  return true;
}
