"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

export default function ScrollToTop() {
  const t = useTranslations("Navbar");
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = useCallback(() => {
    setIsVisible(window.scrollY > 300);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [toggleVisibility]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`btn btn-primary btn-circle shadow-lg transition-all duration-300 transform ${
          isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        } hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary`}
        aria-label={t("scrollToTop")}
        title={t("scrollToTop")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
