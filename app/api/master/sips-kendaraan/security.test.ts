import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { validateSecurity } from '@/lib/security';
import { applyUserDataScope } from '@/utils/requestScope';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/lib/security', () => ({
  validateSecurity: vi.fn(),
}));

vi.mock('@/utils/requestScope', () => ({
  applyUserDataScope: vi.fn((req, searchParams) => searchParams),
}));

vi.mock('@/utils/absensiProxy', () => ({
  BACKEND_URL: 'http://trusted-backend.com',
  getTokenFromCookie: vi.fn(() => Promise.resolve('valid-token')),
}));

describe('Kendaraan Master API Security Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return security error if validateSecurity fails', async () => {
    const errorResponse = new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), {
      status: 429,
    }) as unknown as NextResponse;
    vi.mocked(validateSecurity).mockResolvedValue(errorResponse);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Too many requests');
    expect(validateSecurity).toHaveBeenCalled();
  });

  it('should apply data scoping to the request', async () => {
    vi.mocked(validateSecurity).mockResolvedValue(null);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: [] }),
      json: async () => ({ ok: true, data: [] }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan?test=1');
    vi.mocked(applyUserDataScope).mockImplementation((req, searchParams) => {
      searchParams.set('fcba', 'FORCED_FCBA');
      return searchParams;
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(validateSecurity).toHaveBeenCalled();
    expect(applyUserDataScope).toHaveBeenCalled();

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchUrl = fetchCall[0] as string;
    expect(fetchUrl).toContain('fcba=FORCED_FCBA');
  });

  it('should use getTokenFromCookie for authentication', async () => {
    vi.mocked(validateSecurity).mockResolvedValue(null);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: [] }),
      json: async () => ({ ok: true, data: [] }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    await GET(req);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer valid-token');
  });
});
