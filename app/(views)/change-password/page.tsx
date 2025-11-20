"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toTitleCase } from "@/utils/textManipulation";
import { getProxiedImageUrl } from "@/utils/imageHelper";

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

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.ok && json.data) {
          // Handle potential nested data structure variations
          setProfile(json.data.data || json.data); 
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Password berhasil diubah.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Gagal mengubah password.");
      }
    } catch (err) {
      setError("Terjadi kesalahan tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 p-4 md:p-8 flex justify-center items-start pt-10 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:1s]"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-0">
        
        {/* Left Column: User Profile */}
        <div className="md:col-span-1">
          <div className="card bg-base-100 shadow-xl border border-base-300 h-full">
            <div className="card-body items-center text-center">
              {profileLoading ? (
                <div className="flex flex-col items-center gap-4 py-10">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <p className="text-sm text-base-content/60">Memuat profil...</p>
                </div>
              ) : profile ? (
                <>
                  <div className="avatar mb-2">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 shadow-lg">
                      <Image 
                        src={getProxiedImageUrl(profile.photo) || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"} 
                        alt="Avatar" 
                        width={96} 
                        height={96}
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  </div>
                  <h2 className="card-title text-xl font-bold">
                    {profile.fullname ? toTitleCase(profile.fullname) : "User"}
                  </h2>
                  <div className="badge badge-secondary badge-outline mt-1 mb-4">
                    {profile.position || profile.level || "Staff"}
                  </div>
                  
                  <div className="w-full flex flex-col gap-3 text-left mt-2 text-sm">
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Username</span>
                      <span className="font-medium">{profile.username || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Fullname</span>
                      <span className="font-medium">{profile.fullname || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Email</span>
                      <span className="font-medium">{profile.email || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Phone</span>
                      <span className="font-medium">{profile.phone || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">ID Karyawan</span>
                      <span className="font-medium">{profile.idkaryawan || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Level</span>
                      <span className="font-medium">{profile.level || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Position</span>
                      <span className="font-medium">{profile.position || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">FCBA</span>
                      <span className="font-medium">{profile.fcba || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Afdeling</span>
                      <span className="font-medium">{profile.afdeling || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-2">
                      <span className="text-base-content/60">Gang Code</span>
                      <span className="font-medium">{profile.gangcode || "-"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-base-content/60">
                  Gagal memuat data profil.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title text-xl">Ganti Password</h2>
                  <p className="text-xs text-base-content/60">Perbarui kata sandi akun Anda secara berkala.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Password Saat Ini</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan password lama"
                    className="input input-bordered w-full focus:input-primary transition-all"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Password Baru</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimal 8 karakter"
                      className="input input-bordered w-full focus:input-primary transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Konfirmasi Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      className={`input input-bordered w-full focus:input-primary transition-all ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'input-error' : ''}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error shadow-sm text-sm animate-fadeIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success shadow-sm text-sm animate-fadeIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-control mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-full sm:w-auto sm:self-end min-w-[150px]"
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
