import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy to serve images from HTTP backend through HTTPS
 * This solves mixed content issues in production (Vercel)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing image URL parameter' },
                { status: 400 }
            );
        }

        // Validate that the URL is from our trusted backend
        if (!imageUrl.startsWith('http://dev.skj.my.id:82/')) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 403 }
            );
        }

        // Fetch the image from the backend
        const response = await fetch(imageUrl, {
            headers: {
                'Accept': 'image/*',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch image' },
                { status: response.status }
            );
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
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
