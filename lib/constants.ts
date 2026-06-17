/**
 * Shared application constants.
 * Centralized to avoid magic strings scattered across the codebase.
 */

// User Levels
export const UserLevel = {
  ADMIN: 'ADM',
  MANAGER: 'MGR',
  KSI: 'KSI',
  MD1: 'MD1',
  ASISTEN: 'AST',
  KRT: 'KRT',
  KEPALA_REGU: 'KRT',
  KRA: 'KRA',
  KEPALA_REGU_PANEN: 'KRP',
  MANDOR: 'MDP',
} as const;

export type UserLevelValue = (typeof UserLevel)[keyof typeof UserLevel];

// Level Groups
export const LevelGroup = {
  ADMIN: new Set([UserLevel.ADMIN]),
  FCBA: new Set([UserLevel.MANAGER, UserLevel.KSI]),
  AFDELING: new Set([UserLevel.MD1, UserLevel.ASISTEN, UserLevel.KRT, UserLevel.KRA]),
  GANG: new Set([UserLevel.KEPALA_REGU_PANEN, UserLevel.MANDOR]),
  /** Levels that can see ALL FCBA (admin access) */
  ALL_ACCESS: new Set([UserLevel.ADMIN]),
  /** Levels that can see upload/approval pages */
  UPLOAD_ACCESS: new Set([UserLevel.ADMIN, UserLevel.MANAGER]),
  /** Levels that can approve */
  APPROVAL_ACCESS: new Set([UserLevel.ADMIN, UserLevel.MANAGER, UserLevel.MANDOR]),
} as const;

// API Response Convention
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Attendance Status
export const AttendanceCode = {
  IZIN: 'P1',
  MANGKIR: 'MK',
} as const;

export type ClassifiedStatus =
  | 'HADIR'
  | 'TEPAT_WAKTU'
  | 'TELAT'
  | 'PULANG_AWAL'
  | 'ALPHA'
  | 'OTHER';

// Pagination defaults
export const Pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const;

// Image Proxy
export const ImageProxy = {
  /** Max image size to proxy: 10MB */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

// Cookie Names (canonical)
export const CookieName = {
  AUTH_TOKEN: 'auth_token',
  LOG_ID: 'log_id',
  USER_FULL_NAME: 'user_FullName',
  USER_LEVEL: 'user_Level',
  USER_FCBA: 'user_Fcba',
  USER_AFDELING: 'user_Afdeling',
  USER_GANG: 'user_Gang',
  USER_KODE: 'user_Kode',
  USER_POSITION: 'user_Position',
  USER_PHOTO: 'user_Photo',
  SECURE_USER_LEVEL: 'SECURE_USER_LEVEL',
  SECURE_USER_FCBA: 'SECURE_USER_FCBA',
  SECURE_USER_AFDELING: 'SECURE_USER_AFDELING',
  SECURE_USER_GANG: 'SECURE_USER_GANG',
  NEXT_LOCALE: 'NEXT_LOCALE',
  OPT_TRIPLETS: 'opt_triplets',
  OPT_FCBA: 'opt_fcba',
  OPT_SECTION: 'opt_section',
  OPT_GANG: 'opt_gang',
} as const;
