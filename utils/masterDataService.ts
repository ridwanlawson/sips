'use client';

type ApiWrapper = {
  ok?: boolean;
  success?: boolean;
  data?: unknown;
};

export type SectionMaster = {
  fccode: string;
  fcname: string;
  fcba: string;
  [key: string]: unknown;
};

export type GangMaster = {
  fccode: string;
  fcname: string;
  afdeling: string;
  fcba: string;
  [key: string]: unknown;
};

export type FetchSectionsParams = {
  fccode?: string;
  fcba?: string;
};

export type FetchGangsParams = {
  fccode?: string;
  afdeling?: string;
  fcba?: string;
};

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const wrapped = payload as ApiWrapper;
  if (Array.isArray(wrapped.data)) return wrapped.data as T[];
  if (wrapped.data && typeof wrapped.data === 'object') {
    const inner = wrapped.data as ApiWrapper;
    if (Array.isArray(inner.data)) return inner.data as T[];
  }

  return [];
}

async function fetchMasterData<T>(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${path} (${res.status}): ${text}`);
  }

  return extractArray<T>(await res.json());
}

export function fetchSections(params: FetchSectionsParams = {}): Promise<SectionMaster[]> {
  return fetchMasterData<SectionMaster>('/api/sections', params);
}

export function fetchGangs(params: FetchGangsParams = {}): Promise<GangMaster[]> {
  return fetchMasterData<GangMaster>('/api/gangs', params);
}
