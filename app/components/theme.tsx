'use client';

import { Icon } from '@/app/components/icons';
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
          <Icon name="theme" className="h-5 w-5" />
          <span>{t('theme')}</span>
        </div>
        <Icon name="chevron-down" className="h-3 w-3 opacity-60" />
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
                <Icon name="check" className="h-4 w-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
