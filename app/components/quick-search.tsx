'use client';

import { useRef, useState } from 'react';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { Icon } from '@/app/components/icons';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalCount?: number;
  filteredCount?: number;
  'data-tour'?: string;
}

export function QuickSearch({
  value,
  onChange,
  placeholder = 'Cari...',
  totalCount,
  filteredCount,
  ...rest
}: QuickSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useSearchShortcut();

  return (
    <div className="relative w-full sm:w-72 md:w-80 group shrink-0" {...rest}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon
          name="search"
          className="h-4 w-4 opacity-50 group-focus-within:text-primary group-focus-within:opacity-100 transition-all"
        />
      </div>
      <input
        ref={searchInputRef}
        type="text"
        className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={placeholder}
        title={placeholder}
      />
      {!isFocused && !value && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <kbd className="kbd kbd-sm bg-base-200/50 opacity-50">/</kbd>
        </div>
      )}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
          aria-label="Clear search"
          title="Clear search"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      )}
      {value && totalCount !== undefined && filteredCount !== undefined && (
        <p className="text-xs text-base-content/60 mt-1">
          Menampilkan {filteredCount} dari {totalCount} records
        </p>
      )}
    </div>
  );
}
