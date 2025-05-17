import { NextRequest, NextResponse } from "next/server";
import { getGallery } from "@/server/storage";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		console.log('Fetching gallery from database...');
		const gallery = await getGallery();
		console.log(`Fetched ${gallery.length} gallery items`);
		
		const searchParams = request.nextUrl.searchParams;
		const view = searchParams.get("view") || "popular";
		const now = new Date();
		
		console.log(`View: ${view}, Current time: ${now.toISOString()}`);
		
		// Transform the items to match the expected format
		let sortedGallery = gallery.map(item => ({
			...item,
			upvoteCount: typeof item.upvotes === 'number' ? item.upvotes : 0,
			upvotes: undefined, // Remove IP addresses from response
			// Map the database fields to the expected format
			createdAt: item.created_at,
			sessionId: item.session_id,
			creatorIpHash: item.creator_ip_hash
		}));

		switch (view) {
			case "trending":
				// Filter for last 24 hours and sort by votes
				const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				sortedGallery = sortedGallery
					.filter(item => new Date(item.createdAt) >= twentyFourHoursAgo)
					.sort((a, b) => b.upvoteCount - a.upvoteCount);
				break;
			
			case "new":
				// Sort by creation date (newest first)
				sortedGallery = sortedGallery
					.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				break;
			
			case "popular":
			default:
				// Sort by total votes
				sortedGallery = sortedGallery
					.sort((a, b) => b.upvoteCount - a.upvoteCount);
				break;
		}

		console.log(`Returning ${sortedGallery.length} items for view: ${view}`);
		if (sortedGallery.length > 0) {
			console.log('First item sample:', {
				id: sortedGallery[0].id,
				sessionId: sortedGallery[0].sessionId,
				version: sortedGallery[0].version,
				title: sortedGallery[0].title,
				description: sortedGallery[0].description,
				upvoteCount: sortedGallery[0].upvoteCount,
				createdAt: sortedGallery[0].createdAt,
				signature: sortedGallery[0].signature
			});
		} else {
			console.log('No gallery items found in the database');
		}
		return NextResponse.json(sortedGallery);
	} catch (error) {
		console.error("Error fetching gallery:", error);
		return NextResponse.json(
			{ error: "Failed to fetch gallery" },
			{ status: 500 }
		);
	}
}
