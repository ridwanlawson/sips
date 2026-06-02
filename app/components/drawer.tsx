'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cookieStore } from '@/utils/cookieStore';
import { getMenuForUserLevel, MenuItem } from '@/lib/menuConfig';

export const Drawer = () => {
  const t = useTranslations('Navbar');
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLInputElement>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Dynamic dropdown states based on menu config
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize userLevel from cookie and filter menu items
    const currentLevel = cookieStore.getLevel();
    setMenuItems(getMenuForUserLevel(currentLevel));
  }, []);

  useEffect(() => {
    // Update dropdown states based on current pathname
    const newStates: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child => pathname.startsWith(child.href));
        newStates[item.id] = hasActiveChild;
      }
    });
    setDropdownStates(newStates);
    // Reset loading state when navigation completes.
    setIsNavigating(null);
  }, [pathname, menuItems]);

  // Close the drawer.
  const closeDrawer = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  // Navigate and mark the clicked item as loading.
  const handleNavigate = (href: string) => {
    if (pathname === href) {
      closeDrawer();
      return;
    }
    setIsNavigating(href);
    closeDrawer();
    router.push(href);
  };

  // Active menu item helper.
  const isActive = (href: string) => (pathname === href ? 'active bg-base-300' : '');

  // Helper: toggle dropdown state
  const toggleDropdown = (itemId: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Render menu icon
  const renderIcon = (iconPath: string, size: string = 'h-5 w-5') => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={iconPath} />
    </svg>
  );

  // Render single menu item
  const renderMenuItem = (item: MenuItem, isChild: boolean = false) => {
    if (item.children && item.children.length > 0) {
      // Render dropdown menu
      return (
        <li key={item.id}>
          <details
            className="[&_summary::-webkit-details-marker]:hidden"
            open={dropdownStates[item.id] || false}
            onToggle={e => {
              // Only update state if user clicked, not when pathname changes
              if (e.currentTarget.open !== dropdownStates[item.id]) {
                toggleDropdown(item.id);
              }
            }}
          >
            <summary className="flex items-center justify-between cursor-pointer hover:bg-base-300 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                {renderIcon(item.icon)}
                <span>{t(item.label)}</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 opacity-60 transition-transform duration-200 ${
                  dropdownStates[item.id] ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <ul className="menu menu-sm">
              {item.children.map(child => renderMenuItem(child, true))}
            </ul>
          </details>
        </li>
      );
    }

    // Render simple menu item
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          className={isActive(item.href)}
          onClick={() => handleNavigate(item.href)}
        >
          {renderIcon(item.icon, isChild ? 'h-4 w-4' : 'h-5 w-5')}
          {t(item.label)}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-3 bg-primary animate-pulse shadow-md"></div>
        </div>
      )}
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" ref={drawerRef} />
        <div className="drawer-content">
          {/* Open drawer button */}
          <label
            htmlFor="my-drawer"
            role="button"
            className="btn btn-ghost btn-circle drawer-button focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('openSidebar')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </label>
        </div>

        <div className="drawer-side z-[9999]">
          <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

          <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1">
            {/* Header/brand */}
            <li className="pointer-events-none mb-4">
              <div className="flex flex-col items-center justify-center gap-3 py-4 bg-base-100 rounded-xl shadow-sm border border-base-300">
                <div className="text-center">
                  <span className="block font-bold text-lg leading-tight text-base-content">
                    Sentosa Kalimantan Jaya
                  </span>
                  <span className="text-xs text-base-content/60 font-medium tracking-wide uppercase mt-1 block">
                    SIPS Mobile Web
                  </span>
                </div>
              </div>
            </li>

            {/* Render menu items from config */}
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </div>
      </div>
    </>
  );
};
