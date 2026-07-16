import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Toolbar, type ToolbarAction } from '../ui/toolbar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('Toolbar', () => {
  const actions: ToolbarAction[] = [
    { key: 'add', label: 'Add Item', onClick: vi.fn() },
    { key: 'delete', label: 'Delete Item', onClick: vi.fn() },
  ];

  const defaultProps = {
    title: 'Test Title',
    actions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeDefined();
  });

  it('renders action buttons with labels', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('Add Item')).toBeDefined();
    expect(screen.getByText('Delete Item')).toBeDefined();
  });

  it('handles click events on buttons', () => {
    render(<Toolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Item'));
    expect(actions[0].onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Delete Item'));
    expect(actions[1].onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when action is loading', () => {
    const loadingActions: ToolbarAction[] = [
      { key: 'add', label: 'Add Item', onClick: vi.fn(), loading: true },
    ];

    render(<Toolbar title="Test" actions={loadingActions} />);

    expect(screen.getByText('Add Item')).toBeDefined();
    const button = screen.getByText('Add Item').closest('button');
    expect(button).toBeDisabled();
  });

  it('disables buttons when disabled prop is true', () => {
    const disabledActions: ToolbarAction[] = [
      { key: 'add', label: 'Add Item', onClick: vi.fn(), disabled: true },
    ];

    render(<Toolbar title="Test" actions={disabledActions} />);

    const button = screen.getByText('Add Item').closest('button');
    expect(button).toBeDisabled();
  });
});
