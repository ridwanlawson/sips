import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { validateSecurity } from '@/lib/security';

vi.stubGlobal('fetch', vi.fn());

vi.mock('@/lib/security', () => ({
  validateSecurity: vi.fn(),
}));

vi.mock('@/utils/absensiProxy', () => ({
  ABSENSI_BASE: 'http://trusted-backend.com/api/attendance',
  getTokenFromCookie: vi.fn(() => Promise.resolve('valid-token')),
  safeJson: vi.fn(),
}));

describe('Attendance API POST Security Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return security error if validateSecurity fails', async () => {
    const errorResponse = new Response(JSON.stringify({ ok: false, error: 'Security fail' }), {
      status: 403,
    }) as unknown as NextResponse;
    vi.mocked(validateSecurity).mockResolvedValue(errorResponse);

    const req = new NextRequest('http://localhost/api/attendance', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Security fail');
  });

  it('should proceed if validateSecurity passes', async () => {
    vi.mocked(validateSecurity).mockResolvedValue(null);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    } as Response);

    const formData = new FormData();
    formData.append('test', 'value');

    const req = new NextRequest('http://localhost/api/attendance', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(validateSecurity).toHaveBeenCalled();
  });
});
