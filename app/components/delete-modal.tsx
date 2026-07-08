'use client';

import { useRef, useEffect } from 'react';

interface DeleteModalProps {
  open: boolean;
  title?: string;
  description?: string;
  label?: string;
  hint?: string;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export function DeleteModal({
  open,
  title = 'Konfirmasi Hapus',
  description = 'Lampirkan file BA (Berita Acara) untuk menghapus data ini.',
  label = 'File BA (PDF)',
  hint = 'Maks 2MB, format PDF',
  cancelText = 'Batal',
  confirmText = 'Hapus',
  isLoading = false,
  disabled,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open]);

  const handleConfirm = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    onConfirm(file);
  };

  if (!open) return null;

  const isConfirmDisabled = disabled || isLoading || !fileRef.current?.files?.[0];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="mt-2 text-sm text-base-content/70">{description}</p>

        <fieldset className="fieldset mt-4">
          <legend className="fieldset-legend">{label}</legend>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="file-input file-input-bordered w-full"
            onChange={() => {}}
          />
          <p className="text-xs opacity-70">{hint}</p>
        </fieldset>

        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-error ${isLoading ? 'btn-disabled' : ''}`}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Menghapus...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={isLoading ? undefined : onClose} />
    </div>
  );
}
