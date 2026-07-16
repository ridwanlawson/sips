import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScrollToTop from '../ui/scroll-to-top';
import React from 'react';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollY = 0;
    // Mock scrollHeight and innerHeight
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

    // Mock focus for main-content
    document.body.innerHTML = '<div id="main-content" tabIndex="-1"></div>';
  });

  it('should be hidden initially', () => {
    render(<ScrollToTop />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-0');
  });

  it('should become visible after scrolling 300px', async () => {
    render(<ScrollToTop />);

    act(() => {
      window.scrollY = 301;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-100');
  });

  it('should scroll to top and move focus when clicked', async () => {
    vi.useFakeTimers();
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(<ScrollToTop />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    const mainContent = document.getElementById('main-content');
    const focusSpy = vi.spyOn(mainContent!, 'focus');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(focusSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

