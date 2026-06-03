import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/utils/backendConfig', () => ({
  BACKEND_URL: 'http://backend.test',
}));

describe('App Update Check API Security', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should not leak upstream error message on failure (CWE-209)', async () => {
    const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
      method: 'POST',
      body: JSON.stringify({ version: '1.0.0' }),
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
    // The current implementation returns the error text if it fails to parse as JSON,
    // or if it parses as JSON but upstream.ok is not checked, it just returns it.
    // Actually, current implementation:
    // const data = await upstream.text();
    // let json;
    // try { json = data ? JSON.parse(data) : null; } catch { json = { message: data }; }
    // return NextResponse.json(json, { status: upstream.status });

    // So if sensitiveError is returned, it will be in body.message
    expect(body.message).not.toContain(sensitiveError);
    expect(body.message).toBe('Terjadi kesalahan saat memeriksa update aplikasi.');
  });
});

it('should return 500 if BACKEND_URL is missing', async () => {
  vi.mocked(await import('@/utils/backendConfig')).BACKEND_URL = '';

  const mockRequest = new NextRequest('http://localhost/api/app-update/check', {
    method: 'POST',
    body: JSON.stringify({ version: '1.0.0' }),
  });

  const response = await POST(mockRequest);
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(body.message).toBe('Terjadi kesalahan internal (konfigurasi).');
});
