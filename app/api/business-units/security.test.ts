import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/utils/absensiProxy", () => ({
    BACKEND_URL: "http://trusted-backend.com",
}));

describe("Business Units API Security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("should NOT leak upstream error details", async () => {
        const sensitiveError = "SQL Error: Syntax error near '...'; StackTrace: ...";
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => sensitiveError,
        } as Response);

        const req = new NextRequest("http://localhost/api/business-units");
        req.cookies.set("auth_token", "valid-token");

        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        // Should return generic message
        expect(data.error).toBe("Failed to fetch business units");
        // Should NOT contain the sensitive error
        expect(data.error).not.toContain(sensitiveError);
    });
});
