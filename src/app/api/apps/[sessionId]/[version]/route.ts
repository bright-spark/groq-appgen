import { NextRequest, NextResponse } from "next/server";
import { getFromStorageWithRegex, saveToStorage, getStorageKey, addToGallery, isIPBlocked } from "@/server/storage";
import { verifyHtml } from "@/server/signing";

export async function GET(
	request: NextRequest,
	{ params }: { params: { sessionId: string; version: string } },
) {
	const { sessionId, version } = params;
	const raw = request.nextUrl.searchParams.get("raw") === "true";

	try {
		// Get the IP for the storage key
		const ip = request.headers.get("x-forwarded-for") || request.ip || "unknown";
		const key = await getStorageKey(sessionId, version, ip);
		
		// Try to get the exact match first
		const { value } = await getFromStorageWithRegex(key);

		if (!value) {
			// If not found, try to find any version of this session
			const sessionKey = await getStorageKey(sessionId, '*');
			const { value: sessionValue } = await getFromStorageWithRegex(sessionKey);
			
			if (!sessionValue) {
				return NextResponse.json({ error: "Not found" }, { status: 404 });
			}
			
			const data = JSON.parse(sessionValue);
			if (raw) {
				return new NextResponse(data.html, {
					headers: { "Content-Type": "text/html" },
				});
			}
			return NextResponse.json(data);
		}

		const data = JSON.parse(value);
		if (raw) {
			return new NextResponse(data.html, {
				headers: { "Content-Type": "text/html" },
			});
		}
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error retrieving app:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve app" },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { sessionId: string; version: string } },
) {
	const { sessionId, version } = params;

	try {
		const { html, signature, avoidGallery, ...rest } = await request.json();
		const ip = request.headers.get("x-forwarded-for") || request.ip || "unknown";

		if (await isIPBlocked(ip)) {
			console.warn(`Someone tried to submit from a blocked IP: ${ip}`);
			return NextResponse.json(
				{ error: "IP address is blocked" },
				{ status: 403 }
			);
		}

		// Generate the storage key
		const key = await getStorageKey(sessionId, version, ip);

		if (!verifyHtml(html, signature)) {
			return NextResponse.json(
				{ error: "Invalid signature" },
				{ status: 400 }
			);
		}

		// Prepare the data for storage
		const storageData = {
			html,
			signature,
			...rest,
			creatorIP: ip,
			createdAt: new Date().toISOString(),
		};

		// Add title and description if missing
		if (!storageData.title) {
			storageData.title = 'Untitled';
		}
		if (!storageData.description) {
			storageData.description = 'A shared app';
		}

		// Save with explicit sessionId and version
		console.log('Attempting to save to storage...');
		try {
			const success = await saveToStorage({ sessionId, version }, JSON.stringify(storageData));
			if (!success) {
				console.error('Failed to save to storage: saveToStorage returned false');
				throw new Error('Failed to save to storage');
			}
			console.log('Successfully saved to storage');

			try {
				if (!avoidGallery) {
					console.log('Attempting to add to gallery...');
					await addToGallery({ 
						session_id: sessionId,
						version, 
						title: rest.title || 'Untitled',
						description: rest.description || '',
						signature,
						created_at: new Date().toISOString(),
					}, ip);
				}

				console.log('Sending success response');
				return new Response(JSON.stringify({ 
					success: true,
					sessionId,
					version
				}), {
					headers: { 'Content-Type': 'application/json' },
					status: 200
				});

			} catch (galleryError) {
				console.error('Error adding to gallery:', {
					error: galleryError instanceof Error ? galleryError.message : 'Unknown error',
					stack: galleryError instanceof Error ? galleryError.stack : undefined
				});
				// Still return success since the main save was successful
				return new Response(JSON.stringify({ 
					success: true,
					warning: 'Saved but could not add to gallery',
					sessionId,
					version
				}), {
					headers: { 'Content-Type': 'application/json' },
					status: 200
				});
			}

		} catch (saveError) {
			console.error('Error in saveToStorage:', {
				error: saveError instanceof Error ? saveError.message : 'Unknown error',
				stack: saveError instanceof Error ? saveError.stack : undefined,
				sessionId,
				version,
				storageData: {
					...storageData,
					html: storageData.html ? `${storageData.html.substring(0, 100)}...` : 'empty'
				}
			});
			
			return new Response(JSON.stringify({ 
				success: false,
				error: 'Failed to save to storage',
				details: saveError instanceof Error ? saveError.message : 'Unknown error'
			}), {
				headers: { 'Content-Type': 'application/json' },
				status: 500
			});
		}

	} catch (error) {
		console.error("Error in POST handler:", error);
		return NextResponse.json(
			{ 
				success: false,
				error: "Internal server error",
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
