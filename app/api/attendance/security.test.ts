import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/utils/absensiProxy', () => ({
  ABSENSI_BASE: 'http://trusted-backend.com/api/attendance',
  getTokenFromCookie: vi.fn(() => Promise.resolve('valid-token')),
  buildFilteredUrl: vi.fn((base, params) => `${base}?${params.toString()}`),
  safeJson: vi.fn(),
}));

describe('Attendance API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return generic error message and not leak upstream details on failure', async () => {
    const req = new NextRequest('http://localhost/api/attendance');
    req.cookies.set('auth_token', 'valid-token');

    // Mock upstream failure with sensitive info
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Sensitive database error at 192.168.1.50' }),
    } as Response);

    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();

    // Should NOT contain the sensitive error text
    expect(data.error).toBe('Failed to fetch attendance data');
    expect(data.ok).toBe(false);
  });

  it('should enforce data scoping for non-admin users (Broken Access Control)', async () => {
    const req = new NextRequest('http://localhost/api/attendance?fcba=OTHER_FCBA&gang=OTHER_GANG');
    req.cookies.set('auth_token', 'valid-token');
    req.cookies.set('user_Level', 'MDP'); // MANDOR
    req.cookies.set('user_Fcba', 'MY_FCBA');
    req.cookies.set('user_Gang', 'MY_GANG');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: [] }),
    } as Response);

    await GET(req);

    const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
    const params = new URL(callUrl).searchParams;

    // Both should be overridden by applyUserDataScope
    expect(params.get('fcba')).toBe('MY_FCBA');
    expect(params.get('gang')).toBe('MY_GANG');
  });
});
