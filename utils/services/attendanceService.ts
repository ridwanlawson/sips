'use client';

export async function fetchAttendanceList(params: Record<string, string>): Promise<Response> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  const qs = p.toString();
  return fetch(`/api/attendance${qs ? `?${qs}` : ''}`, { credentials: 'include' });
}

export async function fetchAttendanceDetail(id: string): Promise<Response> {
  return fetch(`/api/attendance/${id}`, { credentials: 'include' });
}

export async function createAttendance(formData: FormData): Promise<Response> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken && !formData.has('_csrf_token')) {
    formData.append('_csrf_token', csrfToken);
  }
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch('/api/attendance', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });
}

export async function updateAttendance(id: string, formData: FormData): Promise<Response> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken && !formData.has('_csrf_token')) {
    formData.append('_csrf_token', csrfToken);
  }
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch(`/api/attendance/${id}`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
    headers,
  });
}

export async function deleteAttendance(id: string, file: File): Promise<Response> {
  const body = new FormData();
  body.append('ba_deleted', file);
  body.append('_method', 'DELETE');
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  if (csrfToken) body.append('_csrf_token', csrfToken);
  const headers: Record<string, string> = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return fetch(`/api/attendance/${id}`, {
    method: 'POST',
    body,
    credentials: 'include',
    headers,
  });
}
