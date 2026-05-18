import { NextRequest, NextResponse } from "next/server";
import { ImageProxy } from "@/lib/constants";
import { BACKEND_URL } from "@/utils/backendConfig";

/**
 * Image proxy to serve images from HTTP backend through HTTPS
 * This solves mixed content issues in production (Vercel)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const imageUrl = searchParams.get("url");

        if (!imageUrl) {
            return NextResponse.json(
                { ok: false, error: "Missing image URL parameter" },
                { status: 400 },
            );
        }

        // Validate that the URL is from our trusted backend
        const allowedOrigins = [BACKEND_URL];

        const isAllowed = allowedOrigins.some((origin) =>
            imageUrl.startsWith(`${origin}/`),
        );

        if (!isAllowed) {
            return NextResponse.json(
                { ok: false, error: "Invalid image URL" },
                { status: 403 },
            );
        }

        // Fetch the image from the backend
        const response = await fetch(imageUrl, {
            headers: {
                Accept: "image/*",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { ok: false, error: "Failed to fetch image" },
                { status: response.status },
            );
        }

        // Enforce size limit
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > ImageProxy.MAX_SIZE_BYTES) {
            return NextResponse.json(
                { ok: false, error: "Image too large" },
                { status: 413 },
            );
        }

        const imageBuffer = await response.arrayBuffer();

        // Double-check after read (in case content-length was missing)
        if (imageBuffer.byteLength > ImageProxy.MAX_SIZE_BYTES) {
            return NextResponse.json(
                { ok: false, error: "Image too large" },
                { status: 413 },
            );
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
