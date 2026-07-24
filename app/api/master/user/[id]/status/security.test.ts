import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { PATCH } from './route';
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

describe('User Status API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Reset default mock implementations to prevent leakage/pollution
    (validateSecurity as Mock).mockResolvedValue(null);
    (getTokenFromCookie as Mock).mockResolvedValue('valid-token');
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'SECURE_USER_LEVEL') return { value: 'ADM' };
        return null;
      }),
    });
  });

  const context = { params: Promise.resolve({ id: '123' }) };

  it('should return security error if validateSecurity fails', async () => {
    const errorResponse = new Response(JSON.stringify({ ok: false, error: 'Security fail' }), {
      status: 403,
    }) as unknown as NextResponse;

    (validateSecurity as Mock).mockResolvedValue(errorResponse);

    const req = new NextRequest('http://localhost/api/master/user/123/status', { method: 'PATCH' });
    const res = await PATCH(req, context);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Security fail');
  });

  it('should return 401 if no token', async () => {
    (getTokenFromCookie as Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/master/user/123/status', { method: 'PATCH' });
    const res = await PATCH(req, context);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthenticated');
  });

  it('should return 403 if non-admin tries to update status', async () => {
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'user_Level') return { value: 'MDR' };
        return null;
      }),
    });

    const req = new NextRequest('http://localhost/api/master/user/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Y' }),
    });
    const res = await PATCH(req, context);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should allow admin to update status', async () => {
    (cookies as Mock).mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'SECURE_USER_LEVEL') return { value: 'ADM' };
        return null;
      }),
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/user/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Y' }),
    });
    const res = await PATCH(req, context);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('should return generic error message on upstream failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Detailed SQL error: update failed on table users at 10.0.0.1' }),
    } as Response);

    const req = new NextRequest('http://localhost/api/master/user/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Y' }),
    });
    const res = await PATCH(req, context);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to update user status');
    expect(data.ok).toBe(false);
  });
});
