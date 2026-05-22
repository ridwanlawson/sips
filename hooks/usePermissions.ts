'use client';

import { useMemo } from 'react';
import { cookieStore } from '@/utils/cookieStore';

export type Role = 'ADM' | 'MGR' | 'KSI' | 'AST' | 'MD1' | 'MDP' | 'KRA' | 'OTHER';

export const usePermissions = () => {
  const userInfo = useMemo(() => cookieStore.getAllUserInfo(), []);

  const level = userInfo.level as Role;

  const isAdmin = level === 'ADM';
  const isMgr = level === 'MGR';
  const isKsi = level === 'KSI';
  const isAst = level === 'AST';
  const isMd1 = level === 'MD1';
  const isMdp = level === 'MDP';
  const isKra = level === 'KRA';

  const canApprove = isAdmin || isMgr || isKsi || isAst || isMd1 || isMdp;
  const canUpload = isMgr; // Per existing middleware logic

  return {
    userInfo,
    level,
    isAdmin,
    isMgr,
    isKsi,
    isAst,
    isMd1,
    isMdp,
    isKra,
    canApprove,
    canUpload,
  };
};
