"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "./drawer";
import { Theme } from "./theme";
import { LanguageSwitcher } from "./language-switcher";
import { toTitleCase } from "@/utils/textManipulation";
import { getProxiedImageUrl } from "@/utils/imageHelper";
import { useTranslations } from "next-intl";
import { cookieStore } from "@/utils/cookieStore";
import toast from "react-hot-toast";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const pathname = usePathname();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fullNameDisplay, setFullNameDisplay] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [isCheckingDownload, setIsCheckingDownload] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Reset loading state saat halaman selesai diload (pathname berubah)
    setIsNavigating(null);
  }, [pathname]);

  useEffect(() => {
    const userInfo = cookieStore.getAllUserInfo();
    const photoCookie = userInfo.photo;
    const fullNameCookie = userInfo.fullName;
    const fcbaCookie = userInfo.fcba;

    // bersihkan spasi
    const name = (fullNameCookie ?? "").trim();
    const fcba = (fcbaCookie ?? "").trim();

    // Avoid "null" or "undefined" strings from cookie
    const photo =
      photoCookie && photoCookie !== "null" && photoCookie !== "undefined"
        ? photoCookie.trim()
        : null;

    // rakit tampilan: "Nama (FCBA)" hanya kalau datanya ada
    const parts: string[] = [];
    if (name) parts.push(toTitleCase(name));
    if (fcba) parts.push(`(${fcba.toUpperCase()})`);
    const display = parts.join(" ").trim();

    setPhotoUrl(photo || null);
    setFullNameDisplay(display || null);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        // Brief delay to show the logout animation
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/");
      } else {
        setIsLoggingOut(false);
        console.error("Logout failed:", response.statusText);
      }
    } catch (error) {
      setIsLoggingOut(false);
      console.error("Logout failed:", error);
    }
  };

  // Handle navigation dengan loading pada menu yang diklik
  const handleNavigate = (href: string) => {
    if (pathname === href) return;
    setIsNavigating(href);
    router.push(href);
  };

  // Handle download - call API to check for updates
  const handleDownload = async () => {
    setIsCheckingDownload(true);
    try {
      const token =
        cookieStore.getCookie("auth_token") ||
        cookieStore.getCookie("token") ||
        cookieStore.getCookie("access_token") ||
        "";

      const response = await fetch("http://dev.skj.my.id:82/api/app-update/check", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ platform: "android" }),
      });

      const data = await response.json();

      if (response.ok && data.download_url) {
        // Open download URL in new tab
        window.open(data.download_url, "_blank");
      } else {
        toast.error(data.message || "Gagal mendapatkan link download");
      }
    } catch (error) {
      console.error("Download check error:", error);
      toast.error("Terjadi kesalahan saat memeriksa update");
    } finally {
      setIsCheckingDownload(false);
    }
  };

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <Drawer />
      </div>

      <div className="navbar-center">
        <Image
          src="/logo.svg"
          alt="Nama Brand"
          width={50}
          height={50}
          loading="eager"
        />
      </div>

      <div className="navbar-end gap-2">
        <LanguageSwitcher />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <Image
                alt="User Avatar"
                src={
                  getProxiedImageUrl(photoUrl) ||
                  "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                }
                width={40}
                height={40}
                className="rounded-full object-cover"
                unoptimized={true}
              />
            </div>
          </div>

          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
          >
            <li>
              <a>
                <b>{fullNameDisplay ?? t("pengguna")}</b>
              </a>
            </li>
            <li>
              {mounted ? (
                <button
                  onClick={handleDownload}
                  className={`w-full text-left justify-between flex items-center ${isCheckingDownload ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isCheckingDownload}
                >
                  <span>SIPS Mobile</span>
                  {isCheckingDownload ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <span className="badge">{t("download")}</span>
                  )}
                </button>
              ) : (
                <a
                  href="#"
                  className="justify-between"
                  onClick={(e) => e.preventDefault()}
                >
                  SIPS Mobile <span className="badge">{t("download")}</span>
                </a>
              )}
            </li>
            <li>
              <a
                target="_blank"
                href="https://skj.my.id/"
                className="justify-between"
              >
                SIPS <span className="badge">{t("visit")}</span>
              </a>
            </li>
            <li>
              <Theme />
            </li>
            <li>
              <button
                onClick={() => handleNavigate("/change-password")}
                className="w-full text-left"
                disabled={!!isNavigating}
              >
                {t("changePassword")}
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className={`w-full text-left ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs" />
                    {t("logout")}
                  </span>
                ) : (
                  t("logout")
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-3 bg-primary animate-pulse shadow-md"></div>
        </div>
      )}

      {/* Global logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-white font-medium">{t("signingOut")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
