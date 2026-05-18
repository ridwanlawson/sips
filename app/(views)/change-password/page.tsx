import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/utils/backendConfig";
import ChangePasswordPage from "./changepasswordpage-client";

export const metadata: Metadata = {
  title: "Ganti Password",
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  username: string;
  idkaryawan: string;
  fullname: string;
  level: string;
  position: string;
  photo: string;
  fcba: string;
  afdeling: string;
  gangcode: string;
  phone: string;
};

/**
 * Server Component — fetch profile di server sebelum halaman dikirim ke browser.
 * Tidak ada loading spinner untuk profile, data langsung tersedia saat render.
 */
export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userId = cookieStore.get("log_id")?.value;

  let profile: UserProfile | null = null;

  if (token && userId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        // Tidak di-cache — data user harus selalu fresh
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        // Handle nested: { data: { data: {...} } } atau { data: {...} }
        profile = json?.data?.data ?? json?.data ?? null;
      }
    } catch {
      // Gagal fetch profile — halaman tetap render, form tetap bisa dipakai
    }
  }

  return <ChangePasswordPage profile={profile} />;
}
