import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FilterBar, type FilterField } from '../ui/filter-bar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('FilterBar', () => {
  const fields: FilterField[] = [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'Search name' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
  ];

  const defaultProps = {
    fields,
    values: {},
    onChange: vi.fn(),
    onApply: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all field types (text, date, select)', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search name')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Inactive')).toBeDefined();
  });

  it('has accessible labels and titles', () => {
    render(<FilterBar {...defaultProps} />);

    const textInput = screen.getByPlaceholderText('Search name');
    expect(textInput.getAttribute('aria-label')).toBe('Name');
    expect(textInput.getAttribute('title')).toBe('Name');

    const dateInput = screen.getByLabelText('Date');
    expect(dateInput).toBeDefined();
    expect(dateInput.getAttribute('title')).toBe('Date');

    const selectInput = screen.getByLabelText('Status');
    expect(selectInput).toBeDefined();
    expect(selectInput.getAttribute('title')).toBe('Status');
  });

  it('calls onChange when input value changes', () => {
    render(<FilterBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search name');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('name', 'test');
  });

  it('calls onApply when Apply button clicked', () => {
    render(<FilterBar {...defaultProps} />);

    const applyButton = screen.getByLabelText('Apply');
    fireEvent.click(applyButton);

    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when Reset button clicked', () => {
    render(<FilterBar {...defaultProps} />);

    const resetButton = screen.getByLabelText('Reset');
    fireEvent.click(resetButton);

    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(<FilterBar {...defaultProps} loading={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
