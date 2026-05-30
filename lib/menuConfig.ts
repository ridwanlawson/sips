/**
 * Centralized menu configuration
 * Following the project's pattern from lib/constants.ts
 */

export interface MenuItem {
  id: string;
  label: string; // Translation key from messages/Navbar
  href: string;
  icon: string; // SVG path
  children?: MenuItem[];
  requiredLevel?: string[]; // User levels that can see this item
  isOpen?: boolean; // For dropdown state
}

export const MenuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'dashboard',
    href: '/dashboard',
    icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1 1v-10.5z',
  },
  {
    id: 'attendance',
    label: 'attendance',
    href: '/attendance',
    icon: 'M6 2a1 1 0 0 0-1 1v1H3v2h18V4h-2V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1H10V3a1 1 0 0 0-1-1H6zM3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3zm5 3h8v2H8v-2z',
    children: [
      {
        id: 'attendance-list',
        label: 'list',
        href: '/attendance',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      },
    ],
  },
  {
    id: 'harvest',
    label: 'harvest',
    href: '/harvest',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    children: [
      {
        id: 'harvest-list',
        label: 'list',
        href: '/harvest',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      },
    ],
  },
  {
    id: 'pengangkutan',
    label: 'pengangkutan',
    href: '/pengangkutan',
    icon: 'M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a3 3 0 0 0 6 0h1a1 1 0 0 0 1-1zM5 8h6v2H5V8zm0 4h6v2H5v-2zm0 4h4v2H5v-2zm10-6h4v2h-4V6zm0 4h4v2h-4v-2z',
    children: [
      {
        id: 'pengangkutan-list',
        label: 'list',
        href: '/pengangkutan',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      },
    ],
  },
  {
    id: 'lhm',
    label: 'lhm',
    href: '/lhm',
    icon: 'M4 3h10l6 6v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 0v6h6M7 12h10M7 16h7M7 20h4',
  },
  {
    id: 'approval',
    label: 'approvalLhm',
    href: '/approval/lhm',
    icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
    requiredLevel: ['ADM', 'MDP', 'MD1', 'AST', 'KSI', 'MGR'],
  },
  {
    id: 'openLhm',
    label: 'openLhm',
    href: '/open/lhm',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 11h-2v-2h2v2zm0-4h-2V8h2v2zm4 4h-2v-2h2v2zm0-4h-2V8h2v2z',
    requiredLevel: ['ADM', 'KSI'],
  },
];

// Helper function to check if user can access menu item
export const canAccessMenuItem = (item: MenuItem, userLevel: string): boolean => {
  if (!item.requiredLevel || item.requiredLevel.length === 0) {
    return true;
  }
  return item.requiredLevel.includes(userLevel);
};

// Helper function to get filtered menu based on user level
export const getMenuForUserLevel = (userLevel: string): MenuItem[] => {
  return MenuConfig.filter(item => canAccessMenuItem(item, userLevel)).map(item => ({
    ...item,
    children: item.children?.filter(child => canAccessMenuItem(child, userLevel)),
  }));
};
