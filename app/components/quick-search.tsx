'use client';

import { memo, useState } from 'react';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { Icon } from '@/app/components/icons';
import { useTranslations } from 'next-intl';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
  'data-tour'?: string;
}

/**
 * 🎨 Palette Enhancement: QuickSearch component.
 * - Unified search UX with localized labels and keyboard shortcut hint.
 * - Performance optimized with React.memo.
 * - Accessible design with ARIA labels and focus states.
 */
export const QuickSearch = memo(function QuickSearch({
  value,
  onChange,
  placeholder,
  totalCount,
  filteredCount,
  className = 'w-full sm:w-72 md:w-80',
  ...rest
}: QuickSearchProps) {
  const t = useTranslations('Common');
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useSearchShortcut();

  const displayPlaceholder = placeholder || t('searchPlaceholder');

  return (
    <div className={`relative group shrink-0 ${className}`} {...rest}>
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
        placeholder={displayPlaceholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={t('quickSearch')}
        title={displayPlaceholder}
      />
      {!isFocused && !value && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none animate-fadeIn">
          <kbd className="kbd kbd-sm bg-base-200/50 opacity-50">/</kbd>
        </div>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors focus-visible:text-error outline-none"
          aria-label={t('clearSearch')}
          title={t('clearSearch')}
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      )}
      {value && totalCount !== undefined && filteredCount !== undefined && (
        <p className="text-xs text-base-content/60 mt-1 animate-fadeIn">
          {t('showingRecords', { filteredCount, totalCount })}
        </p>
      )}
    </div>
  );
});

QuickSearch.displayName = 'QuickSearch';
