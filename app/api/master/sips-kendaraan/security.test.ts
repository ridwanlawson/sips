import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { validateSecurity } from '@/lib/security';
import { getTokenFromCookie } from '@/utils/absensiProxy';

vi.mock('@/lib/security', () => ({
  validateSecurity: vi.fn(),
}));

vi.mock('@/utils/absensiProxy', () => ({
  BACKEND_URL: 'http://trusted-backend.com',
  getTokenFromCookie: vi.fn(),
}));

vi.mock('@/lib/apiProxy', () => ({
  authHeaders: vi.fn(() => ({ Authorization: 'Bearer mock-token' })),
  parseJsonSafe: vi.fn(async () => ({ data: [], parseError: null })),
  isRecord: vi.fn((d) => typeof d === 'object' && d !== null),
}));

describe('SIPS Kendaraan API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTokenFromCookie as any).mockResolvedValue('mock-token');
    (validateSecurity as any).mockResolvedValue(null);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
      text: async () => JSON.stringify({ ok: true, data: [] }),
    });
  });

  it('should call validateSecurity', async () => {
    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    await GET(req);
    expect(validateSecurity).toHaveBeenCalledWith(req);
  });

  it('should return 401 if unauthenticated', async () => {
    (getTokenFromCookie as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/master/sips-kendaraan');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
