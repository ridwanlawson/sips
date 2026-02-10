"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Drawer } from "./drawer";
import { Theme } from "./theme";
import { LanguageSwitcher } from "./language-switcher";
import { toTitleCase } from "@/utils/textManipulation";
import { getProxiedImageUrl } from "@/utils/imageHelper";
import { useTranslations } from "next-intl";
import { cookieStore } from "@/utils/cookieStore";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fullNameDisplay, setFullNameDisplay] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

      <div className="navbar-end mr-2 gap-4">
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
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
          >
            <li>
              <a>
                <b>{fullNameDisplay ?? t("pengguna")}</b>
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href="https://1drv.ms/f/c/28ba560db3725beb/IgCchLt-YjVKQbL4WeU_F67zASiTPoSNT1YlDl1SqUG6P2c?e=mqt2ta"
                className="justify-between"
              >
                SIPS Mobile <span className="badge">{t("download")}</span>
              </a>
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
              <Link href="/change-password">{t("changePassword")}</Link>
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
