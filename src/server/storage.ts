import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';

interface GalleryItem {
    id: string;
    session_id: string;
    version: string;
    title: string;
    description: string;
    upvotes: number; // Number of upvotes
    created_at: string; // ISO date string
    signature: string;
    creator_ip_hash: string;
}

// Interface for creating new gallery items (without id and with snake_case for DB)
interface NewGalleryItem {
    session_id: string;
    version: string;
    title: string;
    description: string;
    created_at: string;
    signature: string;
    creator_ip_hash: string;
    upvotes: number;
}

function hashIP(ip: string): string {
	return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 8);
}

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_KEY!,
	{
		auth: {
			persistSession: false,
		}
	}
);

// Cache for gallery items
interface GalleryCache {
	items: GalleryItem[];
	lastFetch: number;
}

let galleryCache: GalleryCache | null = null;

export async function getGallery(): Promise<GalleryItem[]> {
	const now = Date.now();
	const CACHE_TTL = 30 * 1000;

	if (galleryCache && (now - galleryCache.lastFetch) < CACHE_TTL) {
		return galleryCache.items;
	}

	// Get all gallery items with pagination
	let allItems: GalleryItem[] = [];
	let page = 0;
	const PAGE_SIZE = 1000;
	
	while (true) {
		const { data: items, error } = await supabase
			.from('gallery_items')
			.select('*')
			.order('created_at', { ascending: false })
			.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

		if (error) {
			console.error('Error fetching gallery items:', error);
			throw error;
		}

		if (!items || items.length === 0) break;

		allItems = [...allItems, ...items as GalleryItem[]];
		page++;

		if (items.length < PAGE_SIZE) break;
	}

	// Update cache
	galleryCache = {
		items: allItems,
		lastFetch: now
	};

	return allItems;
}

export async function getUpvotes(sessionId: string, version: string): Promise<number> {
    try {
        // Get the gallery item to get its ID
        const item = await getGalleryItem(sessionId, version);
        if (!item) return 0;
        
        // Count upvotes for this item
        const { count, error: countError } = await supabase
            .from('upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('gallery_item_id', item.id);

        if (countError) throw countError;
        return count || 0;
    } catch (error) {
        console.error('Error in getUpvotes:', error);
        return 0;
    }
}

export async function isIPBlocked(ip: string): Promise<boolean> {
	const { count, error } = await supabase
		.from('blocked_ips')
		.select('*', { count: 'exact', head: true})
		.eq('ip_address', ip);

	if (error) throw error;
	return (count || 0) > 0;

}

// Helper function to get gallery item by session and version
export async function getGalleryItem(sessionId: string, version: string): Promise<GalleryItem | null> {
    const { data: item, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('version', version)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // Ignore 'not found' errors
            console.error('Error fetching gallery item:', error);
        }
        return null;
    }
    
    // Ensure the item has all required fields with defaults
    return {
        id: item.id,
        session_id: item.session_id,
        version: item.version,
        title: item.title || '',
        description: item.description || '',
        signature: item.signature || '',
        created_at: item.created_at || new Date().toISOString(),
        creator_ip_hash: item.creator_ip_hash || '',
        upvotes: item.upvotes || 0
    } as GalleryItem;
}

// Legacy function stubs for compatibility
export async function getStorageKey(sessionId: string, version: string, ip?: string): Promise<string> {
	const ipHash = ip ? `_${hashIP(ip)}` : '';
	return `app:${sessionId}:${version}${ipHash}`;
}

export async function getGalleryKey(timestamp: number, randomHash: string, ip: string): Promise<string> {
	const ipHash = hashIP(ip);
	return `gallery:${timestamp}:${randomHash}:${ipHash}`;
}

