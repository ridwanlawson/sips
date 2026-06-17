import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/csrf';
import { apiRateLimiter } from '@/lib/rateLimiter';

vi.mock('@/utils/backendConfig', () => ({
  BACKEND_URL: 'http://backend.test',
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: vi.fn(),
}));

vi.mock('@/lib/rateLimiter', () => ({
  apiRateLimiter: {
    consume: vi.fn(),
  },
}));

describe('App Update Check API Security', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();

    vi.mocked(cookies).mockReturnValue({
      // @ts-expect-error - mock internal cookies behavior
      get: (name: string) => (name === 'csrf_token' ? { value: 'valid-token' } : undefined),
    });
    vi.mocked(validateCsrfToken).mockReturnValue(true);
    vi.mocked(apiRateLimiter.consume).mockResolvedValue({});
  });

  it('should not leak upstream error message on failure (CWE-209)', async () => {
    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ action: 'check', platform: 'android', app_name: 'sipsmobile' }),
    });

    const sensitiveError =
      'Fatal error: Uncaught Error: Call to undefined function some_private_func() in /var/www/html/app_archive.asp:123';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => sensitiveError,
    } as Response);

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).not.toContain(sensitiveError);
    expect(body.message).toBe('Terjadi kesalahan saat memeriksa update aplikasi.');
  });

  it('should return 403 if CSRF token is missing or invalid', async () => {
    vi.mocked(validateCsrfToken).mockReturnValue(false);

    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ action: 'check', platform: 'android', app_name: 'sipsmobile' }),
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe('Invalid CSRF token');
  });

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(apiRateLimiter.consume).mockRejectedValue(new Error('Rate limit exceeded'));

    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ action: 'check', platform: 'android', app_name: 'sipsmobile' }),
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toContain('Terlalu banyak permintaan');
  });

  it('should return 400 if input is invalid', async () => {
    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'field' }),
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Input tidak valid.');
  });

  it('should return 500 if BACKEND_URL is missing', async () => {
    vi.mocked(await import('@/utils/backendConfig')).BACKEND_URL = '';

    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ action: 'check', platform: 'android', app_name: 'sipsmobile' }),
    });

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Terjadi kesalahan internal (konfigurasi).');
  });
});
