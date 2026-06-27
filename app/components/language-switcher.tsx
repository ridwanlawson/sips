'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStore } from '@/utils/cookieStore';
import { useTranslations } from 'next-intl';

export const LanguageSwitcher = () => {
  const t = useTranslations('Navbar');
  const router = useRouter();
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setLocale(cookieStore.getLocale());
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    cookieStore.setCookie('NEXT_LOCALE', newLocale);
    setLocale(newLocale);
    // 🎨 Palette Improvement: Close the dropdown immediately
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.refresh(); // Refresh the page to apply the new locale
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-1.5 px-2 py-1 btn btn-ghost btn-xs focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t('languageMenu')}
        title={t('languageMenu')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-3.5 h-3.5 opacity-70"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.923 11.923 0 0 0 12 5.25c-2.83 0-5.397 1.009-7.4 2.682m15.243 4.068A11.998 11.998 0 0 1 12 14.25c-2.73 0-5.215-.913-7.2-2.449"
          />
        </svg>
        <span className="uppercase font-bold text-[10px] tracking-wider">{locale}</span>
        <svg
          width="10px"
          height="10px"
          className="inline-block h-2 w-2 fill-current opacity-40"
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
            className={`flex items-center justify-between px-3 py-2 font-medium focus-visible:ring-2 focus-visible:ring-primary ${locale === 'en' ? 'active text-primary' : ''}`}
            onClick={() => handleLanguageChange('en')}
            aria-current={locale === 'en' ? 'true' : undefined}
          >
            <span className="text-sm">English (EN)</span>
            {locale === 'en' && (
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
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </li>
        <li>
          <button
            className={`flex items-center justify-between px-3 py-2 font-medium focus-visible:ring-2 focus-visible:ring-primary ${locale === 'id' ? 'active text-primary' : ''}`}
            onClick={() => handleLanguageChange('id')}
            aria-current={locale === 'id' ? 'true' : undefined}
          >
            <span className="text-sm">Indonesia (ID)</span>
            {locale === 'id' && (
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
                  strokeWidth="2.5"
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
