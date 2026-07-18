'use client';

interface EmployeeNameCellProps {
  name: string | null | undefined;
  code?: string | null;
  codeLabel?: string;
  className?: string;
}

export function EmployeeNameCell({ name, code, codeLabel, className }: EmployeeNameCellProps) {
  return (
    <div className={`leading-tight ${className ?? ''}`} title={`${codeLabel ?? ''}${code ?? ''}`}>
      <div className="font-medium text-sm">{name ?? '-'}</div>
      {code && <div className="text-xs text-base-content/60">{code}</div>}
    </div>
  );
}
