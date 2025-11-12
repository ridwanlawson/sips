"use client";
import { useEffect, useState } from "react";
import { toTitleCase } from "@/utils/textManipulation";

interface UserProfile {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
}

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed");

        // Sesuaikan bila upstream bungkusannya beda:
        setUserProfile(
          json.data.data.fullname
            ? { ...json.data.data, name: json.data.data.fullname }
            : json.data.data
        );
      } catch (e) {
        console.error("Error fetching user profile:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {loading
              ? "Memuat..."
              : userProfile
              ? `Selamat Datang ${toTitleCase(
                  userProfile.name || userProfile.username
                )}!`
              : "Selamat Datang!"}
          </h1>
          <p className="mt-2">Kelola informasi dan layanan Anda di sini</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Dokumen</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">25</p>
          <p className="text-sm text-gray-500 mt-1">5 dokumen baru bulan ini</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">
            Proses Berjalan
          </h3>
          <p className="text-3xl font-bold text-green-600 mt-2">8</p>
          <p className="text-sm text-gray-500 mt-1">2 memerlukan perhatian</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Notifikasi</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">12</p>
          <p className="text-sm text-gray-500 mt-1">3 pesan belum dibaca</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Aktivitas Terbaru
        </h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">
                Dokumen baru ditambahkan
              </p>
              <p className="text-sm text-gray-500">2 jam yang lalu</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">
                Persetujuan diterima
              </p>
              <p className="text-sm text-gray-500">5 jam yang lalu</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">
                Pengingat jadwal rapat
              </p>
              <p className="text-sm text-gray-500">1 hari yang lalu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
