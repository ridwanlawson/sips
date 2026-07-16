'use client';

import { useState, useEffect } from 'react';
import { cookieStore } from '@/utils/auth/cookieStore';

export interface UploadPageState {
  isMgr: boolean;
  isAdmin: boolean;
  initCheck: boolean;
  userFcba: string;
  userAfdeling: string;
}

/**
 * Shared initialisation hook for upload pages.
 * Reads user level and defaults from cookies — eliminates the identical
 * useEffect + readCookie block copy-pasted across every upload page.
 */
export function useUploadPage(): UploadPageState {
  const [state, setState] = useState<UploadPageState>({
    isMgr: false,
    isAdmin: false,
    initCheck: false,
    userFcba: '',
    userAfdeling: '',
  });

  useEffect(() => {
    const level = cookieStore.getLevel(); // already .toUpperCase()
    const fcba = cookieStore.getFcba();
    const afdeling = cookieStore.getSection();

    setState({
      isMgr: level === 'MGR',
      isAdmin: level === 'ADM' || level === 'ADMIN',
      initCheck: true,
      userFcba: fcba,
      userAfdeling: afdeling,
    });
  }, []);

  return state;
}

