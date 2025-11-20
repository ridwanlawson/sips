import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Image proxy to bypass CORS restrictions
 * Fetches images from external server and serves them through our domain
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return new NextResponse('Missing image URL', { status: 400 });
        }

        // Validate URL is from allowed domain
        if (!imageUrl.startsWith('http://dev.skj.my.id:82/')) {
            return new NextResponse('Invalid image URL', { status: 400 });
        }

        // Fetch the image from external server
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        });

        if (!response.ok) {
            return new NextResponse('Image not found', { status: 404 });
        }

        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
