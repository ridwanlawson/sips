'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '../hooks/useTheme';

export const Theme = () => {
  const t = useTranslations('Navbar');
  const { theme, changeTheme } = useTheme();

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeTheme(e.target.value as 'light' | 'dark' | 'retro' | 'cyberpunk' | 'valentine' | 'aqua');
  };

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
      >
        {t('theme')}
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60 ml-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content bg-base-300 rounded-box z-1 w-52 p-2 shadow-2xl">
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Light"
            value="light"
            onChange={handleThemeChange}
            checked={theme === 'light'}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Dark"
            value="dark"
            onChange={handleThemeChange}
            checked={theme === 'dark'}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Retro"
            value="retro"
            onChange={handleThemeChange}
            checked={theme === 'retro'}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Cyberpunk"
            value="cyberpunk"
            onChange={handleThemeChange}
            checked={theme === 'cyberpunk'}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Valentine"
            value="valentine"
            onChange={handleThemeChange}
            checked={theme === 'valentine'}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
            aria-label="Aqua"
            value="aqua"
            onChange={handleThemeChange}
            checked={theme === 'aqua'}
          />
        </li>
      </ul>
    </div>
  );
};
