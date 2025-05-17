import { getFromStorageWithRegex, getStorageKey } from "@/server/storage";
import type { Metadata } from "next";
import { ROOT_URL } from "@/utils/config";
import { headers } from "next/headers";

interface LayoutProps {
	children: React.ReactNode;
	params: {
		sessionId: string;
		version: string;
	};
}

export async function generateMetadata({
	params,
}: LayoutProps): Promise<Metadata> {
	const { sessionId, version } = params;

	try {
		const headersList = headers();
		const ip = headersList.get('x-forwarded-for') || 'unknown';
		
		// Get the storage key
		const key = await getStorageKey(sessionId, version, ip);
		
		// Try to get the exact match first
		const { value } = await getFromStorageWithRegex(key);
		
		if (!value) {
			// If not found, try to find any version of this session
			const sessionKey = await getStorageKey(sessionId, '*', ip);
			const { value: sessionValue } = await getFromStorageWithRegex(sessionKey);
			
			if (!sessionValue) {
				return {};
			}
			
			const data = JSON.parse(sessionValue);
			return {
				title: data.title || 'App',
				description: data.description || 'A shared app',
				openGraph: {
					title: data.title || 'Shared App',
					description: data.description || 'Check out this shared app',
					images: `https://image.thum.io/get/${ROOT_URL}/api/apps/${sessionId}/${version}/raw`,
					type: "website",
				},
			};
		}

		const data = JSON.parse(value);
		return {
			title: data.title || 'App',
			description: data.description || 'A shared app',
			openGraph: {
				title: data.title || 'Shared App',
				description: data.description || 'Check out this shared app',
				images: `https://image.thum.io/get/${ROOT_URL}/api/apps/${sessionId}/${version}/raw`,
				type: "website",
			},
		};
	} catch (error) {
		console.error("Error generating metadata:", error);
	}

	return {};
}

export default function Layout({ children, params }: LayoutProps) {
	return <>{children}</>;
}
