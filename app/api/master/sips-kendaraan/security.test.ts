import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { validateSecurity } from '@/lib/security';
import { getTokenFromCookie } from '@/utils/absensiProxy';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/lib/security', () => ({
  validateSecurity: vi.fn(),
}));

vi.mock('@/utils/absensiProxy', () => ({
  BACKEND_URL: 'http://trusted-backend.com',
  getTokenFromCookie: vi.fn(),
}));

vi.mock('@/lib/apiProxy', () => ({
  authHeaders: vi.fn(() => ({ Authorization: 'Bearer valid-token' })),
  parseJsonSafe: vi.fn(async (res) => {
    try {
      const data = await res.json();
      return { data, parseError: null };
    } catch {
      return { data: null, parseError: 'error' };
    }
  }),
  isRecord: vi.fn((val) => val !== null && typeof val === 'object' && !Array.isArray(val)),
}));

describe('SIPS Kendaraan API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return security error if validateSecurity fails (Rate Limit/CSRF)', async () => {
    const errorRes = NextResponse.json({ error: 'Security error' }, { status: 403 });
    (validateSecurity as Mock).mockResolvedValue(errorRes);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Security error');
  });

  it('should return 401 if getTokenFromCookie fails', async () => {
    (validateSecurity as Mock).mockResolvedValue(null);
    (getTokenFromCookie as Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthenticated');
  });

  it('should return generic error message and not leak upstream details on failure (CWE-209)', async () => {
    (validateSecurity as Mock).mockResolvedValue(null);
    (getTokenFromCookie as Mock).mockResolvedValue('valid-token');

    // Mock upstream failure with sensitive info
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ sensitive: 'Internal Server Error: Database leak at 10.1.1.1' }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();

    // Should contain generic error text
    expect(data.error).toBe('Failed to fetch kendaraan data');
    expect(data.ok).toBe(false);
    // Should NOT leak sensitive upstream data
    expect(JSON.stringify(data)).not.toContain('10.1.1.1');
  });

  it('should proceed and return data if all checks pass', async () => {
    (validateSecurity as Mock).mockResolvedValue(null);
    (getTokenFromCookie as Mock).mockResolvedValue('valid-token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1, name: 'Kendaraan A' }] }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
