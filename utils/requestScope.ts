import type { NextRequest } from 'next/server';
import { UserLevel, CookieName } from '@/lib/constants';

type GangParam = 'gang' | 'gangcode' | 'kemandoran';

type ApplyUserDataScopeOptions = {
  gangParam?: GangParam;
};

const ADMIN_LEVELS = new Set<string>([UserLevel.ADMIN]);
const FCBA_LEVELS = new Set<string>([UserLevel.MANAGER, UserLevel.KSI]);
const AFDELING_LEVELS = new Set<string>([
  UserLevel.MD1,
  UserLevel.ASISTEN,
  UserLevel.KRT,
  UserLevel.KRA,
]);
const GANG_LEVELS = new Set<string>([UserLevel.KEPALA_REGU_PANEN, UserLevel.MANDOR]);

function getCookieValue(req: NextRequest, names: string[]) {
  for (const name of names) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return '';
}

function normalizeLevel(level: string) {
  const upperLevel = level.toUpperCase();
  return upperLevel === 'ADMIN' ? UserLevel.ADMIN : upperLevel;
}

export function applyUserDataScope(
  req: NextRequest,
  searchParams: URLSearchParams,
  options: ApplyUserDataScopeOptions = {}
) {
  // SECURITY: Prioritize secure httpOnly cookies for authorization decisions (CWE-807)
  const level = normalizeLevel(
    getCookieValue(req, [CookieName.SECURE_USER_LEVEL, 'user_Level', 'user_LEVEL', 'user_level'])
  );

  if (!level || ADMIN_LEVELS.has(level)) return searchParams;

  const fcba = getCookieValue(req, [CookieName.SECURE_USER_FCBA, 'user_Fcba', 'user_FCBA', 'user_fcba']);
  const afdeling = getCookieValue(req, [
    CookieName.SECURE_USER_AFDELING,
    'user_Afdeling',
    'user_AFDELING',
    'user_afdeling',
    'user_Section',
    'user_SECTION',
    'user_section',
  ]);
  const gang = getCookieValue(req, [
    CookieName.SECURE_USER_GANG,
    'user_Gang',
    'user_GANG',
    'user_gang',
    'user_GangCode',
    'user_GANGCODE',
    'user_gangcode',
    'user_GANG_CODE',
    'user_gang_code',
  ]);

  if (FCBA_LEVELS.has(level) || AFDELING_LEVELS.has(level) || GANG_LEVELS.has(level)) {
    if (fcba) searchParams.set('fcba', fcba);
  }

  if (AFDELING_LEVELS.has(level) || GANG_LEVELS.has(level)) {
    if (afdeling) searchParams.set('afdeling', afdeling);
  }

  if (GANG_LEVELS.has(level)) {
    const gangParam = options.gangParam || 'kemandoran';
    if (gang) searchParams.set(gangParam, gang);
  }

  return searchParams;
}
