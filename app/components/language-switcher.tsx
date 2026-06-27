'use client';

import { useState, useEffect } from 'react';
import { cookieStore } from '@/utils/cookieStore';
import { useTranslations } from 'next-intl';

export const LanguageSwitcher = () => {
  const t = useTranslations('Navbar');
  const [locale, setLocale] = useState('id');

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
    window.location.reload();
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
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25"
          />
        </svg>
        <span className="uppercase font-bold text-[10px] tracking-wider">{locale}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3 w-3 opacity-60"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
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
                  strokeWidth={2}
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
                  strokeWidth={2}
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
