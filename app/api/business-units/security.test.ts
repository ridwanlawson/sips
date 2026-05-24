import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.stubGlobal("fetch", vi.fn());

vi.mock("@/utils/absensiProxy", () => ({
    BACKEND_URL: "http://trusted-backend.com",
}));

describe("Business Units API Security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return generic error message and not leak upstream details on failure", async () => {
        const mockToken = "valid-token";
        const req = new NextRequest("http://localhost/api/business-units");
        // Mock cookie
        req.cookies.set("auth_token", mockToken);

        // Mock upstream failure with sensitive info
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error: Database connection failed at 10.0.0.5:5432",
        } as Response);

        const res = await GET(req);

        expect(res.status).toBe(500);
        const data = await res.json();

        // Should NOT contain the sensitive error text
        expect(data.error).toBe("Failed to fetch business units");
        expect(data.ok).toBe(false);
    });

    it("should return 401 if unauthorized", async () => {
        const req = new NextRequest("http://localhost/api/business-units");
        // No token cookie set

        const res = await GET(req);
        expect(res.status).toBe(401);
    });
});
