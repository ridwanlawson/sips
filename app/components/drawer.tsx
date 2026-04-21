"use client";

// import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export const Drawer = () => {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLInputElement>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // Read cookie helper (client-side only)
  const readCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? decodeURIComponent(m.pop() as string) : null;
  };

  const [userLevel, setUserLevel] = useState<string>("");
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isHarvestOpen, setIsHarvestOpen] = useState(false);
  const [isHarvestingQualityOpen, setIsHarvestingQualityOpen] = useState(false);
  const [isPengangkutanOpen, setIsPengangkutanOpen] = useState(false);
  const [isApkUploadOpen, setIsApkUploadOpen] = useState(false);

  useEffect(() => {
    // Buka dropdown hanya jika berada di halaman /attendance...
    // Tutup jika pindah ke halaman lain (misal Dashboard)
    setIsAttendanceOpen(pathname.startsWith("/attendance"));
    setIsHarvestOpen(pathname.startsWith("/harvest"));
    setIsHarvestingQualityOpen(pathname.startsWith("/harvesting-quality"));
    setIsPengangkutanOpen(pathname.startsWith("/pengangkutan"));
    setIsApkUploadOpen(pathname.startsWith("/apk-upload"));
    // Reset loading state saat halaman selesai diload
    setIsNavigating(null);
  }, [pathname]);

  useEffect(() => {
    const levelRaw =
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      "";
    setUserLevel(String(levelRaw).toUpperCase());
  }, []);

  // Tutup drawer
  const closeDrawer = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  // Navigate dengan loading pada menu yang diklik
  const handleNavigate = (href: string) => {
    if (pathname === href) {
      closeDrawer();
      return;
    }
    setIsNavigating(href);
    closeDrawer();
    router.push(href);
  };

  // Helper: kelas aktif
  const isActive = (href: string) =>
    pathname === href ? "active bg-base-300" : "";

  return (
    <>
      {/* Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-3 bg-primary animate-pulse shadow-md"></div>
        </div>
      )}
      <div className="drawer">
        <input
          id="my-drawer"
          type="checkbox"
          className="drawer-toggle"
          ref={drawerRef}
        />
        <div className="drawer-content">
          {/* Tombol buka drawer */}
          <label
            htmlFor="my-drawer"
            role="button"
            className="btn btn-ghost btn-circle drawer-button"
            aria-label="Open sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </label>
        </div>

        <div className="drawer-side z-[9999]">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>

          <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1">
            {/* Header/brand */}
            <li className="pointer-events-none mb-4">
              <div className="flex flex-col items-center justify-center gap-3 py-4 bg-base-100 rounded-xl shadow-sm border border-base-300">
                {" "}
                <div className="text-center">
                  <span className="block font-bold text-lg leading-tight text-base-content">
                    Sentosa Kalimantan Jaya
                  </span>
                  <span className="text-xs text-base-content/60 font-medium tracking-wide uppercase mt-1 block">
                    SIPS Mobile Web
                  </span>
                </div>
              </div>
            </li>
            {/* Link Dashboard */}
            <li>
              <Link
                href="/dashboard"
                className={isActive("/dashboard")}
                onClick={() => handleNavigate("/dashboard")}
              >
                {/* optional: ikon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1v-10.5z" />
                </svg>
                {t("dashboard")}
              </Link>
            </li>

            {/* Dropdown Attendance */}
            <li>
              <details
                className="[&_summary::-webkit-details-marker]:hidden"
                open={isAttendanceOpen}
                onToggle={(e) => setIsAttendanceOpen(e.currentTarget.open)}
              >
                <summary className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 2a1 1 0 0 0-1 1v1H3v2h18V4h-2V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1H10V3a1 1 0 0 0-1-1H6zM3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3zm5 3h8v2H8v-2z" />
                    </svg>
                    <span>{t("attendance")}</span>
                  </div>
                </summary>
                <ul className="menu menu-sm">
                  <li>
                    <Link
                      href="/attendance"
                      className={isActive("/attendance")}
                      onClick={() => handleNavigate("/attendance")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                      {t("list")}
                    </Link>
                  </li>
                  {/* {(userLevel === "ADM" || userLevel === "MGR") && (
                  <>
                    <li>
                      <Link
                        href="/attendance/approval"
                        className={isActive("/attendance/approval")}
                        onClick={() => handleNavigate("/attendance/approval")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        {t("approval")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/attendance/upload"
                        className={isActive("/attendance/upload")}
                        onClick={() => handleNavigate("/attendance/upload")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2z" />
                          <path d="M11 3L5.5 8.5l1.42 1.41L11 5.83V15h2V5.83l4.08 4.08L18.5 8.5 12 3z" />
                        </svg>
                        {t("upload")}
                      </Link>
                    </li>
                  </>
                )} */}
                </ul>
              </details>
            </li>

            {/* Dropdown Harvest */}
            <li>
              <details
                className="[&_summary::-webkit-details-marker]:hidden"
                open={isHarvestOpen}
                onToggle={(e) => setIsHarvestOpen(e.currentTarget.open)}
              >
                <summary className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM11 6h2v6h-2V6zm0 8h2v2h-2v-2z" />
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                    <span>{t("harvest")}</span>
                  </div>
                </summary>
                <ul className="menu menu-sm">
                  <li>
                    <Link
                      href="/harvest"
                      className={isActive("/harvest")}
                      onClick={() => handleNavigate("/harvest")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                      {t("list")}
                    </Link>
                  </li>
                  {/* {(userLevel === "ADM" || userLevel === "MGR") && (
                    <li>
                      <Link
                        href="/harvest/upload"
                        className={isActive("/harvest/upload")}
                        onClick={() => handleNavigate("/harvest/upload")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2z" />
                          <path d="M11 3L5.5 8.5l1.42 1.41L11 5.83V15h2V5.83l4.08 4.08L18.5 8.5 12 3z" />
                        </svg>
                        {t("upload")}
                      </Link>
                    </li>
                  )} */}
                </ul>
              </details>
            </li>

            {/* Dropdown Harvesting Quality */}
            {/* <li>
              <details
                className="[&_summary::-webkit-details-marker]:hidden"
                open={isHarvestingQualityOpen}
                onToggle={(e) =>
                  setIsHarvestingQualityOpen(e.currentTarget.open)
                }
              >
                <summary className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>{t("harvestingQuality")}</span>
                  </div>
                </summary>
                <ul className="menu menu-sm">
                  {(userLevel === "ADM" || userLevel === "MGR") && (
                    <li>
                      <Link
                        href="/harvesting-quality/upload"
                        className={isActive("/harvesting-quality/upload")}
                        onClick={() =>
                          handleNavigate("/harvesting-quality/upload")
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2z" />
                          <path d="M11 3L5.5 8.5l1.42 1.41L11 5.83V15h2V5.83l4.08 4.08L18.5 8.5 12 3z" />
                        </svg>
                        {t("upload")}
                      </Link>
                    </li>
                  )}
                </ul>
              </details>
            </li> */}

            {/* Dropdown Pengangkutan */}
            <li>
              <details
                className="[&_summary::-webkit-details-marker]:hidden"
                open={isPengangkutanOpen}
                onToggle={(e) => setIsPengangkutanOpen(e.currentTarget.open)}
              >
                <summary className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 13h2v-2H3v2zm4 0h2v-2H7v2zM3 17h2v-2H3v2zm4 0h2v-2H7v2zM3 9h2V7H3v2zm4 0h2V7H7v2zM14 5v6l4-3-4-3zM12 20h8v-2h-8v2z" />
                    </svg>
                    <span>{t("transport")}</span>
                  </div>
                </summary>
                <ul className="menu menu-sm">
                  <li>
                    <Link
                      href="/pengangkutan"
                      className={isActive("/pengangkutan")}
                      onClick={() => handleNavigate("/pengangkutan")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                      {t("list")}
                    </Link>
                  </li>
                </ul>
              </details>
            </li>

            {/* Approval */}
            <li>
              <Link
                href="/approval"
                className={isActive("/approval")}
                onClick={() => handleNavigate("/approval")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Approval
              </Link>
            </li>

            {/* APK Upload - ADM Only */}
            {userLevel === "ADM" && (
              <li>
                <Link
                  href="/apk-upload"
                  className={isActive("/apk-upload")}
                  onClick={() => handleNavigate("/apk-upload")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2z" />
                    <path d="M11 3L5.5 8.5l1.42 1.41L11 5.83V15h2V5.83l4.08 4.08L18.5 8.5 12 3z" />
                  </svg>
                  Upload APK
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};
