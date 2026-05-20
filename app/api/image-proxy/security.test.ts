import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";

vi.mock("@/utils/absensiProxy", () => ({
    getTokenFromCookie: vi.fn(),
    BACKEND_URL: "http://trusted-backend.com",
    ABSENSI_BASE: "http://trusted-backend.com/api/absensi"
}));

vi.mock("@/utils/backendConfig", () => ({
    BACKEND_URL: "http://trusted-backend.com",
}));

describe("Image Proxy Security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        (getTokenFromCookie as Mock).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/image-proxy?url=http://trusted-backend.com/img.jpg");
        const res = await GET(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.ok).toBe(false);
        expect(data.error).toBe("Unauthenticated");
    });

    it("should return 403 if image origin is not trusted", async () => {
        (getTokenFromCookie as Mock).mockResolvedValue("valid-token");

        const req = new NextRequest("http://localhost/api/image-proxy?url=http://malicious-site.com/img.jpg");
        const res = await GET(req);

        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe("Invalid image origin");
    });

    it("should return 400 if image URL is malformed", async () => {
        (getTokenFromCookie as Mock).mockResolvedValue("valid-token");

        const req = new NextRequest("http://localhost/api/image-proxy?url=not-a-url");
        const res = await GET(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Malformed image URL");
    });
});
