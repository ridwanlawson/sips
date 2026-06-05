import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { getTokenFromCookie } from '@/utils/absensiProxy';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/utils/absensiProxy', () => ({
  BACKEND_URL: 'http://trusted-backend.com',
  getTokenFromCookie: vi.fn(() => Promise.resolve('valid-token')),
  authHeaders: vi.fn(token => ({ Authorization: `Bearer ${token}` })),
  extractDataArray: vi.fn(json => json.data || []),
}));

describe('TPH API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getTokenFromCookie).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/tph?fcba=FCBA01');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBe('Not authenticated');
  });

  it('should return generic error message and not leak upstream details on failure', async () => {
    vi.mocked(getTokenFromCookie).mockResolvedValue('valid-token');
    const req = new NextRequest('http://localhost/api/tph?fcba=FCBA01');
    req.cookies.set('auth_token', 'valid-token');

    // Mock upstream failure with sensitive info
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Sensitive database error at 192.168.1.50' }),
    } as Response);

    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();

    // Should return generic error
    expect(data.error).toBe('Failed to fetch TPH data');
    expect(data.ok).toBe(false);
  });
});
