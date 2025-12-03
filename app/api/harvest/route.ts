import { NextRequest, NextResponse } from "next/server";
import {
    buildFilteredUrl,
    getTokenFromCookie,
} from "@/utils/absensiProxy";

export const dynamic = "force-dynamic"; // no cache
export const runtime = "nodejs";

const HARVEST_BASE = "http://dev.skj.my.id:82/api/apps/panens";

// --- type guards ---
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}
function isSuccessArrayData(
    v: unknown
): v is { success?: boolean; message?: string; data: unknown[] } {
    return isRecord(v) && Array.isArray(v.data);
}

export async function GET(req: NextRequest) {
    const token = await getTokenFromCookie();
    if (!token) {
        return NextResponse.json(
            { ok: false, error: "Unauthenticated" },
            { status: 401 }
        );
    }

    // Clone searchParams supaya bisa dimodifikasi
    const sp = new URLSearchParams(req.nextUrl.searchParams.toString());

    // ==== BACA DATA DARI COOKIE UNTUK LEVEL, FCBA, AFDELING ====
    const cookies = req.cookies;

    const rawLevel =
        cookies.get("user_Level")?.value ||
        cookies.get("user_LEVEL")?.value ||
        cookies.get("user_level")?.value ||
        "";
    const level = rawLevel.toUpperCase() as "ADM" | "MGR" | "AST" | string;

    const homeFcba =
        cookies.get("user_Fcba")?.value ||
        cookies.get("user_FCBA")?.value ||
        cookies.get("user_fcba")?.value ||
        "";

    const homeAfdeling =
        cookies.get("user_Section")?.value ||
        cookies.get("user_SECTION")?.value ||
        cookies.get("user_section")?.value ||
        cookies.get("user_Afdeling")?.value ||
        cookies.get("user_afdeling")?.value ||
        "";

    // ==== ATURAN SCOPING DATA BERDASARKAN LEVEL ====
    if (level === "MGR") {
        if (homeFcba) {
            sp.set("fcba", homeFcba);
        }
    } else if (level === "AST") {
        if (homeFcba) {
            sp.set("fcba", homeFcba);
        }
        if (homeAfdeling) {
            sp.set("afdeling", homeAfdeling);
        }
    }

    // Build URL final ke API harvest upstream
    const upstreamUrl = buildFilteredUrl(HARVEST_BASE, sp);

    try {
        const upstream = await fetch(upstreamUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        const text = await upstream.text();

        let data: unknown = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            return NextResponse.json(
                { ok: false, error: "Invalid response format", debug_response: text },
                { status: 502 }
            );
        }

        if (!upstream.ok) {
            const message =
                isRecord(data) && typeof data.message === "string"
                    ? data.message
                    : "Fetch failed";
            return NextResponse.json(
                { ok: false, error: message, debug_response: data },
                { status: upstream.status }
            );
        }

        if (isSuccessArrayData(data)) {
            return NextResponse.json({
                ok: true,
                data: data.data,
                message: data.message,
            });
        }

        if (isRecord(data)) {
            const arr = Array.isArray(data.data) ? data.data : [];
            const message = typeof data.message === "string" ? data.message : "OK";
            return NextResponse.json({ ok: true, data: arr, message });
        }

        return NextResponse.json({ ok: true, data: [], message: "OK" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json(
            { ok: false, error: msg },
            { status: 500 }
        );
    }
}
