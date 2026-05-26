'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '../hooks/useTheme';

export const Theme = () => {
  const t = useTranslations('Navbar');
  const { theme, changeTheme } = useTheme();

  const handleThemeChange = (
    newTheme: 'light' | 'dark' | 'retro' | 'cyberpunk' | 'valentine' | 'aqua'
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
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5 11c-.83 0-1.5-.67-1.5-1.5S6.17 10 7 10s1.5.67 1.5 1.5S7.83 13 7 13zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 6 10 6s1.5.67 1.5 1.5S10.83 9 10 9zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 6 14 6s1.5.67 1.5 1.5S14.83 9 14 9zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 10 17 10s1.5.67 1.5 1.5S17.83 13 17 13z" />
          </svg>
          <span>{t('theme')}</span>
        </div>
        <svg
          width="12px"
          height="12px"
          className="h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
          aria-hidden="true"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
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
