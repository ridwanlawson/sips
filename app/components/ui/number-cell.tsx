'use client';

import { formatPerfNumber } from '@/utils/helpers/perf-formatter';

interface NumberCellProps {
  value: number | string | null | undefined;
  locale?: string;
  className?: string;
}

export function NumberCell({ value, locale = 'id', className }: NumberCellProps) {
  return (
    <span className={`text-right w-full${className ? ` ${className}` : ''}`}>
      {formatPerfNumber(value ?? 0, locale)}
    </span>
  );
}
