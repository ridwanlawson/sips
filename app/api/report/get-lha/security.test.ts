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
  proxyGet: vi.fn(async () => ({ ok: true })),
  unauthorizedResponse: vi.fn(() => ({ status: 401 })),
}));

describe('Get LHA API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTokenFromCookie as any).mockResolvedValue('mock-token');
    (validateSecurity as any).mockResolvedValue(null);
  });

  it('should call validateSecurity', async () => {
    const req = new NextRequest('http://localhost/api/report/get-lha');
    await GET(req);
    expect(validateSecurity).toHaveBeenCalledWith(req);
  });

  it('should return 401 if unauthenticated', async () => {
    (getTokenFromCookie as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/report/get-lha');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
