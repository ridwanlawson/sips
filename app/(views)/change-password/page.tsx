import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/utils/auth/backendConfig';
import ChangePasswordPage from './change-password-client';
import type { UserProfile } from '@/app/types';

export const metadata: Metadata = {
  title: 'Change Password',
};

/**
 * Server Component that fetches the profile before sending the page to the browser.
 * Profile data is available on initial render, so no profile loading spinner is needed.
 */
export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const userId = cookieStore.get('log_id')?.value;

  let profile: UserProfile | null = null;

  if (token && userId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        // Handle both { data: { data: {...} } } and { data: {...} } shapes.
        profile = json?.data?.data ?? json?.data ?? null;
      }
    } catch {
      // Still render the page when profile fetch fails so the form remains usable.
    }
  }

  return <ChangePasswordPage profile={profile} />;
}

