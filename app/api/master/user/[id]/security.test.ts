import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie } from '@/utils/api/absensiProxy';
import { cookies } from 'next/headers';
import { validateSecurity } from '@/lib/auth/security';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/utils/api/absensiProxy', () => ({
  getTokenFromCookie: vi.fn(),
  BACKEND_URL: 'http://trusted-backend.com',
}));

vi.mock('@/lib/auth/security', () => ({
  validateSecurity: vi.fn(),
}));

describe('User Detail API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Reset default mock implementations to prevent leakage/pollution
    (validateSecurity as Mock).mockResolvedValue(null);
    (getTokenFromCookie as Mock).mockResolvedValue('valid-token');
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'log_id') return { value: '123' };
        if (name === 'user_Level') return { value: 'MDR' };
        return null;
      }),
    });
  });

  const context = { params: Promise.resolve({ id: '123' }) };

  it('should return 429 if rate limit exceeded', async () => {
    (validateSecurity as Mock).mockResolvedValue(
      NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Too many requests');
  });

  it('should return 401 if unauthenticated', async () => {
    (getTokenFromCookie as Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthenticated');
  });

  it('should return 403 (IDOR) if non-admin tries to access other profile', async () => {
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'log_id') return { value: '999' };
        if (name === 'user_Level') return { value: 'MDR' };
        return null;
      }),
    });

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should allow access if user accesses their own profile', async () => {
    // Already mocked log_id to 123 in beforeEach
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'Test User' }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('should allow admin to access any profile', async () => {
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'log_id') return { value: '999' };
        if (name === 'SECURE_USER_LEVEL') return { value: 'ADM' };
        return null;
      }),
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'Test User' }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('should return generic error message on upstream failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'DB error: timeout connecting to 10.0.0.5' }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/user/123');
    const res = await GET(req, context);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to fetch user data');
    expect(data.ok).toBe(false);
  });
});