// These functions are stubs for backward compatibility
export async function saveToStorage(key: string | { sessionId: string; version: string } | Record<string, any>, value: string): Promise<boolean> {
  console.log('saveToStorage called with:', { 
    key, 
    keyType: typeof key,
    value: value ? (typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : '[non-string value]') : 'undefined'
  });

  try {
    // Validate key
    if (!key) {
      console.error('No key provided to saveToStorage');
      return false;
    }

    let sessionId: string;
    let version: string;

    // Handle string key format
    if (typeof key === 'string') {
      const parts = key.split(':');
      if (parts.length < 3) {
        console.error('Invalid storage key format', { key });
        return false;
      }
      sessionId = parts[1];
      version = parts[2];
    } 
    // Handle object format
    else if (key && typeof key === 'object' && 'sessionId' in key && 'version' in key) {
      sessionId = key.sessionId;
      version = key.version;
    } 
    // Handle invalid key format
    else {
      console.error('Invalid key format in saveToStorage:', { 
        key, 
        keyType: typeof key,
        isObject: key && typeof key === 'object',
        hasSessionId: key && typeof key === 'object' && 'sessionId' in key,
        hasVersion: key && typeof key === 'object' && 'version' in key
      });
      return false;
    }

    let data;
    try {
      data = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (parseError) {
      console.error('Failed to parse value in saveToStorage', { 
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        value: String(value).substring(0, 100) + '...' 
      });
      return false;
    }

    // Ensure required fields are present
    if (!data.signature) {
      console.warn('Missing required signature in saveToStorage', { 
        sessionId,
        version,
        hasHtml: !!data.html,
        hasTitle: !!data.title
      });
      return false;
    }

    const galleryItem = {
      session_id: sessionId,
      version,
      title: data.title || 'Untitled',
      description: data.description || '',
      html: data.html || '',
      signature: data.signature,
      created_at: data.createdAt || new Date().toISOString(),
      creator_ip_hash: data.creatorIpHash || '',
      upvotes: 0,
    };

    // Check if item exists
    const existingItem = await getGalleryItem(sessionId, version);
    
    if (existingItem) {
      // Update existing item
      const { error } = await supabase
        .from('gallery_items')
        .update(galleryItem)
        .eq('session_id', sessionId)
        .eq('version', version);
      
      if (error) throw error;
    } else {
      // Create new item
      const { error } = await supabase
        .from('gallery_items')
        .insert([galleryItem]);
      
      if (error) throw error;
    }

    // Invalidate gallery cache
    galleryCache = null;
    
    return true;
  } catch (error) {
    console.error('Error in saveToStorage:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      key: typeof key === 'string' ? key : JSON.stringify(key)
    });
    return false;
  }
}
export async function getFromStorage(key: string) {
  try {
    const parts = key.split(':');
    if (parts.length < 3) {
      console.error('Invalid key format:', key);
      return null;
    }

    const sessionId = parts[1];
    const version = parts[2];

    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('version', version)
      .single();

    if (error || !data) {
      if (error) console.error('Error getting from storage:', error);
      return null;
    }

    return JSON.stringify({
      html: data.html,
      signature: data.signature,
      title: data.title,
      description: data.description,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Error in getFromStorage:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      key
    });
    return null;
  }
}
export async function getFromStorageWithRegex(key: string) {
    try {
        // Extract sessionId and version from the key (format: "app:sessionId:version")
        const parts = key.split(':');
        if (parts.length < 3) {
            console.error('Invalid key format:', key);
            return { value: null, key };
        }
        
        const sessionId = parts[1];
        const version = parts[2];
        
        // Query the gallery_items table
        const { data, error } = await supabase
            .from('gallery_items')
            .select('*')
            .eq('session_id', sessionId)
            .eq('version', version)
            .single();
            
        if (error || !data) {
            console.error('Error fetching app from Supabase:', error);
            return { value: null, key };
        }
        
        // Format the data to match the expected structure
        const appData = {
            html: data.html || '',
            signature: data.signature,
            title: data.title,
            description: data.description,
            createdAt: data.created_at
        };
        
        return { 
            value: JSON.stringify(appData), 
            key 
        };
    } catch (error) {
        console.error('Error in getFromStorageWithRegex:', error);
        return { value: null, key };
    }
}
export async function getGalleryKeys() { return []; }
export async function getBlockedIPs() { return []; }

