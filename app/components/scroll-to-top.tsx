'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

/**
 * 🎨 Palette Enhancement: ScrollToTop with progress ring and accessible focus management.
 * Provides a visual indication of scroll progress and improves navigation for keyboard/SR users.
 */
export default function ScrollToTop() {
  const t = useTranslations('Navbar');
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleVisibility = useCallback(() => {
    const scrolled = window.scrollY;
    // Calculate scroll progress percentage
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = height > 0 ? (scrolled / height) * 100 : 0;

    setProgress(scrollProgress);
    setIsVisible(scrolled > 300);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [toggleVisibility]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ♿ Accessibility: Move focus to main content after scroll
    // Delay allows the smooth scroll to reach the top before focusing
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus({ preventScroll: true });
      }
    }, 500);
  };

  // SVG Circle properties
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        className={`btn btn-primary btn-circle shadow-lg transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary relative`}
        aria-label={t('scrollToTop')}
        title={t('scrollToTop')}
      >
        {/* Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 p-1"
          aria-hidden="true"
          viewBox="0 0 48 48"
        >
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary-content/20"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary-content transition-all duration-100"
            strokeLinecap="round"
          />
        </svg>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6 z-10"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
