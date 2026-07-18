import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import AppTour, { type TourStep } from './app-tour';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/app/components/ui/icons', () => ({
  Icon: () => <span data-testid="mock-icon" />,
}));

describe('AppTour Focus Management', () => {
  const steps: TourStep[] = [
    { title: 'Step 1 Title', content: 'Step 1 Content' },
    { title: 'Step 2 Title', content: 'Step 2 Content' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders help trigger button with correct accessibility attributes', () => {
    render(<AppTour steps={steps} />);
    const trigger = screen.getByRole('button', { name: 'help' });
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeNull();
  });

  it('opens tour, sets correct attributes, moves focus to the modal card, and returns focus on close', async () => {
    vi.useFakeTimers();
    render(<AppTour steps={steps} />);

    const trigger = screen.getByRole('button', { name: 'help' });

    // Focus the trigger first
    act(() => {
      trigger.focus();
    });
    expect(document.activeElement).toBe(trigger);

    // Click trigger to open modal
    act(() => {
      fireEvent.click(trigger);
    });

    // Check accessibility attributes on trigger after open
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('tour-modal-card');

    // Fast-forward timers to let focus shift inside the modal card
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const modalCard = screen.getByRole('dialog').querySelector('#tour-modal-card');
    expect(modalCard).toBeDefined();
    expect(document.activeElement).toBe(modalCard);

    // Click close button to close modal
    const closeBtn = screen.getByRole('button', { name: 'close' });
    act(() => {
      fireEvent.click(closeBtn);
    });

    // Fast-forward timers for focus-return
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Modal should be gone
    expect(screen.queryByRole('dialog')).toBeNull();

    // Focus should be returned back to the help trigger button
    expect(document.activeElement).toBe(trigger);

    vi.useRealTimers();
  });

  it('closes modal and returns focus to trigger when Escape key is pressed', async () => {
    vi.useFakeTimers();
    render(<AppTour steps={steps} />);

    const trigger = screen.getByRole('button', { name: 'help' });

    act(() => {
      trigger.focus();
      fireEvent.click(trigger);
      vi.advanceTimersByTime(100);
    });

    expect(screen.queryByRole('dialog')).not.toBeNull();

    // Trigger escape keypress
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Modal should be gone
    expect(screen.queryByRole('dialog')).toBeNull();

    // Focus should be returned back to the help trigger button
    expect(document.activeElement).toBe(trigger);

    vi.useRealTimers();
  });
});
