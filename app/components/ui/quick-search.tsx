'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/app/components/ui/icons';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  namespace?: string;
  className?: string;
}

export function QuickSearch({
  value,
  onChange,
  placeholder,
  isFocused,
  onFocusChange,
  inputRef: externalRef,
  namespace = 'Navbar',
  className,
}: QuickSearchProps) {
  const t = useTranslations(namespace);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputRef]);

  return (
    <div className={`relative w-full${className ? ` ${className}` : ''}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon name="search" className={`h-4 w-4 transition-all ${isFocused ? 'text-primary opacity-100' : 'opacity-50'}`} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className={`input input-bordered w-full pl-9 pr-10 transition-all${isFocused ? ' input-primary shadow-sm' : ''}`}
        placeholder={placeholder ?? t('search')}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        data-tour="quick-search"
      />
      {value ? (
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
          onClick={() => onChange('')}
          aria-label={t('clear') ?? 'Clear'}
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/30 pointer-events-none hidden sm:inline">
          /
        </kbd>
      )}
    </div>
  );
}
