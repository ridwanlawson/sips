'use client';

export async function fetchUsers(params: Record<string, string>): Promise<Response> {
  const url = new URL('/api/master/sips-users', window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  return fetch(url.toString(), { credentials: 'include' });
}

export async function fetchUserDetail(id: number): Promise<Response> {
  return fetch(`/api/master/user/${id}`, { credentials: 'include' });
}

export async function updateUserStatus(id: number, status: 'Y' | 'N'): Promise<Response> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  return fetch(`/api/master/user/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
    body: JSON.stringify({ status }),
  });
}

export async function registerUser(formData: FormData): Promise<Response> {
  return fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
}
