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

		// Add creatorIP to the stored data
		const data = {
			html,
			signature,
			...rest,
			avoidGallery,
			creatorIP: ip,
			createdAt: new Date().toISOString(),
		};

		// Save with explicit sessionId and version instead of the generated key
		const success = await saveToStorage({ sessionId, version }, JSON.stringify(data));
		if (!success) {
			throw new Error('Failed to save to storage');
		}

		if (!avoidGallery) {
			let success = await addToGallery({ 
				session_id: sessionId, // Use snake_case for database fields
				version, 
				title: rest.title || 'Untitled',
				description: rest.description || '',
				signature,
				created_at: new Date().toISOString(), // Add created_at field
			}, ip);
			if(!success) {
				return NextResponse.json(
					{ error: "Failed to save app to gallery" },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving app:", error);
		return NextResponse.json(
			{ error: "Failed to save app" },
			{ status: 500 }
		);
	}
}
