"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Drawer } from "./drawer";
import { Theme } from "./theme";
import { toTitleCase } from "@/utils/textManipulation";
import { getProxiedImageUrl } from "@/utils/imageHelper";

/** Ambil nilai cookie by name (handle URL-encoded value juga) */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const part = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!part) return null;
  const value = part.split("=")[1] ?? "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function Navbar() {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fullNameDisplay, setFullNameDisplay] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const photoCookie = getCookie("user_Photo");
    const fullNameCookie = getCookie("user_FullName");
    const fcbaCookie = getCookie("user_Fcba");

    // bersihkan spasi
    const name = (fullNameCookie ?? "").trim();
    const fcba = (fcbaCookie ?? "").trim();

    // rakit tampilan: "Nama (FCBA)" hanya kalau datanya ada
    const parts: string[] = [];
    if (name) parts.push(toTitleCase(name));
    if (fcba) parts.push(`(${fcba.toUpperCase()})`);
    const display = parts.join(" ").trim();

    setPhotoUrl(photoCookie && photoCookie.trim() !== "" ? photoCookie : null);
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

      <div className="navbar-end mr-2 gap-1">
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
                <b>{fullNameDisplay ?? "Pengguna"}</b>
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href="https://sipsmobile.web.app/"
                className="justify-between"
              >
                SIPS Mobile <span className="badge">Download</span>
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href="https://skj.my.id/"
                className="justify-between"
              >
                SIPS <span className="badge">Kunjungi</span>
              </a>
            </li>
            <li>
              <Theme />
            </li>
            <li>
              <Link href="/change-password">Change Password</Link>
            </li>
            <li>
              <a
                onClick={handleLogout}
                className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs" />
                    Logout
                  </span>
                ) : (
                  "Logout"
                )}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Global logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-white font-medium">Signing out...</p>
          </div>
        </div>
      )}
    </div>
  );
}
