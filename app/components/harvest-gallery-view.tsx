'use client';

import { useState, forwardRef, useImperativeHandle, useCallback, memo } from 'react';
import { PhotoCell } from '@/app/components/photo-cell';
import { EmptyState } from '@/app/components/empty-state';
import { getProxiedImageUrl } from '@/utils/imageHelper';
import { buildMapUrl } from '@/utils/mapHelper';
import { Icon, type IconName } from '@/app/components/icons';
import { useTranslations } from 'next-intl';

type HarvestItem = {
  _rowKey?: string;
  _displayDate?: string;
  _outputNum?: number;
  _brondolNum?: number;
  id: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan: string;
  nama_karyawan: string;
  noancak: string;
  tph: string;
  fieldcode: string;
  fcba: string;
  afdeling: string;
  output: string;
  mentah: string;
  overripe: string;
  busuk: string;
  busuk2: string;
  buahkecil: string;
  brondol: string;
  alasbrondol: string;
  tangkaipanjang: string;
  parteno: string;
  parteno50plus: string;
  status_harvesting: string;
  kemandoran?: string | null;
  images?: string | null;
  no_ba_exca?: string | null;
  exception_case?: string | null;
  id_device?: string | null;
  location?: string | null;
  card_id?: string | null;
  status_assistensi?: string | null;
  kode_karyawan_mandor1?: string | null;
  nama_karyawan_mandor1?: string | null;
  kode_karyawan_mandor_panen?: string | null;
  nama_karyawan_mandor_panen?: string | null;
  kode_karyawan_kerani?: string | null;
  nama_karyawan_kerani?: string | null;
};

interface HarvestGalleryViewProps {
  items: HarvestItem[];
  onClearSearch?: () => void;
}

export type HarvestGalleryHandle = {
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
 * ⚡ Bolt Optimization: Memoized HarvestCard.
 */
const HarvestCard = memo(function HarvestCard({
  item,
  index,
  isExpanded,
  onToggle,
}: {
  item: HarvestItem;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  const t = useTranslations('Harvest');

  const statusColor =
    (item.status_harvesting || '').toLowerCase() === 'planned'
      ? 'badge-warning'
      : (item.status_harvesting || '').toLowerCase() === 'approved'
        ? 'badge-success'
        : (item.status_harvesting || '').toLowerCase() === 'reject'
          ? 'badge-error'
          : 'badge-ghost';

  const dateOnly = (item.tanggal || '').split(' ')[0];
  const displayDate = item._displayDate || dateOnly || '-';

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
            <div className="font-semibold text-sm truncate" title={item.nama_karyawan}>
              {item.nama_karyawan}
            </div>
            <div className="text-xs text-base-content/60 truncate">{item.kode_karyawan}</div>
            <div className="text-xs text-base-content/70 mt-0.5">{displayDate}</div>
            <div className="text-xs text-base-content/70 mt-0.5">
              Kemandoran: <strong>{item.kemandoran || '-'}</strong>
            </div>
            <div className="text-xs text-base-content/70">
              Field: <strong>{item.fieldcode || '-'}</strong> &middot; TPH: <strong>{item.tph || '-'}</strong>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge badge-xs ${statusColor}`}>
                {item.status_harvesting || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-base-content/70">
              <span>Output: <strong>{item._outputNum ?? item.output ?? '-'}</strong></span>
              <span>Brondol: <strong>{item._brondolNum ?? item.brondol ?? '-'}</strong></span>
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
            <ItemRow label={t('colKemandoran')} value={item.kemandoran} />
            <ItemRow
              label="Kerani"
              value={item.nama_karyawan_kerani || item.kode_karyawan_kerani || '-'}
            />
            <ItemRow label={t('colFcba')} value={item.fcba} />
            <ItemRow label={t('colAfd')} value={item.afdeling} />
            <ItemRow label={t('colTph')} value={item.tph} />
            <ItemRow label={t('colField')} value={item.fieldcode} />
            <ItemRow label="No Ancak" value={item.noancak} />
            <ItemRow label={t('colOutput')} value={item.output} />
            <ItemRow label={t('colMentah')} value={item.mentah} />
            <ItemRow label={t('colOver')} value={item.overripe} />
            <ItemRow label={t('colBusuk')} value={item.busuk} />
            <ItemRow label={t('colBusuk2')} value={item.busuk2} />
            <ItemRow label={t('colBuahKecil')} value={item.buahkecil} />
            <ItemRow label={t('colParteNo')} value={item.parteno} />
            <ItemRow label={t('colParteNo50')} value={item.parteno50plus} />
            <ItemRow label={t('colBrondol')} value={item.brondol} />
            <ItemRow label={t('colAlBrondol')} value={item.alasbrondol} />
            <ItemRow label={t('colTPanjang')} value={item.tangkaipanjang} />
            <ItemRow
              label={t('colLokasi')}
              value={item.location ? `📍 ${t('gpsDefaultLabel')}` : null}
              href={item.location ? buildMapUrl(item.location) : null}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-3">
            <ItemRow label="Mandor 1" value={item.nama_karyawan_mandor1 || item.kode_karyawan_mandor1} />
            <ItemRow label="Mandor Panen" value={item.nama_karyawan_mandor_panen || item.kode_karyawan_mandor_panen} />
            <ItemRow label={t('colExceptionCase')} value={item.exception_case} />
            <ItemRow
              label={t('colLampiran')}
              value={item.no_ba_exca ? 'PDF' : null}
              href={item.no_ba_exca}
              icon="document-attach"
            />
            <ItemRow label="Device" value={item.id_device} />
          </div>
        </div>
      )}
    </div>
  );
});

export const HarvestGalleryView = forwardRef<HarvestGalleryHandle, HarvestGalleryViewProps>(
  function HarvestGalleryView({ items, onClearSearch }, ref) {
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
        <EmptyState namespace="Harvest" onClearSearch={onClearSearch} />
      );
    }

    return (
      <div>
        <div className="text-sm text-base-content/60 mb-3 px-1">
          Menampilkan <span className="font-semibold">{items.length}</span> data
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {items.map((item, index) => (
            <HarvestCard
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
