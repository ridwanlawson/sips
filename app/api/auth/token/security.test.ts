import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";
import { cookies } from "next/headers";

vi.mock("@/utils/absensiProxy", () => ({
  getTokenFromCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/utils/backendConfig", () => ({
  BACKEND_URL: "http://trusted-backend.com",
}));

// Mock global fetch
global.fetch = vi.fn();

describe("Auth Token Route Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if token is missing", async () => {
    (getTokenFromCookie as Mock).mockResolvedValue(null);
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Unauthenticated");
  });

  it("should return 401 if user id is missing", async () => {
    (getTokenFromCookie as Mock).mockResolvedValue("valid-token");
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined), // log_id missing
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("should return 403 if user is not an admin", async () => {
    (getTokenFromCookie as Mock).mockResolvedValue("valid-token");
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === "log_id") return { value: "user123" };
        return undefined;
      }),
    });

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { level: "MGR" }, // Not ADM
      }),
    });

    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("Forbidden");
  });

  it("should return 200 and token if user is an admin", async () => {
    (getTokenFromCookie as Mock).mockResolvedValue("secret-jwt-token");
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === "log_id") return { value: "admin123" };
        return undefined;
      }),
    });

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { level: "ADM" }, // Admin level
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBe("secret-jwt-token");
  });

  it("should return profile error status if backend check fails", async () => {
    (getTokenFromCookie as Mock).mockResolvedValue("valid-token");
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === "log_id") return { value: "user123" };
        return undefined;
      }),
    });

    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 502,
    });

    const res = await GET();
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Failed to verify authorization");
  });
});
