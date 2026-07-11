'use client';

import { useState, forwardRef, useImperativeHandle, useCallback, memo } from 'react';
import { PhotoCell } from '@/app/components/photo-cell';
import { EmptyState } from '@/app/components/empty-state';
import { getProxiedImageUrl } from '@/utils/imageHelper';
import { buildMapUrl } from '@/utils/mapHelper';
import { Icon, type IconName } from '@/app/components/icons';
import { useTranslations } from 'next-intl';

type GalleryItem = {
  _rowKey?: string;
  _displayDate?: string;
  _mandorLabel?: string;
  _karyawanLabel?: string;
  _karyawanName?: string;
  _karyawanCode?: string;
  _timeInDisplay?: string;
  _timeOutDisplay?: string;
  id: string;
  tanggal: string;
  kemandoran?: string | null;
  kode_karyawan_mandor?: string | null;
  kode_karyawan: string;
  time_in?: string | null;
  time_out?: string | null;
  location_in?: string | null;
  location_out?: string | null;
  pengancakan?: string | null;
  total_late_time?: string | null;
  go_home_early?: string | null;
  attendance_type?: string;
  attendance?: string;
  exception_case?: string | null;
  no_ba_exca?: string | null;
  fcba?: string | null;
  section?: string | null;
  gang?: string | null;
  fcba_destination?: string | null;
  section_destination?: string | null;
  id_device?: string | null;
  mac_address?: string | null;
  images?: string | null;
  status_attendance?: string | null;
  mandays?: number | string | null;
  namakaryawan?: string | null;
};

interface GalleryViewProps {
  items: GalleryItem[];
  onClearSearch?: () => void;
}

export type AttendanceGalleryViewHandle = {
  expandAll: () => void;
  collapseAll: () => void;
};

/**
 * ⚡ Bolt Optimization: Memoized sub-component for item rows.
 * Optimized to accept primitive value and optional link to ensure memoization effectiveness.
 */
