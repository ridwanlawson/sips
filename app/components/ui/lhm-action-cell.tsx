import Link from 'next/link';
import { Icon } from '@/app/components/ui/icons';

interface LhmActionCellProps {
  fcba?: string;
  afdeling?: string;
  fddate?: string;
  kemandoran?: string;
  tooltip?: string;
}

export function LhmActionCell({ fcba, afdeling, fddate, kemandoran, tooltip }: LhmActionCellProps) {
  const tanggal = (fddate || '').split(' ')[0];
  if (!fcba || !fddate || !kemandoran) return null;
  return (
    <div className="space-x-1 whitespace-nowrap">
      <Link
        href={`/lhm/lhm-report?fcba=${fcba}&afdeling=${afdeling}&tanggal=${tanggal}&kemandoran=${kemandoran}`}
        className="tooltip tooltip-right"
        data-tip={tooltip ?? ` Print LHM Kemandoran ${kemandoran} `}
      >
        <Icon name="eye-view" className="h-4 w-4" />
      </Link>
    </div>
  );
}
