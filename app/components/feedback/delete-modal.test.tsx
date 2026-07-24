import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DeleteModal } from './delete-modal';

vi.mock('../ui/icons', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`mock-icon-${name}`} />,
}));

describe('DeleteModal', () => {
  const defaultProps = {
    open: true,
    title: 'Konfirmasi Hapus',
    description: 'Lampirkan file BA (Berita Acara) untuk menghapus data ini.',
    label: 'File BA (PDF)',
    hint: 'Maks 2MB, format PDF',
    cancelText: 'Batal',
    confirmText: 'Hapus',
    isLoading: false,
    disabled: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(<DeleteModal {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal with details when open is true', () => {
    render(<DeleteModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Konfirmasi Hapus')).toBeDefined();
    expect(screen.getByText('Lampirkan file BA (Berita Acara) untuk menghapus data ini.')).toBeDefined();
    expect(screen.getByText('File BA (PDF)')).toBeDefined();
    expect(screen.getByText('Maks 2MB, format PDF')).toBeDefined();
  });

  it('focuses the cancel button on mount/open', async () => {
    render(<DeleteModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Batal' });
    await waitFor(() => {
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  it('triggers onClose when pressing Escape key and isLoading is false', () => {
    render(<DeleteModal {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClose when pressing Escape key and isLoading is true', () => {
    render(<DeleteModal {...defaultProps} isLoading={true} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('handles close button click', () => {
    render(<DeleteModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles cancel button click', () => {
    render(<DeleteModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('validates file size and handles file selection', () => {
    const { container } = render(<DeleteModal {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    // Large file (3MB)
    const largeFile = new File(['a'.repeat(3 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText('File maksimal 2 MB')).toBeDefined();

    // Valid file (1MB)
    const validFile = new File(['a'.repeat(1 * 1024 * 1024)], 'valid.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.queryByText('File maksimal 2 MB')).toBeNull();
  });

  it('calls onConfirm with selected file when confirm button is clicked', () => {
    const { container } = render(<DeleteModal {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['test'], 'valid.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const confirmBtn = screen.getByRole('button', { name: 'Hapus' });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(validFile);
  });
});