const ItemRow = memo(function ItemRow({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string | number | null | undefined;
  href?: string | null;
  icon?: IconName;
}) {
  if (!value || value === '-' || value === '') return null;
  return (
    <div className="flex justify-between gap-2 text-sm py-1 border-b border-base-200 last:border-0">
      <span className="text-base-content/60 shrink-0">{label}</span>
      <span className="text-right font-medium break-all">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary text-xs inline-flex items-center gap-1"
          >
            {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </div>
  );
});

/**
 * ⚡ Bolt Optimization: Memoized GalleryCard.
 * - Uses pre-calculated enriched values with functional fallbacks to ensure UI correctness.
 */
const GalleryCard = memo(function GalleryCard({
  item,
  index,
  isExpanded,
  onToggle,
}: {
  item: GalleryItem;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  const t = useTranslations('Attendance');

  // ⚡ Bolt Optimization: Prefer pre-calculated values from enrichedItems
  const displayName = item._karyawanName || item.namakaryawan || item.kode_karyawan || '-';
  const displayCode = item._karyawanCode || (displayName !== item.kode_karyawan ? item.kode_karyawan : '');

  const statusColor =
    (item.status_attendance || '').toLowerCase() === 'planned'
      ? 'badge-warning'
      : (item.status_attendance || '').toLowerCase() === 'approved'
        ? 'badge-success'
        : (item.status_attendance || '').toLowerCase() === 'reject'
          ? 'badge-error'
          : 'badge-ghost';

  // ⚡ Bolt: Robust fallbacks for time formatting if enriched values are missing
  const timeIn = item._timeInDisplay || (item.time_in
    ? (item.time_in.includes(' ') ? item.time_in.split(' ')[1]?.slice(0, 5) : item.time_in.slice(0, 5))
    : '-');
  const timeOut = item._timeOutDisplay || (item.time_out
    ? (item.time_out.includes(' ') ? item.time_out.split(' ')[1]?.slice(0, 5) : item.time_out.slice(0, 5))
    : '-');
  const displayDate = item._displayDate || (item.tanggal || '').split(' ')[0] || '-';

  return (
    <div
      className={`card bg-base-100 border border-base-300 shadow-sm transition-all duration-200 ${
        isExpanded ? 'shadow-md' : 'hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="w-full text-left focus:outline-none"
      >
        <div className="p-3 flex gap-3 items-start">
          <div className="shrink-0 w-5 pt-1">
            <span className="text-xs font-mono text-base-content/40">{index + 1}</span>
          </div>
          <div className="shrink-0">
            <PhotoCell
              imageUrl={item.images}
              href={item.images ? getProxiedImageUrl(item.images) : undefined}
              size={72}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" title={displayName}>
              {displayName}
            </div>
            {displayCode && (
              <div className="text-xs text-base-content/60 truncate">{displayCode}</div>
            )}
            <div className="text-xs text-base-content/70 mt-0.5">{displayDate}</div>
            <div className="text-xs font-mono mt-1">
              {timeIn} - {timeOut}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-outline badge-xs">{item.attendance_type}</span>
              <span className={`badge badge-xs ${statusColor}`}>
                {item.status_attendance || '-'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-base-content/70">
              <span>HK: <strong>{item.mandays != null ? item.mandays : '-'}</strong></span>
              <span>Kemandoran: <strong>{item.kemandoran || '-'}</strong></span>
            </div>
          </div>

          <div className="shrink-0 pt-1">
            <Icon
              name="chevron-down"
              className={`h-4 w-4 text-base-content/40 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-base-200 animate-fadeIn">
          <div className="grid grid-cols-2 gap-x-3 pt-2">
            <ItemRow label={t('colMandor')} value={item._mandorLabel || item.kode_karyawan_mandor} />
            <ItemRow label={t('colFcba')} value={item.fcba} />
            <ItemRow label={t('colSection')} value={item.section} />
            <ItemRow label={t('colGang')} value={item.gang} />
            <ItemRow label={t('colPengancakan')} value={item.pengancakan} />
            <ItemRow label={t('colLate')} value={item.total_late_time} />
            <ItemRow label={t('colHomeEarly')} value={item.go_home_early} />
          </div>

          <div className="mt-2 pt-2 border-t border-base-200 grid grid-cols-2 gap-x-3">
            <ItemRow
              label={t('colLocIn')}
              value={item.location_in ? `📍 ${t('gpsDefaultLabel')}` : null}
              href={item.location_in ? buildMapUrl(item.location_in) : null}
            />
            <ItemRow
              label={t('colLocOut')}
              value={item.location_out ? `📍 ${t('gpsDefaultLabel')}` : null}
              href={item.location_out ? buildMapUrl(item.location_out) : null}
            />
            <ItemRow label={t('colExc')} value={item.exception_case} />
            <ItemRow
              label={t('colBaExca')}
              value={item.no_ba_exca ? 'PDF' : null}
              href={item.no_ba_exca}
              icon="document-attach"
            />
            <ItemRow label={t('colDevice')} value={item.id_device} />
            <ItemRow label={t('colMac')} value={item.mac_address} />
          </div>

          {item.attendance_type === 'ASSISTENSI' && (
            <div className="mt-2 pt-2 border-t border-base-200 grid grid-cols-2 gap-x-3">
              <ItemRow label={t('colFcbaDest')} value={item.fcba_destination} />
              <ItemRow label={t('colSectionDest')} value={item.section_destination} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const AttendanceGalleryView = forwardRef<AttendanceGalleryViewHandle, GalleryViewProps>(
  function AttendanceGalleryView({ items, onClearSearch }, ref) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useImperativeHandle(ref, () => ({
      expandAll: () => setExpandedIds(new Set(items.map(item => item.id))),
      collapseAll: () => setExpandedIds(new Set()),
    }), [items]);

    const toggleExpand = useCallback((id: string) => {
      setExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    if (items.length === 0) {
      return (
        <EmptyState namespace="Attendance" onClearSearch={onClearSearch} />
      );
    }

    return (
      <div>
        <div className="text-sm text-base-content/60 mb-3 px-1">
          Menampilkan <span className="font-semibold">{items.length}</span> data
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {items.map((item, index) => (
            <GalleryCard
              key={item._rowKey || item.id}
              item={item}
              index={index}
              isExpanded={expandedIds.has(item.id)}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      </div>
    );
  }
);
