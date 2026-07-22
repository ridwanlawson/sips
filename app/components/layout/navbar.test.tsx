import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Navbar from './navbar';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Drawer, Theme, LanguageSwitcher
vi.mock('../layout/drawer', () => ({
  Drawer: () => <div data-testid="mock-drawer" />,
}));
vi.mock('../theme/theme', () => ({
  Theme: () => <div data-testid="mock-theme" />,
}));
vi.mock('../layout/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="mock-language-switcher" />,
}));

// Mock cookieStore
vi.mock('@/utils/auth/cookieStore', () => ({
  cookieStore: {
    getAllUserInfo: vi.fn(() => ({
      photo: 'avatar.png',
      fullName: 'John Doe',
      fcba: 'FCBA123',
    })),
  },
}));

describe('Navbar Component - Keyboard Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with user trigger button and dropdown menu', () => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'userMenu' });
    expect(trigger).toBeDefined();

    const avatar = screen.getByAltText('userAvatar');
    expect(avatar).toBeDefined();
  });

  it('handles Escape key to blur active dropdown element and return focus to user trigger button', () => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'userMenu' }) as HTMLButtonElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Spy on blur for activeElement
    const blurSpy = vi.spyOn(trigger, 'blur');

    // Fire Escape key down on dropdown
    fireEvent.keyDown(trigger, { key: 'Escape', code: 'Escape' });

    // Verify close/blur was called
    expect(blurSpy).toHaveBeenCalled();
    // Verify focus is returned to the trigger button
    expect(document.activeElement).toBe(trigger);
  });
});