export async function blockIP(ip: string, token: string) {
	if (token !== process.env.BLOCK_SECRET) {
		throw new Error("Invalid token");
	}
	// No-op as we're not blocking IPs in this implementation
	galleryCache = null;
}

export async function addToGallery(item: Omit<NewGalleryItem, 'creator_ip_hash' | 'upvotes'>, creatorIP: string): Promise<boolean> {
    const creatorIpHash = hashIP(creatorIP);

    // Check if item already exists
    const existingItem = await getGalleryItem(item.session_id, item.version);
    if (existingItem) return false;

    // Add to Supabase
    const { error } = await supabase
        .from('gallery_items')
        .insert([{
            session_id: item.session_id,
            version: item.version,
            title: item.title,
            description: item.description,
            signature: item.signature,
            created_at: item.created_at,
            creator_ip_hash: creatorIpHash,
            upvotes: 0
        }]);

    if (error) {
        console.error('Error adding gallery item to Supabase:', error);
        return false;
    }

    // Clear the gallery cache
    galleryCache = null;

    return true;
}

export async function removeGalleryItem(sessionId: string, version: string, requestIP: string): Promise<boolean> {
    // First, verify the IP matches the creator's IP
    const item = await getGalleryItem(sessionId, version);
    if (!item) return false;

    // Verify the request IP matches the creator's IP
    const requestIpHash = hashIP(requestIP);
    if (item.creator_ip_hash !== requestIpHash) {
        console.error('Unauthorized: IP does not match creator IP');
        return false;
    }

    try {
        // Remove from Supabase
        const { error: deleteError } = await supabase
            .from('gallery_items')
            .delete()
            .eq('session_id', sessionId)
            .eq('version', version);

        if (deleteError) {
            console.error('Error removing gallery item from Supabase:', deleteError);
            return false;
        }

        // Also delete any associated upvotes
        const { error: upvotesError } = await supabase
            .from('upvotes')
            .delete()
            .eq('gallery_item_id', item.id);

        if (upvotesError) {
            console.error('Error removing upvotes from Supabase:', upvotesError);
            // Still return true if the main item was deleted
            return true;
        }

        // Invalidate the cache
        galleryCache = null;

        return true;
    } catch (error) {
        console.error('Error in removeGalleryItem:', error);
        return false;
    }
}

export async function upvoteGalleryItem(
    sessionId: string, 
    version: string, 
    voterIp: string,
    timestamp: string
): Promise<number> {
    // First get the gallery item
    const item = await getGalleryItem(sessionId, version);
    if (!item) throw new Error('Gallery item not found');

    try {
        const voterIpHash = hashIP(voterIp);
        const galleryItemId = item.id; // Use the actual item ID from the database

        // Check if already upvoted in Supabase
        const { data: existingVote, error: checkError } = await supabase
            .from('upvotes')
            .select('*')
            .eq('gallery_item_id', galleryItemId)
            .eq('voter_ip', voterIpHash)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingVote) {
            return item.upvotes || 0; // Already upvoted
        }

        // Add the upvote
        const { error: upvoteError } = await supabase
            .from('upvotes')
            .insert({
                gallery_item_id: galleryItemId,
                voter_ip: voterIpHash,
                voted_at: new Date(timestamp).toISOString()
            });

        if (upvoteError) throw upvoteError;

        // Get the new upvote count
        const { count: upvoteCount, error: countError } = await supabase
            .from('upvotes')
            .select('*', { count: 'exact', head: true})
            .eq('gallery_item_id', galleryItemId);

        if (countError) throw countError;

        // Update the gallery item with the new upvote count
        const { error: updateError } = await supabase
            .from('gallery_items')
            .update({ upvotes: upvoteCount })
            .eq('id', galleryItemId);

        if (updateError) throw updateError;

        // Clear the gallery cache
        galleryCache = null;

        return upvoteCount || 0;
    } catch (error) {
        console.error('Error in upvoteGalleryItem:', error);
        throw error;
    }
}
