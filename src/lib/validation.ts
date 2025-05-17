import { z } from 'zod';

export const GalleryItemSchema = z.object({
  id: z.number().optional(),
  session_id: z.string().uuid(),
  version: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  html: z.string().optional(),
  signature: z.string(),
  created_at: z.string().datetime().or(z.date()),
  creator_ip_hash: z.string().optional(),
  upvotes: z.number().int().nonnegative().default(0),
  creator_ip: z.string().ip().optional(),
  creator_id: z.string().optional(),
});

export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export const NewGalleryItemSchema = GalleryItemSchema.pick({
  session_id: true,
  version: true,
  title: true,
  description: true,
  signature: true,
  created_at: true,
});

export type NewGalleryItem = z.infer<typeof NewGalleryItemSchema>;

export const GalleryQueryParamsSchema = z.object({
  view: z.enum(['trending', 'new', 'popular']).default('popular'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GalleryQueryParams = z.infer<typeof GalleryQueryParamsSchema>;

export const AppSubmitSchema = z.object({
  html: z.string().min(1),
  signature: z.string().min(1),
  avoidGallery: z.boolean().default(false),
  title: z.string().min(1).max(255).default('Untitled'),
  description: z.string().max(1000).default(''),
});

export type AppSubmitData = z.infer<typeof AppSubmitSchema>;
