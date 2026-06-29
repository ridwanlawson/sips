'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

export default function ScrollToTop() {
  const t = useTranslations('Navbar');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Show button after 300px
    setIsVisible(scrollY > 300);

    // Calculate scroll percentage
    const totalScrollable = scrollHeight - clientHeight;
    const percentage = totalScrollable > 0 ? (scrollY / totalScrollable) * 100 : 0;
    setScrollPercentage(Math.min(100, Math.max(0, percentage)));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 🎨 Palette Improvement: Move focus to main content after scroll finishes for better accessibility
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
      }
    }, 500);
  };

  // SVG Progress Ring Constants
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scrollPercentage / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        className={`btn btn-circle shadow-xl transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary relative overflow-visible bg-base-100 border-none group`}
        aria-label={t('scrollToTop')}
        title={t('scrollToTop')}
      >
        {/* 🎨 Palette Improvement: Visual Scroll Progress Ring */}
        <svg
          className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none"
          viewBox="0 0 52 52"
          aria-hidden="true"
        >
          {/* Background circle (track) */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary/10"
          />
          {/* Foreground circle (progress) */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-primary transition-all duration-300"
          />
        </svg>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          className="w-6 h-6 text-primary group-hover:-translate-y-0.5 transition-transform duration-300"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
