'use client';

import { Icon } from '@/app/components/ui/icons';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}

export interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
  t?: (key: string) => string;
  className?: string;
}

export function FilterBar({
  fields,
  values,
  onChange,
  onApply,
  onReset,
  loading,
  t,
  className,
}: FilterBarProps) {
  return (
    <div className={`bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200${className ? ` ${className}` : ''}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {fields.map(field => {
          if (field.type === 'date') {
            return (
              <input
                key={field.key}
                type="date"
                className="input input-bordered w-full focus-visible:ring-2 focus-visible:ring-primary"
                placeholder={field.placeholder}
                aria-label={field.label || field.placeholder}
                title={field.label || field.placeholder}
                value={values[field.key] ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                disabled={field.disabled}
              />
            );
          }
          if (field.type === 'select') {
            return (
              <select
                key={field.key}
                className="select select-bordered w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={field.label || field.placeholder}
                title={field.label || field.placeholder}
                value={values[field.key] ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                disabled={field.disabled}
              >
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            );
          }
          return (
            <input
              key={field.key}
              type="text"
              className="input input-bordered w-full focus-visible:ring-2 focus-visible:ring-primary"
              placeholder={field.placeholder}
              aria-label={field.label || field.placeholder}
              title={field.label || field.placeholder}
              value={values[field.key] ?? ''}
              onChange={e => onChange(field.key, e.target.value)}
              disabled={field.disabled}
            />
          );
        })}
      </div>

      <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
        <button
          className={`btn btn-outline btn-primary focus-visible:ring-2 focus-visible:ring-primary ${loading ? 'btn-disabled' : ''}`}
          onClick={onApply}
          disabled={loading}
          aria-label={t?.('filterApply') ?? 'Apply'}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Icon name="filter" className="h-4 w-4" />
          )}
          {loading ? (t?.('loading') ?? 'Loading...') : (t?.('filterApply') ?? 'Apply')}
        </button>
        <button
          className={`btn btn-ghost focus-visible:ring-2 focus-visible:ring-primary ${loading ? 'btn-disabled' : ''}`}
          onClick={onReset}
          disabled={loading}
          aria-label={t?.('filterReset') ?? 'Reset'}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Icon name="refresh" className="h-4 w-4" />
          )}
          {loading ? (t?.('loading') ?? 'Loading...') : (t?.('filterReset') ?? 'Reset')}
        </button>
      </div>
    </div>
  );
}
