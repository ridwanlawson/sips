"use client";

// import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export const Drawer = () => {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLInputElement>(null);

  // Read cookie helper (client-side only)
  const readCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? decodeURIComponent(m.pop() as string) : null;
  };

  const [userLevel, setUserLevel] = useState<string>("");
  useEffect(() => {
    const levelRaw =
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      "";
    setUserLevel(String(levelRaw).toUpperCase());
  }, []);

  // Tutup drawer setelah klik link
  const closeDrawer = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  // Helper: kelas aktif
  const isActive = (href: string) =>
    pathname === href ? "active bg-base-300" : "";

  return (
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

      <div className="drawer-side">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>

        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1">
          {/* Header/brand */}
          <li className="pointer-events-none">
            <div>
              {/* <div className="w-10">
                <Image
                  alt="Logo Perusahaan"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div> */}
              <span>Sentosa Kalimantan Jaya</span>
            </div>
          </li>

          <div className="divider"></div>

          {/* Link Dashboard */}
          <li>
            <Link
              href="/dashboard"
              className={isActive("/dashboard")}
              onClick={closeDrawer}
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
              Dashboard
            </Link>
          </li>

          {/* Dropdown Attendance */}
          <li>
            <details className="[&_summary::-webkit-details-marker]:hidden">
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
                  <span>Attendance</span>
                </div>
              </summary>
              <ul className="menu menu-sm">
                <li>
                  <Link
                    href="/attendance"
                    className={isActive("/attendance")}
                    onClick={closeDrawer}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    Data List
                  </Link>
                </li>
                {(userLevel === "ADM" || userLevel === "MGR") && (
                  <li>
                    <Link
                      href="/attendance/approval"
                      className={isActive("/attendance/approval")}
                      onClick={closeDrawer}
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
                )}
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  );
};
