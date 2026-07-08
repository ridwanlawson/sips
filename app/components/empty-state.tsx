'use client';

import { Icon } from '@/app/components/icons';
import React from 'react';
import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  /** The translation namespace to use for labels (e.g., 'Attendance', 'Harvest') */
  namespace: string;
  /** Optional callback to clear search/filters */
  onClearSearch?: () => void;
}

/**
 * 🎨 Palette Enhancement: EmptyState component.
 * Provides a consistent, accessible, and delightful empty state for data tables.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ namespace, onClearSearch }) => {
  const t = useTranslations(namespace);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center w-full min-h-[400px] animate-fadeIn">
      <div className="bg-base-200 p-8 rounded-full mb-6 ring-8 ring-base-100 shadow-inner">
        <Icon name="empty-search" className="w-12 h-12 opacity-30 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-base-content/80 mb-2">
        {t('noData')}
      </h3>
      <p className="text-base text-base-content/60 max-w-md mx-auto mb-10 leading-relaxed">
        {t('noDataHint')}
      </p>
      {onClearSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="btn btn-primary btn-md rounded-full px-10 shadow-md transition-all hover:scale-105 active:scale-95 hover:shadow-lg"
          aria-label={t('clearSearch')}
        >
          {t('clearSearch')}
        </button>
      )}
    </div>
  );
};
