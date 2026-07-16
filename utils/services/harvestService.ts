'use client';

export async function fetchHarvestList(params: Record<string, string>): Promise<Response> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  return fetch(`/api/harvest?${p.toString()}`, { credentials: 'include' });
}

export async function fetchHarvestDetail(id: string): Promise<Response> {
  return fetch(`/api/harvest/${id}`, { credentials: 'include' });
}

export async function createHarvest(formData: FormData): Promise<Response> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken && !formData.has('_csrf_token')) {
    formData.append('_csrf_token', csrfToken);
  }
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch('/api/harvest', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });
}

export async function updateHarvest(id: string, formData: FormData): Promise<Response> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken && !formData.has('_csrf_token')) {
    formData.append('_csrf_token', csrfToken);
  }
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch(`/api/harvest/${id}`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
    headers,
  });
}

export async function deleteHarvest(id: string, file: File): Promise<Response> {
  const body = new FormData();
  body.append('ba_deleted', file);
  body.append('_method', 'DELETE');
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken) body.append('_csrf_token', csrfToken);
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch(`/api/harvest/${id}`, {
    method: 'POST',
    body,
    credentials: 'include',
    headers,
  });
}

export async function fetchHarvestByDocumentNo(nodokumen: string): Promise<Response> {
  return fetch(`/api/harvest?nodokumen=${encodeURIComponent(nodokumen)}`, {
    credentials: 'include',
  });
}

export async function fetchTphFieldcodes(fcba: string, afdeling: string): Promise<Response> {
  const params = new URLSearchParams({ fcba, afdeling });
  return fetch(`/api/master/fields?${params.toString()}`, { credentials: 'include' });
}

export async function fetchTphDetail(fcba: string, afdeling: string, fieldcode: string): Promise<Response> {
  const params = new URLSearchParams({ fcba, afdeling, fieldcode });
  return fetch(`/api/master/tph?${params.toString()}`, { credentials: 'include' });
}
