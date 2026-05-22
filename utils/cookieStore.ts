/**
 * Centralized store for reading user info from cookies.
 * Handles inconsistent cookie naming conventions (e.g. user_Level vs user_level).
 */

export interface UserInfo {
  fullName: string;
  level: string;
  fcba: string;
  section: string;
  gang: string;
  photo: string;
}

const getCookie = (name: string): string => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? decodeURIComponent(match.pop() as string) : '';
};

const getInconsistentCookie = (variants: string[]): string => {
  for (const variant of variants) {
    const val = getCookie(variant);
    if (val) return val;
  }
  return '';
};

const normalizeLevel = (level: string): string => {
  const upperLevel = level.toUpperCase();
  return upperLevel === 'ADMIN' ? 'ADM' : upperLevel;
};

export const cookieStore = {
  getCookie: (name: string): string => getCookie(name),
  getFullName: () =>
    getInconsistentCookie(['user_FullName', 'user_fullname', 'user_Name', 'user_name']),
  getLevel: () => normalizeLevel(getInconsistentCookie(['user_Level', 'user_LEVEL', 'user_level'])),
  getFcba: () => getInconsistentCookie(['user_Fcba', 'user_FCBA', 'user_fcba']),
  getSection: () =>
    getInconsistentCookie([
      'user_Section',
      'user_SECTION',
      'user_section',
      'user_Afdeling',
      'user_afdeling',
    ]),
  getGang: () =>
    getInconsistentCookie([
      'user_Gang',
      'user_gang',
      'user_GANG',
      'user_GangCode',
      'user_GANGCODE',
      'user_gangcode',
      'user_GANG_CODE',
      'user_gang_code',
    ]),
  getPhoto: () => getInconsistentCookie(['user_Photo', 'user_photo']),
  getLocale: () => getCookie('NEXT_LOCALE') || 'en',
  /** Returns BCP 47 locale tag for use with toLocaleString / toLocaleDateString */
  getLocaleTag: (): string => {
    const locale = getCookie('NEXT_LOCALE') || 'en';
    const map: Record<string, string> = { id: 'id-ID', en: 'en-US' };
    return map[locale] ?? 'en-US';
  },

  setCookie: (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },

  getAllUserInfo: (): UserInfo => ({
    fullName: cookieStore.getFullName(),
    level: cookieStore.getLevel(),
    fcba: cookieStore.getFcba(),
    section: cookieStore.getSection(),
    gang: cookieStore.getGang(),
    photo: cookieStore.getPhoto(),
  }),
};
