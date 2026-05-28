import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.stubGlobal("fetch", vi.fn());

vi.mock("@/utils/absensiProxy", () => ({
    BACKEND_URL: "http://trusted-backend.com",
    getTokenFromCookie: vi.fn(() => Promise.resolve("valid-token")),
}));

describe("TPH API Security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return generic error message and not leak upstream details on failure", async () => {
        const req = new NextRequest("http://localhost/api/tph?fcba=FCBA01");
        req.cookies.set("auth_token", "valid-token");

        // Mock upstream failure with sensitive info
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ message: "Sensitive database error at 192.168.1.50" }),
        } as Response);

        const res = await GET(req);

        expect(res.status).toBe(500);
        const data = await res.json();

        // This assertion is expected to FAIL currently as the implementation leaks the error
        expect(data.error).toBe("Failed to fetch TPH data");
        expect(data.ok).toBe(false);
    });
});
