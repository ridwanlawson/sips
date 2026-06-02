/**
 * Filter helper utility for role-based data filtering
 * Handles filter logic based on user level for Attendance, Transport, and LHM menus
 */

export type UserLevel =
  | 'ADM'
  | 'MGR'
  | 'KSI'
  | 'MD1'
  | 'AST'
  | 'KRT'
  | 'KRA'
  | 'KRP'
  | 'MDP'
  | 'OTHER';

export type MenuType = 'attendance' | 'transport' | 'lhm';

export interface FilterCriteria {
  fcba?: string;
  afdeling?: string;
  kemandoran?: string;
}

interface UserScope {
  level: UserLevel;
  fcba: string;
  afdeling: string;
  gang: string;
}

/**
 * Determines which filters should be applied based on user level and menu type
 *
 * Attendance menu:
 * - ADM: No filter (free)
 * - MGR, KSI: Filter by FCBA
 * - AST, KRA, MD1: Filter by FCBA and AFDELING
 * - MDP, KRT, KRP: Filter by FCBA, AFDELING, and KEMANDORAN
 *
 * Transport & LHM menus:
 * - ADM: No filter (free)
 * - MGR, KSI: Filter by FCBA
 * - AST, KRA, KRT, MD1: Filter by FCBA and AFDELING
 * - MDP, KRP: Filter by FCBA, AFDELING, and KEMANDORAN
 */
export function getFilterCriteria(userScope: UserScope, menuType: MenuType): FilterCriteria {
  const { level, fcba, afdeling, gang } = userScope;

  // ADM has no filter restrictions
  if (level === 'ADM') {
    return {};
  }

  const criteria: FilterCriteria = {};

  // All non-ADM levels have FCBA filter (except OTHER)
  if (level !== 'OTHER' && fcba) {
    criteria.fcba = fcba;
  }

  if (menuType === 'attendance') {
    // Attendance-specific logic
    if (['MGR', 'KSI'].includes(level)) {
      // Only FCBA
      return criteria;
    }

    if (['AST', 'KRA', 'MD1'].includes(level)) {
      // FCBA + AFDELING
      if (afdeling) criteria.afdeling = afdeling;
      return criteria;
    }

    if (['MDP', 'KRT', 'KRP'].includes(level)) {
      // FCBA + AFDELING + KEMANDORAN
      if (afdeling) criteria.afdeling = afdeling;
      if (gang) criteria.kemandoran = gang;
      return criteria;
    }
  } else {
    // Transport and LHM use same filter logic
    if (['MGR', 'KSI'].includes(level)) {
      // Only FCBA
      return criteria;
    }

    if (['AST', 'KRA', 'KRT', 'MD1'].includes(level)) {
      // FCBA + AFDELING
      if (afdeling) criteria.afdeling = afdeling;
      return criteria;
    }

    if (['MDP', 'KRP'].includes(level)) {
      // FCBA + AFDELING + KEMANDORAN
      if (afdeling) criteria.afdeling = afdeling;
      if (gang) criteria.kemandoran = gang;
      return criteria;
    }
  }

  return criteria;
}

/**
 * Determines which fields should be locked (read-only) based on user level and menu type
 */
export function getLockedFields(
  userLevel: UserLevel,
  menuType: MenuType
): {
  isFcbaLocked: boolean;
  isAfdelingLocked: boolean;
  isKemandoranLocked: boolean;
} {
  const isFcbaLocked = userLevel !== 'ADM' && userLevel !== 'OTHER';

  let isAfdelingLocked = false;
  let isKemandoranLocked = false;

  if (menuType === 'attendance') {
    isAfdelingLocked = !(
      userLevel === 'ADM' ||
      userLevel === 'MGR' ||
      userLevel === 'KSI' ||
      userLevel === 'OTHER'
    );
    isKemandoranLocked = ['MDP', 'KRT', 'KRP'].includes(userLevel);
  } else {
    // Transport and LHM
    isAfdelingLocked = !(
      userLevel === 'ADM' ||
      userLevel === 'MGR' ||
      userLevel === 'KSI' ||
      userLevel === 'OTHER'
    );
    isKemandoranLocked = ['MDP', 'KRP'].includes(userLevel);
  }

  return {
    isFcbaLocked,
    isAfdelingLocked,
    isKemandoranLocked,
  };
}
