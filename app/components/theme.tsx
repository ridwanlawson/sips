'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '../hooks/useTheme';

export const Theme = () => {
  const t = useTranslations('Navbar');
  const { theme, changeTheme } = useTheme();

  const handleThemeChange = (
    newTheme: 'light' | 'dark' | 'retro' | 'cyberpunk' | 'valentine' | 'aqua' | 'plant'
  ) => {
    changeTheme(newTheme);
    // Close the dropdown after selection
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'retro', label: 'Retro' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'valentine', label: 'Valentine' },
    { value: 'aqua', label: 'Aqua' },
    { value: 'plant', label: 'Plant' },
  ] as const;

  return (
    <div className="dropdown dropdown-end w-full">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center justify-between w-full focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-1"
        aria-label={t('theme')}
      >
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
          <span>{t('theme')}</span>
        </div>
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
        className="dropdown-content menu menu-sm bg-base-300 rounded-box z-[100] w-52 p-2 shadow-2xl mt-1"
      >
        {themes.map(tItem => (
          <li key={tItem.value}>
            <button
              type="button"
              onClick={() => handleThemeChange(tItem.value)}
              className={
                theme === tItem.value
                  ? 'active flex items-center justify-between'
                  : 'flex items-center justify-between'
              }
              aria-current={theme === tItem.value ? 'true' : undefined}
            >
              <span>{tItem.label}</span>
              {theme === tItem.value && (
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
        ))}
      </ul>
    </div>
  );
};
