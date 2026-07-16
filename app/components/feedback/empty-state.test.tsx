import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../feedback/empty-state';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('EmptyState', () => {
  it('renders namespace-based text', () => {
    render(<EmptyState namespace="Attendance" />);
    expect(screen.getByText('noData')).toBeDefined();
    expect(screen.getByText('noDataHint')).toBeDefined();
  });

  it('shows clear search button when onClearSearch provided', () => {
    const onClearSearch = vi.fn();
    render(<EmptyState namespace="Attendance" onClearSearch={onClearSearch} />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('hides clear button when onClearSearch is undefined', () => {
    render(<EmptyState namespace="Attendance" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
