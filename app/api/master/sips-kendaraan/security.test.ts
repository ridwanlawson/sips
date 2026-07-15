import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { validateSecurity } from '@/lib/security';
import { applyUserDataScope } from '@/utils/requestScope';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/lib/security', () => ({
  validateSecurity: vi.fn(),
}));

vi.mock('@/utils/absensiProxy', () => ({
  BACKEND_URL: 'http://backend.test',
  getTokenFromCookie: vi.fn(() => Promise.resolve('valid-token')),
}));

vi.mock('@/utils/requestScope', () => ({
  applyUserDataScope: vi.fn((req, sp) => sp),
}));

describe('SIPS Kendaraan API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return security error if validateSecurity fails (Rate Limit/CSRF)', async () => {
    const errorResponse = NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429 }
    );
    (validateSecurity as Mock).mockResolvedValue(errorResponse);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Too many requests');
  });

  it('should call applyUserDataScope for role-based scoping (CWE-285)', async () => {
    (validateSecurity as Mock).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: [] }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan?test=1');
    await GET(req);

    expect(validateSecurity).toHaveBeenCalled();
    expect(applyUserDataScope).toHaveBeenCalled();
  });

  it('should not leak upstream error details (CWE-209)', async () => {
    (validateSecurity as Mock).mockResolvedValue(null);
    const sensitiveError = 'Internal Server Error: DB connection failed';
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: sensitiveError }),
      json: async () => ({ message: sensitiveError }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch kendaraan data');
    expect(body.error).not.toContain(sensitiveError);
  });
});
