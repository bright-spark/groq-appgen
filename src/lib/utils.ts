import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ROOT_URL } from "@/utils/config";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Fallback placeholder image
const FALLBACK_IMAGE = '/images/placeholder.png';

export function getOgImageUrl(sessionId: string, version: string): string {
  if (!sessionId || !version) {
    return FALLBACK_IMAGE;
  }
  
  try {
    // Try to use the thumbnail service first
    const url = new URL(`/api/apps/${sessionId}/${version}/raw`, ROOT_URL).toString();
    return `https://image.thum.io/get/width/400/crop/800/${encodeURIComponent(url)}`;
  } catch (error) {
    console.error('Error generating image URL:', error);
    return FALLBACK_IMAGE;
  }
}
