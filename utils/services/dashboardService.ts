'use client';

export async function fetchAttendanceRange(params: Record<string, string>): Promise<Response> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  return fetch(`/api/attendance?${p.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
}

export async function fetchHarvestingRange(params: Record<string, string>): Promise<Response> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  return fetch(`/api/harvest?${p.toString()}`, { credentials: 'include' });
}

export async function fetchTransportRange(params: Record<string, string>): Promise<Response> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  return fetch(`/api/transport?${p.toString()}`, { credentials: 'include' });
}

export async function fetchTriplets(): Promise<Response> {
  return fetch('/api/master/karyawans', { credentials: 'include' });
}

export async function fetchUserProfile(): Promise<Response> {
  return fetch('/api/master/user/profile', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
}
