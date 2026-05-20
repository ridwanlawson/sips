import { NextRequest, NextResponse } from "next/server";
import { ImageProxy } from "@/lib/constants";
import { BACKEND_URL } from "@/utils/backendConfig";
import { getTokenFromCookie } from "@/utils/absensiProxy";

/**
 * Image proxy to serve images from HTTP backend through HTTPS
 * This solves mixed content issues in production (Vercel)
 */
export async function GET(request: NextRequest) {
    try {
        // SECURITY: Authentication check (CWE-306)
        // Proxy should only be accessible to authenticated users.
        const token = await getTokenFromCookie();
        if (!token) {
            return NextResponse.json(
                { ok: false, error: "Unauthenticated" },
                { status: 401 },
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const imageUrl = searchParams.get("url");

        if (!imageUrl) {
            return NextResponse.json(
                { ok: false, error: "Missing image URL parameter" },
                { status: 400 },
            );
        }

        // SECURITY: Robust origin validation (CWE-441 / CWE-918)
        // Ensure the URL is from our trusted backend by parsing it.
        try {
            const parsedUrl = new URL(imageUrl);
            const backendOrigin = new URL(BACKEND_URL).origin;

            if (parsedUrl.origin !== backendOrigin) {
                return NextResponse.json(
                    { ok: false, error: "Invalid image origin" },
                    { status: 403 },
                );
            }
        } catch {
            return NextResponse.json(
                { ok: false, error: "Malformed image URL" },
                { status: 400 },
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

        // SECURITY: Strict Content-Type validation (CWE-434 / CWE-79)
        // Prevent attackers from returning HTML/JS through the proxy.
        if (!contentType.startsWith("image/")) {
            return NextResponse.json(
                { ok: false, error: "Invalid content type from upstream" },
                { status: 415 },
            );
        }

        // Return the image with proper security headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                // SECURITY: Prevent MIME-sniffing (CWE-116)
                "X-Content-Type-Options": "nosniff",
                // SECURITY: Restrictive CSP for images (CWE-1021)
                "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
                // SECURITY: Use private cache for potentially sensitive user photos (PII)
                "Cache-Control": "private, max-age=86400",
            },
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
