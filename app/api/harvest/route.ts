import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildFilteredUrl, getTokenFromCookie, safeJson, BACKEND_URL } from "@/utils/absensiProxy";
import { applyUserDataScope } from "@/utils/requestScope";
import { authHeaders, isRecord, extractMessage, parseJsonSafe } from "@/lib/apiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HARVEST_BASE = `${BACKEND_URL}/api/apps/panens`;

const querySchema = z.object({
    tanggal: z.string().optional(),
    tanggal_end: z.string().optional(),
    fcba: z.string().optional(),
    afdeling: z.string().optional(),
    status_harvesting: z.string().optional(),
    kemandoran: z.string().optional(),
    nodokumen: z.string().optional(),
    kode_karyawan: z.string().optional(),
    tph: z.string().optional(),
}).passthrough();

export async function POST(req: NextRequest): Promise<NextResponse> {
    const token = await getTokenFromCookie();
    if (!token) {
        return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const incoming = await req.formData();
    const upstream = await fetch(HARVEST_BASE, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: incoming,
    });

    const data = await safeJson(upstream);
    if (!upstream.ok) {
        return NextResponse.json({ ok: false, error: data?.message || "Create failed" }, { status: upstream.status });
    }
    return NextResponse.json({ ok: true, data });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = await getTokenFromCookie();
    if (!token) {
        return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const validated = querySchema.safeParse(rawParams);
    if (!validated.success) {
        return NextResponse.json(
            { ok: false, error: "Invalid query parameters", details: validated.error.format() },
            { status: 400 },
        );
    }

    const sp = new URLSearchParams(req.nextUrl.searchParams.toString());
    applyUserDataScope(req, sp);

    const upstreamUrl = buildFilteredUrl(HARVEST_BASE, sp);

    const upstream = await fetch(upstreamUrl, {
        headers: authHeaders(token),
        cache: "no-store",
    });

    const { data, parseError } = await parseJsonSafe(upstream);
    if (parseError) {
        return NextResponse.json({ ok: false, error: "Invalid response format" }, { status: 502 });
    }

    if (!upstream.ok) {
        return NextResponse.json({ ok: false, error: extractMessage(data, "Fetch failed") }, { status: upstream.status });
    }

    if (isRecord(data) && Array.isArray(data.data)) {
        return NextResponse.json({ ok: true, data: data.data, message: data.message ?? "OK" });
    }

    return NextResponse.json({ ok: true, data: [], message: "OK" });
}
