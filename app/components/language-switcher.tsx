"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cookieStore } from "@/utils/cookieStore";
import { useTranslations } from "next-intl";

export const LanguageSwitcher = () => {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    setLocale(cookieStore.getLocale());
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    cookieStore.setCookie("NEXT_LOCALE", newLocale);
    setLocale(newLocale);
    router.refresh(); // Refresh the page to apply the new locale
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-2 px-2 py-1 btn btn-ghost btn-xs focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t("languageMenu")}
        title={t("languageMenu")}
      >
        <span className="uppercase font-medium text-xs">{locale}</span>
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
          aria-hidden="true"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm bg-base-300 rounded-box z-[1] w-40 p-2 shadow-2xl mt-1"
      >
        <li>
          <button
            className={`flex items-center justify-between focus-visible:ring-2 focus-visible:ring-primary ${locale === "en" ? "active" : ""}`}
            onClick={() => handleLanguageChange("en")}
            aria-current={locale === "en" ? "true" : undefined}
          >
            <span>English (EN)</span>
            {locale === "en" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </li>
        <li>
          <button
            className={`flex items-center justify-between focus-visible:ring-2 focus-visible:ring-primary ${locale === "id" ? "active" : ""}`}
            onClick={() => handleLanguageChange("id")}
            aria-current={locale === "id" ? "true" : undefined}
          >
            <span>Indonesia (ID)</span>
            {locale === "id" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </li>
      </ul>
    </div>
  );
};
