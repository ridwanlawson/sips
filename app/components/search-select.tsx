'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';

export type Option = { value: string; label: string };

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  small?: boolean;
  /** Optional: specific translation namespace to use. Defaults to 'Attendance' */
  translationNamespace?: string;
  /** Optional: style for fixed positioning (often used in dashboards or layouts where overflow is hidden) */
  useFixedPositioning?: boolean;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  name,
  small,
  translationNamespace = 'Attendance',
  useFixedPositioning = false,
}) => {
  const t = useTranslations(translationNamespace);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter(
      o => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
  }, [q, options]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const target = e.target as Node | null;
      if (target && !boxRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const currentLabel = options.find(o => o.value === value)?.label || value || '';

  const dropdownStyle = useMemo(() => {
    if (!open || !boxRef.current || !useFixedPositioning) return undefined;
    const rect = boxRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      top: rect.bottom + 4,
    };
  }, [open, useFixedPositioning]);

  return (
    <div className="relative min-w-0" ref={boxRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        className={`input input-bordered w-full flex items-center justify-between whitespace-nowrap overflow-hidden cursor-pointer ${
          small ? 'input-sm' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setOpen(s => !s)}
        aria-expanded={open}
        title={currentLabel || placeholder}
        disabled={disabled}
      >
        <span className={`truncate ${!value ? 'text-base-content/50' : ''}`}>
          {currentLabel || placeholder || t('select')}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="ml-2 h-4 w-4 opacity-60 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {required && !value && (
        <span className="sr-only" aria-live="polite">
          required
        </span>
      )}

      {open && !disabled && (
        <div
          className={`${
            useFixedPositioning ? 'fixed' : 'absolute'
          } z-[1000] mt-1 w-full rounded-xl border border-base-300 bg-base-100 shadow-xl animate-fadeIn`}
          style={dropdownStyle}
        >
          <div className="p-2 border-b border-base-200">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 opacity-60 group-focus-within:text-primary group-focus-within:opacity-100 transition-all"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                autoFocus
                className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder={t('typeToSearch')}
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
                  aria-label={t('clearSearch')}
                  title={t('clearSearch')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="p-3 text-base-content/60 text-sm text-center">{t('noData')}</li>
            )}
            {filtered.map(opt => (
              <li key={`ss-${opt.value}`}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-base-200 transition-colors ${
                    opt.value === value ? 'bg-base-200 font-semibold text-primary' : ''
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQ('');
                  }}
                  title={opt.label}
                >
                  <div className="font-medium truncate text-sm">{opt.label}</div>
                  {opt.label !== opt.value && (
                    <div className="text-[10px] opacity-70 truncate uppercase tracking-wider">
                      {opt.value}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
