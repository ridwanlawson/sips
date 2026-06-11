'use client';

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function exportJsonToCsv(data: Array<Record<string, unknown>>, fileName: string) {
  if (!Array.isArray(data) || data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(header => escapeCsvValue(row[header])).join(','));

  const csvContent = [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
