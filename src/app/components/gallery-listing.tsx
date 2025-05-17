import React from 'react';
import { cn } from "@/lib/utils";
import Link from "next/link";
import useSWR from "swr";
import { getOgImageUrl } from "@/lib/utils";
import { ThumbsUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

interface GalleryItemWithUpvotes {
  sessionId: string;
  version: string;
  title: string;
  description: string;
  upvoteCount: number;
  createdAt: string;
}

interface GalleryListingProps {
  limit?: number;
  view?: "trending" | "popular" | "new";
}

// Helper function to safely format dates
function tryFormatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return `${formatDistanceToNow(date)} ago`;
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Some time ago';
  }
}

export function GalleryListing({
  limit,
  view = "popular",
}: GalleryListingProps) {
  // Use a ref to track the previous view to prevent unnecessary re-renders
  const prevViewRef = React.useRef(view);
  const [displayedGallery, setDisplayedGallery] = React.useState<GalleryItemWithUpvotes[]>([]);

  const { data: gallery, isLoading } = useSWR<GalleryItemWithUpvotes[]>(
    view ? `/api/apps?view=${view}` : null,
    async (url) => {
      console.log('Fetching gallery from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch gallery:', response.status, errorText);
        throw new Error(`Failed to fetch gallery: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Match the server-side cache of 30 seconds
    }
  );

  // Update displayed gallery when gallery data changes or view changes
  React.useEffect(() => {
    if (gallery) {
      setDisplayedGallery(limit ? gallery.slice(0, limit) : gallery);
    }
  }, [gallery, limit]);

  // Reset displayed gallery when view changes
  React.useEffect(() => {
    if (view !== prevViewRef.current) {
      setDisplayedGallery([]);
      prevViewRef.current = view;
    }
  }, [view]);

  if (isLoading && !displayedGallery.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Spinner className="mx-auto" />
      </div>
    );
  }

  if (!isLoading && !displayedGallery.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        {view === "trending"
          ? "No trending apps in the last 24 hours"
          : "No apps found"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 md:gap-6 xl:gap-8 justify-items-center">
      {displayedGallery
        .filter((item) => item?.sessionId)
        .map((item) => (
          <div
            key={item.sessionId}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link
              href={`/apps/${item.sessionId}/${item.version}`}
              target="_blank"
              className="block w-[150px] md:w-[200px] xl:w-[250px]"
            >
              <div
                className={cn(
                  "bg-blue-500 h-[150px] bg-[url('/images/placeholder.png')] bg-cover bg-center",
                  "h-[150px] md:h-[200px] xl:h-[250px]"
                )}
                style={{
                  backgroundImage: `url(${getOgImageUrl(
                    item.sessionId,
                    item.version
                  )})`,
                }}
              />
              <div className="p-2 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" title={item.title}>
                      {item.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm opacity-70 shrink-0">
                    <ThumbsUp size={14} />
                    <span>{item.upvoteCount}</span>
                  </div>
                </div>
                <div className="text-xs opacity-50 h-[95px] overflow-hidden text-ellipsis line-clamp-6">
                  {item.description}
                </div>
                <div className="flex items-center gap-1 text-xs opacity-50 mt-auto">
                  <Clock size={12} />
                  <span>
                    {item.createdAt
                      ? tryFormatDate(item.createdAt)
                      : 'Some time ago'}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
    </div>
  );
}
