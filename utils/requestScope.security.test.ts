import { describe, it, expect } from 'vitest';
import { applyUserDataScope } from '@/utils/requestScope';
import { NextRequest } from 'next/server';
import { CookieName } from '@/lib/constants';

describe('Broken Access Control - Security Fix Verification', () => {
  it('should FAIL SECURELY when level is missing (no longer admin access)', async () => {
    const req = new NextRequest('http://localhost/api/test');
    // NO user_Level cookie
    const sp = new URLSearchParams('fcba=TARGET&afdeling=TARGET');

    applyUserDataScope(req, sp);

    // FIX: Should now be scoped to 'NONE'
    expect(sp.get('fcba')).toBe('NONE');
  });

  it('should prioritize SECURE cookies over manipulated client cookies', async () => {
    const req = new NextRequest('http://localhost/api/test');
    req.cookies.set(CookieName.USER_LEVEL, 'ADM'); // Attacker tries to be admin
    req.cookies.set(CookieName.SECURE_USER_LEVEL, 'MDP'); // Trusted role is Mandor
    req.cookies.set(CookieName.SECURE_USER_FCBA, 'TRUSTED_FCBA');

    const sp = new URLSearchParams('fcba=ATTACK_FCBA');

    applyUserDataScope(req, sp);

    // Should be scoped by trusted Mandor role, not manipulated Admin role
    expect(sp.get('fcba')).toBe('TRUSTED_FCBA');
  });

  it('should still allow legitimate admins', async () => {
    const req = new NextRequest('http://localhost/api/test');
    req.cookies.set(CookieName.SECURE_USER_LEVEL, 'ADM');

    const sp = new URLSearchParams('fcba=TARGET');

    applyUserDataScope(req, sp);

    expect(sp.get('fcba')).toBe('TARGET'); // Unscoped as admin
  });
});
