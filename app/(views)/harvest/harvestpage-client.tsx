'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BusinessUnit } from '../../../utils/businessUnitService';
import { fetchBusinessUnits } from '../../../utils/businessUnitService';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { SkeletonTable } from '@/app/components/skeletons';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { exportJsonToCsv } from '@/utils/exportCsv';
import { formatPerfNumber } from '@/utils/perf-formatter';
import { useLocale } from '@/hooks/useLocale';
import { SearchSelect, type Option } from '@/app/components/search-select';
import { EmptyState } from '@/app/components/empty-state';

/* =========================
   T Y P E S
========================= */
type Harvest = {
  _rowKey?: string;
  _index?: number;
  /**
   * ⚡ Bolt Optimization: Cached values to avoid O(N*M) lookups and
   * expensive regex-based number parsing in render/search loops.
   */
  _searchContent?: string;
  _outputNum?: number;
  _mentahNum?: number;
  _overNum?: number;
  _busukNum?: number;
  _busuk2Num?: number;
  _kecilNum?: number;
  _partenoNum?: number;
  _parteno50Num?: number;
  _brondolNum?: number;
  _panjangNum?: number;

  id: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan_mandor1?: string | null;
  nama_karyawan_mandor1?: string | null;
  kode_karyawan_mandor_panen?: string | null;
  nama_karyawan_mandor_panen?: string | null;
  kode_karyawan_kerani?: string | null;
  nama_karyawan_kerani?: string | null;
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
  status_assistensi?: string | null;
  status_harvesting: string;
  kemandoran?: string | null;
  images?: string | null;
  no_ba_exca?: string | null;
  exception_case?: string | null;
  id_device?: string | null;
  location?: string | null;
  card_id?: string | null;
  created_at?: string | null;
  created_by?: string | null;
};

type Triplet = { fcba: string; sectionname: string; gangcode: string };

type Employee = {
  fccode: string;
  fullname?: string;
  fcba?: string;
  sectionname?: string;
  gangcode?: string;
  noancak?: string;
  attendance_type?: string;
  section_destination?: string;
};

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
  fcba?: unknown;
  sectionname?: unknown;
  gangcode?: unknown;
  noancak?: unknown;
  NOANCAK?: unknown;
};

type FormState = {
  id?: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan_mandor1: string;
  kode_karyawan_mandor_panen: string;
  kode_karyawan_kerani: string;
  kode_karyawan: string;
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
  status_assistensi: string;
  status_harvesting: string;
  kemandoran: string;
  exception_case: string;
  location: string;
  id_device: string;
  card_id: string;
  images: File | null;
  no_ba_exca: File | string | null;
};

const initialForm: FormState = {
  nodokumen: '',
  tanggal: getTodayISO(),
  kode_karyawan_mandor1: '',
  kode_karyawan_mandor_panen: '',
  kode_karyawan_kerani: '',
  kode_karyawan: '',
  noancak: '',
  tph: '',
  fieldcode: '',
  fcba: '',
  afdeling: '',
  output: '',
  mentah: '0',
  overripe: '0',
  busuk: '0',
  busuk2: '0',
  buahkecil: '0',
  brondol: '0',
  alasbrondol: '',
  tangkaipanjang: '0',
  parteno: '0',
  parteno50plus: '0',
  status_assistensi: '',
  status_harvesting: 'Planned',
  kemandoran: '',
  exception_case: '',
  location: '',
  id_device: '',
  card_id: '',
  images: null,
  no_ba_exca: null,
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  nodokumen: string;
  kode_karyawan: string;
  fcba: string;
  afdeling: string;
  tph: string;
  kemandoran: string;
}>;

/* =========================
   U T I L S
========================= */
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';
import { getTodayISO, formatDateDMY, formatDateISO, getYesterdayISO } from '@/utils/datetime';
import { buildMapUrl } from '@/utils/mapHelper';
import { cookieStore } from '@/utils/cookieStore';
import { type UserLevel } from '@/utils/filterHelper';
import { getReadableDevice, getOrCreateDeviceIds } from '@/utils/deviceHelper';
import { extractArrayData, extractSingleData } from '@/utils/apiHelpers';

const LocationButton: React.FC<{
  loc?: string | null;
  tanggal?: string;
  nodokumen?: string;
}> = ({ loc, tanggal, nodokumen }) => {
  if (!loc) return <span className="text-gray-400">-</span>;
  const googleUrl = buildMapUrl(loc);

  // Geo Sips URL dengan parameter
  const geoSipsUrl = `http://gis.skj.my.id:91?${new URLSearchParams({ dateFrom: formatDateISO(new Date(tanggal || '')) || '', dateTo: formatDateISO(new Date(tanggal || '')) || '', nodokumen: nodokumen || '' }).toString()}`;

  return (
    <div className="flex gap-1">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-xs gap-1"
        title={`Google Maps: ${loc}`}
      >
        <span aria-hidden>📍</span> {'GMaps'}
      </a>
      <a
        href={geoSipsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-xs gap-1 text-info"
        title="Buka di Geo Sips"
      >
        <span aria-hidden>🌐</span> Geo
      </a>
    </div>
  );
};

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatTotal = (value: number, localeTag = 'id-ID'): string =>
  formatPerfNumber(value, localeTag, { maximumFractionDigits: 2 });

/**
 * ⚡ Bolt Optimization: Use Map-based lookups for Business Units to avoid O(N) .find() in loops.
 */
const getBusinessUnitLookups = (businessUnits: BusinessUnit[] | undefined) => {
  const codeMap = new Map<string, BusinessUnit>();
  const nameMap = new Map<string, BusinessUnit>();

  if (Array.isArray(businessUnits)) {
    for (const bu of businessUnits) {
      if (bu.fccode) codeMap.set(bu.fccode, bu);
      if (bu.fcname) nameMap.set(bu.fcname.toLowerCase(), bu);
    }
  }

  return { codeMap, nameMap };
};

const resolveBusinessUnitCode = (
  value: string,
  lookups: { codeMap: Map<string, BusinessUnit>; nameMap: Map<string, BusinessUnit> }
): string => {
  if (!value) return '';
  const directMatch = lookups.codeMap.get(value);
  if (directMatch) return directMatch.fccode;

  const nameMatch = lookups.nameMap.get(value.toLowerCase());
  return nameMatch?.fccode || value;
};

const resolveBusinessUnitName = (
  value: string,
  lookups: { codeMap: Map<string, BusinessUnit>; nameMap: Map<string, BusinessUnit> }
): string => {
  if (!value) return '';
  const directMatch = lookups.codeMap.get(value);
  if (directMatch) return directMatch.fcname || directMatch.fccode;
  return value;
};

const getMonthDateRange = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { start: formatDateISO(start), end: formatDateISO(end) };
};

const formatDocDate = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return '';
  return `${match[3]}${match[2]}${match[1].slice(-2)}`;
};

const getRunningNumber = (nodokumen: string | null | undefined) => {
  const match = /\/(\d{4})$/.exec((nodokumen || '').trim());
  return match ? Number(match[1]) : 0;
};

const buildHarvestDocumentNo = ({
  fcba,
  afdeling,
  fieldcode,
  noancak,
  tanggal,
  running,
}: {
  fcba: string;
  afdeling: string;
  fieldcode: string;
  noancak: string;
  tanggal: string;
  running: number;
}) => {
  const docDate = formatDocDate(tanggal);
  if (!fcba || !afdeling || !fieldcode || !noancak || !docDate || running <= 0) return '';
  return `${fcba}/${afdeling}/${fieldcode}-${noancak}/${docDate}/${String(running).padStart(4, '0')}`;
};

/* =========================
   M A I N
========================= */
export default function HarvestPage() {
  const localeTag = useLocale();
  const tH = useTranslations('Harvest');
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      tanggal: yesterday,
      tanggal_end: today,
      nodokumen: '',
      kode_karyawan: '',
      fcba: '',
      afdeling: '',
      tph: '',
      kemandoran: '',
    };
  });

  const [userLevel, setUserLevel] = useState<UserLevel>('OTHER');
  const [homeFcba, setHomeFcba] = useState<string>('');
  const [homeSection, setHomeSection] = useState<string>('');
  const [homeGang, setHomeGang] = useState<string>('');
  const [userFcbaCookie, setUserFcbaCookie] = useState<string>('');
  const [userAfdelingCookie, setUserAfdelingCookie] = useState<string>('');

  // Modal states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteFile, setDeleteFile] = useState<File | undefined>(undefined);

  // Form states
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>('');
  const imgRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const deletePdfRef = useRef<HTMLInputElement | null>(null);

  // Cascading states for form
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [selFcba, setSelFcba] = useState<string>('');
  const [selSection, setSelSection] = useState<string>('');
  const [selGang, setSelGang] = useState<string>('');

  // Location loading state
  const [locLoading, setLocLoading] = useState<boolean>(false);

  // Check if user can modify (ADM or KSI only)
  const canModify = userLevel === 'ADM' || userLevel === 'KSI';

  // ESC to close modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  /* ===== Bootstrap cookies ===== */
  useEffect(() => {
    setHomeFcba(cookieStore.getFcba());
    setHomeSection(cookieStore.getSection());
    setHomeGang(cookieStore.getGang());
    setUserFcbaCookie(
      cookieStore.getCookie('user_Fcba') || cookieStore.getCookie('user_fcba') || ''
    );
    setUserAfdelingCookie(
      cookieStore.getCookie('user_Afdeling') || cookieStore.getCookie('user_afdeling') || ''
    );

    const levelRaw = cookieStore.getLevel();
    if (
      levelRaw === 'ADM' ||
      levelRaw === 'MGR' ||
      levelRaw === 'KSI' ||
      levelRaw === 'MD1' ||
      levelRaw === 'AST' ||
      levelRaw === 'KRT' ||
      levelRaw === 'KRA' ||
      levelRaw === 'KRP' ||
      levelRaw === 'MDP'
    ) {
      setUserLevel(levelRaw as UserLevel);
    } else {
      setUserLevel('OTHER');
    }

    const ckTrip = cookieStore.getCookie('opt_triplets');
    if (ckTrip) {
      try {
        const arr = JSON.parse(ckTrip) as Triplet[];
        if (Array.isArray(arr) && arr.length) setTriplets(arr);
      } catch {
        // ignore
      }
    }
  }, []);

  const getScopedFilters = useCallback(
    (baseFilters: Filters): Filters => {
      const scopedFilters: Filters = { ...baseFilters };
      if (userLevel === 'ADM' || userLevel === 'OTHER') {
        return scopedFilters;
      }
      scopedFilters.fcba = userFcbaCookie || homeFcba;
      if (userLevel === 'MGR' || userLevel === 'KSI') {
        // only FCBA locked
      } else if (userLevel === 'MDP' || userLevel === 'KRP') {
        scopedFilters.afdeling = userAfdelingCookie || homeSection;
        scopedFilters.kemandoran = homeGang;
      } else {
        // MD1, AST, KRT, KRA
        scopedFilters.afdeling = userAfdelingCookie || homeSection;
      }
      return scopedFilters;
    },
    [userLevel, homeFcba, homeSection, homeGang, userFcbaCookie, userAfdelingCookie]
  );

  const isFcbaLocked = userLevel !== 'ADM' && userLevel !== 'OTHER';
  const isAfdelingLocked = !(
    userLevel === 'ADM' ||
    userLevel === 'MGR' ||
    userLevel === 'KSI' ||
    userLevel === 'OTHER'
  );
  const isKemandoranLocked = userLevel === 'MDP' || userLevel === 'KRP';

  useEffect(() => {
    setFilters(current => {
      const next = getScopedFilters(current);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [getScopedFilters]);

  /* ===== Sync selFcba/selSection with user cookies ===== */
  useEffect(() => {
    if (userLevel !== 'ADM' && !selFcba) {
      setSelFcba(userFcbaCookie || homeFcba || '');
    }
    if (!(userLevel === 'ADM' || userLevel === 'MGR' || userLevel === 'KSI') && !selSection) {
      setSelSection(userAfdelingCookie || homeSection || '');
    }
  }, [userLevel, homeFcba, homeSection, selFcba, selSection, userFcbaCookie, userAfdelingCookie]);

  /* ===== Query for harvest list ===== */

  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['harvest', filters, userLevel, homeFcba, homeSection, homeGang],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.tanggal) p.set('tanggal', filters.tanggal);
      if (filters.tanggal_end) p.set('tanggal_end', filters.tanggal_end!);
      if (filters.nodokumen) p.set('nodokumen', filters.nodokumen);
      if (filters.kode_karyawan) p.set('kode_karyawan', filters.kode_karyawan);
      if (filters.fcba) p.set('fcba', filters.fcba);
      if (filters.afdeling) p.set('afdeling', filters.afdeling);
      if (filters.tph) p.set('tph', filters.tph);
      if (filters.kemandoran) p.set('kemandoran', filters.kemandoran);

      const res = await fetch(`/api/harvest?${p.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          await logoutAndRedirect();
          return [];
        }
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }

      const json: unknown = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      const raw = extractArrayData<Harvest>(json);

      // Remove duplicates and add row keys
      const byId = new Map<string, Harvest>();
      for (const row of raw) {
        if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
      }
      const dataRaw = Array.from(byId.values());

      const seen = new Set<string>();
      return dataRaw.map((it, idx) => {
        const dateOnly = (it.tanggal || '').split(' ')[0];
        // ⚡ Bolt Optimization: pre-calculate search content string
        const searchContent = [
          it.nodokumen,
          it.kode_karyawan,
          it.nama_karyawan,
          it.fcba,
          it.afdeling,
          it.tph,
          it.fieldcode,
          it.status_harvesting,
          it.kemandoran,
          dateOnly,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const candidate = [it.id || '', it.nodokumen || '', dateOnly, String(idx)].join('|');
        let key = candidate;
        while (seen.has(key)) key = `${key}_`;
        seen.add(key);
        return {
          ...it,
          _rowKey: key,
          _searchContent: searchContent,
          // ⚡ Bolt Optimization: pre-calculate numeric values to avoid redundant regex parsing in loops
          _outputNum: toNumber(it.output),
          _mentahNum: toNumber(it.mentah),
          _overNum: toNumber(it.overripe),
          _busukNum: toNumber(it.busuk),
          _busuk2Num: toNumber(it.busuk2),
          _kecilNum: toNumber(it.buahkecil),
          _partenoNum: toNumber(it.parteno),
          _parteno50Num: toNumber(it.parteno50plus),
          _brondolNum: toNumber(it.brondol),
          _panjangNum: toNumber(it.tangkaipanjang),
        };
      });
    },
    enabled: !!homeFcba || userLevel === 'ADM',
  });

  // Show toast on error
  useEffect(() => {
    if (queryError) {
      const msg =
        typeof queryError === 'string'
          ? queryError
          : queryError instanceof Error
            ? queryError.message
            : 'Terjadi kesalahan saat mengambil data';
      toast.error(msg);
    }
  }, [queryError]);

  const { data: nextDocumentNo = '', isFetching: isFetchingDocumentNo } = useQuery({
    queryKey: [
      'harvest-document-no',
      form.tanggal,
      form.fcba,
      form.afdeling,
      form.fieldcode,
      form.noancak,
      form.kemandoran,
    ],
    queryFn: async () => {
      const range = getMonthDateRange(form.tanggal);
      if (
        !range ||
        !form.fcba ||
        !form.afdeling ||
        !form.fieldcode ||
        !form.noancak ||
        !form.kemandoran
      ) {
        return '';
      }

      const params = new URLSearchParams({
        tanggal: range.start,
        tanggal_end: range.end,
        fcba: form.fcba,
        afdeling: form.afdeling,
        kemandoran: form.kemandoran,
      });

      const res = await fetch(`/api/harvest?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        return '';
      }
      if (!res.ok) return '';

      const json: unknown = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return '';
      }

      const rows = extractArrayData<Harvest>(json);
      const maxRunning = rows.reduce(
        (max, row) => Math.max(max, getRunningNumber(row.nodokumen)),
        0
      );

      return buildHarvestDocumentNo({
        fcba: form.fcba,
        afdeling: form.afdeling,
        fieldcode: form.fieldcode,
        noancak: form.noancak,
        tanggal: form.tanggal,
        running: maxRunning + 1,
      });
    },
    enabled:
      !isEditing &&
      !!form.tanggal &&
      !!form.fcba &&
      !!form.afdeling &&
      !!form.fieldcode &&
      !!form.noancak &&
      !!form.kemandoran,
    staleTime: 0,
  });

  useEffect(() => {
    if (isEditing || !nextDocumentNo) return;
    setForm(s => (s.nodokumen === nextDocumentNo ? s : { ...s, nodokumen: nextDocumentNo }));
  }, [isEditing, nextDocumentNo]);

  useEffect(() => {
    if (isEditing) return;
    setForm(s => (s.nodokumen ? { ...s, nodokumen: '' } : s));
  }, [
    isEditing,
    form.tanggal,
    form.fcba,
    form.afdeling,
    form.fieldcode,
    form.noancak,
    form.kemandoran,
  ]);

  /* ===== Parallel data fetching with useQuery ===== */
  // Business units query - runs in parallel
  const { data: businessUnits = [], isLoading: isLoadingBU } = useQuery({
    queryKey: ['businessUnits'],
    queryFn: async () => {
      try {
        const bu = await fetchBusinessUnits();
        localStorage.setItem('business_units', JSON.stringify(bu));
        return bu;
      } catch (err) {
        console.warn('failed to fetch business units:', err);
        const cached = localStorage.getItem('business_units');
        if (cached) {
          try {
            return JSON.parse(cached) as BusinessUnit[];
          } catch {
            return [];
          }
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Employees query - runs in parallel, depends on cookies only
  const { data: employees = [], isLoading: isLoadingEmp } = useQuery({
    queryKey: ['employees', userLevel, homeFcba, homeSection],
    queryFn: async () => {
      let apiUrl = '/api/karyawans';
      const params = new URLSearchParams();

      if (userLevel === 'AST') {
        if (homeFcba) params.append('fcba', homeFcba);
        if (homeSection) params.append('sectionname', homeSection);
      } else if (userLevel === 'ADM' || userLevel === 'MGR' || userLevel === 'KSI') {
        // ADM, MGR, KSI get employees by fcba (can select afdeling in UI)
        if (homeFcba) params.append('fcba', homeFcba);
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const r = await fetch(apiUrl, { credentials: 'include' });
      const j: unknown = await r.json();
      const rowsRaw = extractArrayData<EmployeesApiRow>(j);

      // Build triplets from employees if no cookie
      const ckTrip = cookieStore.getCookie('opt_triplets');
      if (!ckTrip && rowsRaw.length > 0) {
        const map = new Map<string, Triplet>();
        for (const it of rowsRaw) {
          const fcba = String(it.fcba ?? '').trim();
          const sectionname = String(it.sectionname ?? '').trim();
          const gangcode = String(it.gangcode ?? '').trim();
          if (!fcba && !sectionname && !gangcode) continue;
          const key = `${fcba}|${sectionname}|${gangcode}`;
          if (!map.has(key)) map.set(key, { fcba, sectionname, gangcode });
        }
        setTriplets(Array.from(map.values()));
      }

      // Build employees map
      const mapEmp = new Map<string, Employee>();
      for (const it of rowsRaw) {
        const fccode = String(it.fccode ?? '').trim();
        if (!fccode) continue;
        if (!mapEmp.has(fccode)) {
          // Extract noancak from API response
          const noancakValue =
            (it as { noancak?: unknown }).noancak ?? (it as { NOANCAK?: unknown }).NOANCAK;
          const noancak = typeof noancakValue === 'string' ? noancakValue.trim() : undefined;

          mapEmp.set(fccode, {
            fccode,
            fullname: typeof it.fcname === 'string' ? it.fcname : undefined,
            fcba: String(it.fcba ?? '').trim(),
            sectionname: String(it.sectionname ?? '').trim(),
            gangcode: String(it.gangcode ?? '').trim(),
            noancak,
            attendance_type: String(it.attendance_type ?? '').trim(),
            section_destination: String(it.section_destination ?? '').trim(),
          });
        }
      }
      return Array.from(mapEmp.values());
    },
    enabled: !!homeFcba || userLevel === 'ADM',
    staleTime: 30 * 60 * 1000, // 30 minutes - for poor network conditions
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  });

  const buLookups = useMemo(() => getBusinessUnitLookups(businessUnits), [businessUnits]);

  // Query: Field Codes from TPH API (by fcba + afdeling)
  const { data: tphFieldcodeData = [], isLoading: isLoadingFieldcode } = useQuery({
    queryKey: ['tph-fieldcodes', selFcba, selSection],
    queryFn: async () => {
      if (!selFcba || !selSection) return [];

      // ⚡ Bolt Optimization: Use Map lookup for O(1) BU name resolution
      const fcbaName = resolveBusinessUnitName(selFcba, buLookups);

      const params = new URLSearchParams();
      params.append('fcba', fcbaName);
      params.append('afdeling', selSection);

      try {
        const res = await fetch(`/api/tph?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const data = extractArrayData<{
          notph?: string;
          fieldcode?: string;
          ancakno?: string;
          division?: string;
        }>(json);
        return data;
      } catch (err) {
        console.error('Failed to fetch TPH fieldcodes:', err);
        return [];
      }
    },
    enabled: !!selFcba && !!selSection,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Derived: distinct Field Code options from TPH data
  const fieldcodeOptions: Option[] = useMemo(() => {
    if (!tphFieldcodeData.length) return [];
    const set = new Set<string>();
    for (const t of tphFieldcodeData) {
      const fc = String(t.fieldcode ?? '').trim();
      if (fc) set.add(fc);
    }
    return Array.from(set)
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [tphFieldcodeData]);

  // Query: TPH data from API (by fcba + afdeling + fieldcode)
  const { data: tphDetailData = [], isLoading: isLoadingTph } = useQuery({
    queryKey: ['tph-detail', selFcba, selSection, form.fieldcode],
    queryFn: async () => {
      if (!selFcba || !selSection || !form.fieldcode) return [];

      // ⚡ Bolt Optimization: Use Map lookup for O(1) BU name resolution
      const fcbaName = resolveBusinessUnitName(selFcba, buLookups);

      const params = new URLSearchParams();
      params.append('fcba', fcbaName);
      params.append('afdeling', selSection);
      params.append('fieldcode', form.fieldcode);

      try {
        const res = await fetch(`/api/tph?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const data = extractArrayData<{
          notph?: string;
          fieldcode?: string;
          ancakno?: string;
          division?: string;
        }>(json);
        return data;
      } catch (err) {
        console.error('Failed to fetch TPH detail:', err);
        return [];
      }
    },
    enabled: !!selFcba && !!selSection && !!form.fieldcode,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Derived: TPH (notph) options based on selected fieldcode
  const tphOptions: Option[] = useMemo(() => {
    if (!tphDetailData.length) return [];
    const set = new Map<string, string>();
    for (const t of tphDetailData) {
      const notph = String(t.notph ?? '').trim();
      if (notph && !set.has(notph)) {
        set.set(notph, notph);
      }
    }
    return Array.from(set, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [tphDetailData]);

  // Derived: Ancak options based on selected fieldcode (from detail data)
  /* ===== Prefetch TPH data for poor network conditions ===== */
  const prefetchTphData = useCallback(
    async (fcba: string, section: string, fieldcode?: string) => {
      // ⚡ Bolt Optimization: Use Map lookup for O(1) BU name resolution
      const fcbaName = resolveBusinessUnitName(fcba, buLookups);

      if (fieldcode) {
        // Prefetch TPH Detail
        await queryClient.prefetchQuery({
          queryKey: ['tph-detail', fcba, section, fieldcode],
          queryFn: async () => {
            try {
              const params = new URLSearchParams({
                fcba: fcbaName,
                afdeling: section,
                fieldcode: fieldcode,
              });
              const res = await fetch(`/api/tph?${params.toString()}`, {
                credentials: 'include',
              });
              if (!res.ok) return [];
              const json = await res.json();
              return extractArrayData<{
                notph?: string;
                fieldcode?: string;
                ancakno?: string;
                division?: string;
              }>(json);
            } catch {
              return [];
            }
          },
          staleTime: 30 * 60 * 1000,
        });
      } else {
        // Prefetch Field Codes
        await queryClient.prefetchQuery({
          queryKey: ['tph-fieldcodes', fcba, section],
          queryFn: async () => {
            try {
              const params = new URLSearchParams({
                fcba: fcbaName,
                afdeling: section,
              });
              const res = await fetch(`/api/tph?${params.toString()}`, {
                credentials: 'include',
              });
              if (!res.ok) return [];
              const json = await res.json();
              return extractArrayData<{
                notph?: string;
                fieldcode?: string;
                ancakno?: string;
                division?: string;
              }>(json);
            } catch {
              return [];
            }
          },
          staleTime: 30 * 60 * 1000,
        });
      }
    },
    [buLookups, queryClient]
  );

  useEffect(() => {
    // Prefetch Field Codes saat FCBA & Afdeling sudah terpilih
    if (selFcba && selSection) {
      prefetchTphData(selFcba, selSection);
    }
  }, [selFcba, selSection, prefetchTphData]);

  useEffect(() => {
    // Prefetch TPH Detail saat Field Code terpilih
    if (selFcba && selSection && form.fieldcode) {
      prefetchTphData(selFcba, selSection, form.fieldcode);
    }
  }, [selFcba, selSection, form.fieldcode, prefetchTphData]);

  /* ===== Location handler ===== */
  const handleGetLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast.error('Browser tidak mendukung GPS / geolocation. Isi manual saja.');
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const value = `${latitude},${longitude}`;
        setForm(s => ({ ...s, location: value }));
        setLocLoading(false);
      },
      err => {
        console.error('Geolocation error:', err);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mengambil lokasi. Coba lagi.'
        );
        setLocLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* ===== Mutations ===== */
  const mutation = useMutation({
    mutationFn: async ({ url, method, body }: { url: string; method: string; body: FormData }) => {
      const res = await fetch(url, {
        method,
        body,
        credentials: 'include',
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      if (!res.ok || !json.ok) {
        const errorMsg =
          typeof json.message === 'string'
            ? json.message
            : typeof json.error === 'string'
              ? json.error
              : 'Operation failed';
        throw new Error(errorMsg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest'] });
      setOpen(false);
      setForm(initialForm);
      setPreview('');
      if (imgRef.current) imgRef.current.value = '';
      if (pdfRef.current) pdfRef.current.value = '';
      toast.success(isEditing ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const body = new FormData();
      body.append('ba_deleted', file);
      body.append('_method', 'DELETE');

      const res = await fetch(`/api/harvest/${id}`, {
        method: 'POST',
        body,
        credentials: 'include',
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      if (!res.ok || !json.ok) {
        const errorMsg =
          typeof json.message === 'string'
            ? json.message
            : typeof json.error === 'string'
              ? json.error
              : 'Gagal hapus';
        throw new Error(errorMsg);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest'] });
      toast.success('Data berhasil dihapus 🗑️');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  /* ===== Fetch detail for edit ===== */
  const fetchDetail = useCallback(
    async (id: string) => {
      setIsEditing(true);
      setDetailLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/harvest/${id}`, {
          credentials: 'include',
        });
        if (res.status === 401) {
          await logoutAndRedirect();
          return;
        }
        const json = await res.json();
        if (isUnauthenticatedJson(json)) {
          await logoutAndRedirect();
          return;
        }
        const data = extractSingleData<Harvest>(json);
        if (!res.ok || !data) throw new Error('Gagal ambil data');

        setForm({
          id: data.id,
          nodokumen: data.nodokumen || '',
          tanggal: data.tanggal ? data.tanggal.split(' ')[0] : '',
          kode_karyawan_mandor1: data.kode_karyawan_mandor1 || '',
          kode_karyawan_mandor_panen: data.kode_karyawan_mandor_panen || '',
          kode_karyawan_kerani: data.kode_karyawan_kerani || '',
          kode_karyawan: data.kode_karyawan || '',
          noancak: data.noancak || '',
          tph: data.tph || '',
          fieldcode: data.fieldcode || '',
          fcba: data.fcba || '',
          afdeling: data.afdeling || '',
          output: data.output || '',
          mentah: data.mentah || '0',
          overripe: data.overripe || '0',
          busuk: data.busuk || '0',
          busuk2: data.busuk2 || '0',
          buahkecil: data.buahkecil || '0',
          brondol: data.brondol || '0',
          alasbrondol: data.alasbrondol || '',
          tangkaipanjang: data.tangkaipanjang || '0',
          parteno: data.parteno || '0',
          parteno50plus: data.parteno50plus || '0',
          status_assistensi: data.status_assistensi || '',
          status_harvesting: data.status_harvesting || 'Planned',
          kemandoran: data.kemandoran || '',
          exception_case: data.exception_case || '',
          location: data.location || '',
          id_device:
            data.id_device || `${getReadableDevice()} • ${getOrCreateDeviceIds().deviceId}`,
          card_id: data.card_id || '',
          images: null,
          no_ba_exca: data.no_ba_exca || null,
        });
        setPreview(data.images ? getProxiedImageUrl(data.images) : '');
        setSelFcba(data.fcba || homeFcba || '');
        setSelSection(data.afdeling || homeSection || '');
        setSelGang(data.kemandoran || '');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal memuat detail';
        toast.error(msg);
        setOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [homeFcba, homeSection]
  );

  /* ===== Computed options for cascading selects ===== */
  const fcbaOptions = useMemo(() => {
    if (businessUnits && businessUnits.length) {
      return businessUnits
        .map(b => ({
          value: b.fccode,
          label: b.fcname ? `${b.fccode} - ${b.fcname}` : b.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return Array.from(new Set(triplets.map(t => t.fcba).filter(Boolean)))
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [triplets, businessUnits]);

  const sectionOptions: Option[] = useMemo(() => {
    if (!selFcba) return [];
    // ⚡ Bolt Optimization: Pre-resolve the current FCBA code and name once.
    const selCode = resolveBusinessUnitCode(selFcba, buLookups);
    const selName = resolveBusinessUnitName(selFcba, buLookups);

    return Array.from(
      new Set(
        triplets
          .filter(t => {
            if (t.fcba === selFcba || t.fcba === selCode || t.fcba === selName) return true;
            return false;
          })
          .map(t => t.sectionname)
          .filter(Boolean)
      )
    )
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [triplets, selFcba, buLookups]);

  // Kemandoran: only gangs starting with MD
  const kemandoranOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection) return [];
    // ⚡ Bolt Optimization: Use Map lookup for O(1) BU name resolution
    const fcbaName = resolveBusinessUnitName(selFcba, buLookups);

    // Kemandoran = gangcode from employees matching fcba and section, only MD prefix
    const pool = employees.filter(
      e =>
        (e.fcba || '') === fcbaName &&
        (e.sectionname || '') === selSection &&
        (e.gangcode || '').toUpperCase().startsWith('MD')
    );
    const set = new Set<string>();
    for (const e of pool) {
      const raw = (e.gangcode || '').trim();
      if (raw) set.add(raw);
    }
    return Array.from(set)
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [employees, selFcba, selSection, buLookups]);

  // Query: Employees by fcba + afdeling + kemandoran (with MD->PN transformation for API)
  const { data: employeesByGang = [], isLoading: isLoadingEmpByGang } = useQuery({
    queryKey: ['employees-by-gang', selFcba, selSection, selGang],
    queryFn: async () => {
      if (!selFcba || !selSection || !selGang) return [];

      // ⚡ Bolt Optimization: Use Map lookup for O(1) BU name resolution
      const fcbaName = resolveBusinessUnitName(selFcba, buLookups);

      // Transform MDxxx to PNxxx for API parameter
      const gangForApi = selGang.toUpperCase().startsWith('MD')
        ? 'PN' + selGang.substring(2)
        : selGang;

      const params = new URLSearchParams();
      params.append('fcba', fcbaName);
      params.append('sectionname', selSection);
      params.append('gangcode', gangForApi);

      try {
        const res = await fetch(`/api/karyawans?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const rowsRaw = extractArrayData<EmployeesApiRow>(json);

        // Build employees map with noancak
        const mapEmp = new Map<string, Employee>();
        for (const it of rowsRaw) {
          const fccode = String(it.fccode ?? '').trim();
          if (!fccode) continue;
          if (!mapEmp.has(fccode)) {
            const noancakValue =
              (it as { noancak?: unknown }).noancak ?? (it as { NOANCAK?: unknown }).NOANCAK;
            const noancak = typeof noancakValue === 'string' ? noancakValue.trim() : undefined;

            mapEmp.set(fccode, {
              fccode,
              fullname: typeof it.fcname === 'string' ? it.fcname : undefined,
              fcba: String(it.fcba ?? '').trim(),
              sectionname: String(it.sectionname ?? '').trim(),
              gangcode: String(it.gangcode ?? '').trim(),
              noancak,
              attendance_type: String(it.attendance_type ?? '').trim(),
              section_destination: String(it.section_destination ?? '').trim(),
            });
          }
        }
        return Array.from(mapEmp.values());
      } catch (err) {
        console.error('Failed to fetch employees by gang:', err);
        return [];
      }
    },
    enabled: !!selFcba && !!selSection && !!selGang,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Employee options from employeesByGang query
  const employeeOptions: Option[] = useMemo(() => {
    if (!employeesByGang.length) return [];
    return employeesByGang
      .map(e => ({
        value: e.fccode,
        label: e.fullname ? `${e.fccode} - ${e.fullname}` : e.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeesByGang]);

  /* ===== Cascading change handlers ===== */
  const onChangeFcba = (v: string) => {
    setSelFcba(v);
    setSelSection('');
    setSelGang('');
    setForm(s => ({
      ...s,
      fcba: v,
      afdeling: '',
      fieldcode: '', // fieldcode dari TPH, reset saat FCBA berubah
      kemandoran: '',
      noancak: '',
      kode_karyawan: '',
      tph: '',
    }));
  };

  const onChangeSection = (v: string) => {
    setSelSection(v);
    setSelGang('');
    // fieldcode tidak direset saat section berubah (karena dari TPH API)
    setForm(s => ({
      ...s,
      afdeling: v,
      kemandoran: '',
      kode_karyawan: '',
    }));
  };

  const onChangeFieldcode = (v: string) => {
    setForm(s => ({
      ...s,
      fieldcode: v,
      noancak: '', // reset noancak dan tph saat fieldcode berubah
      tph: '',
    }));
  };

  const onChangeGang = (v: string) => {
    setSelGang(v);
    setForm(s => ({
      ...s,
      kemandoran: v,
      kode_karyawan: '',
    }));
  };

  const onChangeEmployee = (fccode: string) => {
    const emp = employeesByGang.find(e => e.fccode === fccode);
    setForm(s => ({
      ...s,
      kode_karyawan: fccode,
      noancak: emp?.noancak || '', // No Ancak from selected employee
      // ATTENDANCE_TYPE menentukan afdeling:
      // - ASSISTENSI → pakai SECTION_DESTINATION
      // - lainnya   → pakai SECTION
      afdeling:
        emp?.attendance_type === 'ASSISTENSI'
          ? emp?.section_destination || ''
          : emp?.sectionname || '',
    }));
  };

  /* ===== Device IDs ===== */
  useEffect(() => {
    const { deviceId } = getOrCreateDeviceIds();
    setForm(s => ({
      ...s,
      id_device: s.id_device || `${getReadableDevice()} • ${deviceId}`,
    }));
  }, []);

  /* ===== Form handlers ===== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    if (!canModify) {
      toast.error('Anda tidak memiliki akses untuk melakukan perubahan');
      return;
    }
    if (!isEditing && !form.nodokumen) {
      toast.error(
        'No dokumen belum terbentuk. Lengkapi FCBA, afdeling, field, kemandoran, dan karyawan.'
      );
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'images' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'no_ba_exca' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'no_ba_exca' && isEditing && typeof value === 'string') {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const url = isEditing && form.id ? `/api/harvest/${form.id}` : '/api/harvest';
    const method = isEditing && form.id ? 'PUT' : 'POST';

    mutation.mutate({ url, method, body: formData });
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteFile(undefined);
    if (deletePdfRef.current) deletePdfRef.current.value = '';
    setDeleteOpen(true);
  }, []);

  const closeDeleteModal = () => {
    if (deleteMutation.isPending) return;
    setDeleteOpen(false);
    setDeleteTargetId('');
    setDeleteFile(undefined);
    if (deletePdfRef.current) deletePdfRef.current.value = '';
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    if (!deleteFile) {
      toast.error('Lampiran BA delete PDF wajib diisi');
      return;
    }
    if (deleteFile.type !== 'application/pdf') {
      toast.error('Lampiran BA delete harus berupa file PDF');
      return;
    }
    if (deleteFile.size > 2 * 1024 * 1024) {
      toast.error('Lampiran BA delete maksimal 2 MB');
      return;
    }

    deleteMutation.mutate(
      { id: deleteTargetId, file: deleteFile },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          setDeleteTargetId('');
          setDeleteFile(undefined);
          if (deletePdfRef.current) deletePdfRef.current.value = '';
        },
      }
    );
  };

  /* ===== Quick search ===== */
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    // ⚡ Bolt Optimization: Use pre-calculated search content for O(1) string check per row
    return items.filter(it => it._searchContent?.includes(s));
  }, [q, items]);

  const harvestTotals = useMemo(
    () =>
      filtered.reduce(
        (acc, row) => ({
          // ⚡ Bolt Optimization: Use pre-calculated numbers to avoid thousands of O(N*M) toNumber/regex calls during search
          output: acc.output + (row._outputNum || 0),
          mentah: acc.mentah + (row._mentahNum || 0),
          overripe: acc.overripe + (row._overNum || 0),
          busuk: acc.busuk + (row._busukNum || 0),
          brondol: acc.brondol + (row._brondolNum || 0),
        }),
        {
          output: 0,
          mentah: 0,
          overripe: 0,
          busuk: 0,
          brondol: 0,
        }
      ),
    [filtered]
  );

  const totalCards = [
    {
      label: 'Total Janjang',
      value: harvestTotals.output,
      className: 'text-primary',
    },
    {
      label: 'Total Brondolan',
      value: harvestTotals.brondol,
      className: 'text-success',
    },
  ];

  /* ===== EXPORT EXCEL ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      No: idx + 1,
      'No Dokumen': r.nodokumen || '-',
      Tanggal: (r.tanggal || '').split(' ')[0],
      'Kode Karyawan': r.kode_karyawan || '-',
      'Nama Karyawan': r.nama_karyawan || '-',
      Kemandoran: r.kemandoran || '-',
      FCBA: r.fcba || '-',
      Afdeling: r.afdeling || '-',
      TPH: r.tph || '-',
      'Field Code': r.fieldcode || '-',
      Output: r.output || '0',
      Mentah: r.mentah || '0',
      Overripe: r.overripe || '0',
      Busuk: r.busuk || '0',
      Busuk2: r.busuk2 || '0',
      'Buah Kecil': r.buahkecil || '0',
      Brondol: r.brondol || '0',
      'Alas Brondol': r.alasbrondol || '0',
      'Tangkai Panjang': r.tangkaipanjang || '0',
      Parteno: r.parteno || '0',
      'Parteno 50+': r.parteno50plus || '0',
      Status: r.status_harvesting || '-',
      Lokasi: r.location || '-',
    }));

    exportJsonToCsv(
      dataToExport,
      `Harvesting_${filters.tanggal || 'all'}_${filters.tanggal_end || 'all'}.csv`
    );
  };

  /* ===== Columns ===== */
  const columns: TableColumn<Harvest>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data panen">Aksi</span>,
        width: '120px',
        cell: (row: Harvest) => {
          const status = (row.status_harvesting || '').toLowerCase();
          const isPlanned = status === 'planned';
          const canEditRole = canModify;
          const canEdit = canEditRole && isPlanned;
          const canDelete =
            (userLevel === 'ADM' || userLevel === 'KSI') && status !== 'approved' && status !== '';

          return (
            <div className="space-x-1 whitespace-nowrap overflow-visible">
              {canEditRole && (
                <button
                  className={`btn btn-xs ${canEdit ? 'btn-outline' : 'btn-disabled'}`}
                  onClick={() => canEdit && fetchDetail(row.id)}
                  disabled={!canEdit}
                  title={canEdit ? 'Edit' : 'Hanya bisa edit saat Planned'}
                >
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  className="btn btn-xs btn-error"
                  onClick={() => handleDelete(row.id)}
                  title="Hapus (hanya ADM & belum Approved)"
                >
                  Hapus
                </button>
              )}
            </div>
          );
        },
        ignoreRowClick: true,
      },
      {
        name: <span title="Status persetujuan panen (Planned/Approved/dll)">Status</span>,
        selector: r => r.status_harvesting ?? '-',
        sortable: true,
        width: '120px',
        cell: r => (
          <span
            className={`badge ${
              (r.status_harvesting || '').toLowerCase() === 'planned'
                ? 'badge-warning'
                : (r.status_harvesting || '').toLowerCase() === 'approved'
                  ? 'badge-success'
                  : 'badge-ghost'
            }`}
          >
            {r.status_harvesting ?? '-'}
          </span>
        ),
      },
      {
        name: <span title="Nomor urut baris">#</span>,
        width: '56px',
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: 'No Dokumen',
        selector: row => row.nodokumen,
        sortable: true,
        width: '250px',
      },
      {
        name: 'Tanggal',
        selector: row => row.tanggal,
        format: row => formatDateDMY(row.tanggal),
        sortable: true,
        width: '100px',
      },
      {
        name: 'Karyawan',
        selector: row => row.nama_karyawan || row.kode_karyawan,
        sortable: true,
        width: '180px',
        cell: row => (
          <div>
            <div className="font-medium">{row.nama_karyawan}</div>
            <div className="text-xs text-gray-500">{row.kode_karyawan}</div>
          </div>
        ),
      },
      {
        name: 'Kemandoran',
        selector: row => row.kemandoran || '-',
        sortable: true,
        width: '120px',
      },
      {
        name: 'FCBA',
        selector: row => row.fcba,
        sortable: true,
        width: '80px',
      },
      {
        name: 'Afd',
        selector: row => row.afdeling,
        sortable: true,
        width: '80px',
      },
      {
        name: 'TPH',
        selector: row => row.tph,
        sortable: true,
        width: '80px',
      },
      {
        name: 'Field',
        selector: row => row.fieldcode,
        sortable: true,
        width: '80px',
      },
      {
        name: 'Output',
        selector: row => row.output,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._outputNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Mentah',
        selector: row => row.mentah,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._mentahNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Over',
        selector: row => row.overripe,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._overNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Busuk',
        selector: row => row.busuk,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._busukNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Busuk 2',
        selector: row => row.busuk2,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._busuk2Num || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Buah Kecil',
        selector: row => row.buahkecil,
        sortable: true,
        width: '110px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._kecilNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Parte No',
        selector: row => row.parteno,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._partenoNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Parte No 50%+',
        selector: row => row.parteno50plus,
        sortable: true,
        width: '130px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._parteno50Num || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Brondol',
        selector: row => row.brondol,
        sortable: true,
        width: '90px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._brondolNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: 'Al. Brondol',
        selector: row => row.alasbrondol,
        sortable: true,
        width: '110px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(toNumber(row.alasbrondol), localeTag)}
          </span>
        ),
      },
      {
        name: 'T.Panjang',
        selector: row => row.tangkaipanjang,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'end' },
        cell: row => (
          <span className="text-right w-full">
            {formatPerfNumber(row._panjangNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: (
          <span title="Lokasi panen" className="text-center">
            Lokasi
          </span>
        ),
        selector: row => row.location || '',
        width: '140px',
        cell: row => (
          <LocationButton loc={row.location} tanggal={row.tanggal} nodokumen={row.nodokumen} />
        ),
      },
      {
        name: <span title="Exception Case (alasan/keterangan khusus)">Exception Case</span>,
        selector: row => row.exception_case || '-',
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: '160px' },
      },
      {
        name: <span title="Lampiran BA EXCA atau file pendukung">Lampiran</span>,
        selector: row => row.no_ba_exca || '-',
        sortable: true,
        width: '120px',
        cell: row =>
          row.no_ba_exca ? (
            <a
              href={row.no_ba_exca}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
              title="Buka lampiran"
            >
              PDF
            </a>
          ) : (
            '-'
          ),
      },
      {
        name: <span title="Foto pendukung panen (bila ada)">Foto</span>,
        width: '90px',
        cell: (r: Harvest) =>
          r.images ? (
            <a
              href={getProxiedImageUrl(r.images)}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka foto"
            >
              <div className="relative w-10 h-10 rounded-lg ring-1 ring-base-300 bg-base-200 overflow-hidden">
                <Image
                  src={getProxiedImageUrl(r.images)}
                  alt="foto"
                  fill
                  className="object-cover"
                  loading="lazy"
                  onError={e => {
                    const img = e?.currentTarget as HTMLImageElement | null;
                    if (img) {
                      img.onerror = null;
                      img.src = PLACEHOLDER_IMAGE;
                    }
                  }}
                  unoptimized
                />
              </div>
            </a>
          ) : (
            '-'
          ),
        ignoreRowClick: true,
      },
    ],
    [canModify, fetchDetail, handleDelete, userLevel, localeTag]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden space-y-4">
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start animate-slideUp">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Harvesting (Panen)"
          >
            Harvesting (Panen)
          </h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(s => !s)}>
              {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            </button>
            <button
              className={`btn btn-sm ${loading ? 'btn-disabled' : ''}`}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['harvest'] })}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Memuat...
                </>
              ) : (
                'Refresh'
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExport}
              title="Ekspor data yang difilter ke Excel"
            >
              Export
            </button>
            {canModify && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsEditing(false);
                  // Initialize form with today's date and user cookies
                  setForm({
                    ...initialForm,
                    tanggal: getTodayISO(),
                    fcba: userLevel === 'ADM' ? '' : userFcbaCookie || homeFcba || '',
                    afdeling:
                      userLevel === 'ADM' || userLevel === 'KSI'
                        ? ''
                        : userAfdelingCookie || homeSection || '',
                  });
                  setPreview('');
                  // Initialize cascading selects with user cookies
                  setSelFcba(userLevel === 'ADM' ? '' : userFcbaCookie || homeFcba || '');
                  setSelSection(
                    userLevel === 'ADM' || userLevel === 'KSI'
                      ? ''
                      : userAfdelingCookie || homeSection || ''
                  );
                  setSelGang('');
                  setOpen(true);
                  // Auto get location
                  setTimeout(() => {
                    handleGetLocation();
                  }, 0);
                }}
              >
                + Tambah Panen
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-col md:flex-row items-center gap-4 animate-slideUp [animation-delay:100ms]">
          {/* TOTAL CARDS (di kiri) */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {totalCards.map(card => (
              <div
                key={card.label}
                className="bg-base-100 border border-base-200 rounded-lg px-3 py-2 shadow-sm whitespace-nowrap"
              >
                <div className="text-[10px] opacity-70 leading-none">{card.label}</div>
                <div className={`text-sm font-semibold ${card.className}`}>
                  {formatTotal(card.value, localeTag)}
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH (dorong ke kanan) */}
          <div className="ml-auto w-full md:w-96 group relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-50 group-focus-within:text-primary group-focus-within:opacity-100 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              placeholder={tH('searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label={tH('quickSearch')}
              title={tH('quickSearch')}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
                aria-label={tH('clearSearch')}
                title={tH('clearSearch')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal}
                onChange={e => setFilters(s => ({ ...s, tanggal: e.target.value }))}
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal_end}
                onChange={e => setFilters(s => ({ ...s, tanggal_end: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Dokumen"
                value={filters.nodokumen}
                onChange={e => setFilters(s => ({ ...s, nodokumen: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.kode_karyawan}
                onChange={e => setFilters(s => ({ ...s, kode_karyawan: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kemandoran"
                value={filters.kemandoran}
                disabled={isKemandoranLocked}
                onChange={e => setFilters(s => ({ ...s, kemandoran: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba}
                disabled={isFcbaLocked}
                onChange={e => setFilters(s => ({ ...s, fcba: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling}
                disabled={isAfdelingLocked}
                onChange={e => setFilters(s => ({ ...s, afdeling: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="TPH"
                value={filters.tph}
                onChange={e => setFilters(s => ({ ...s, tph: e.target.value }))}
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['harvest'] })}
                disabled={loading}
                title="Terapkan filter"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Memuat...
                  </>
                ) : (
                  'Terapkan Filter'
                )}
              </button>
              <button
                className={`btn ${loading ? 'btn-disabled' : ''}`}
                onClick={() => {
                  const resetFilters: Filters = {
                    tanggal: '',
                    tanggal_end: '',
                    nodokumen: '',
                    kode_karyawan: '',
                    kemandoran: '',
                    fcba: '',
                    afdeling: '',
                    tph: '',
                  };
                  setFilters(getScopedFilters(resetFilters));
                }}
                disabled={loading}
                title="Reset semua filter"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Memuat...
                  </>
                ) : (
                  'Reset'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100 animate-slideUp [animation-delay:200ms]">
          <div className="min-w-[900px]">
            {loading ? (
              <SkeletonTable rows={10} />
            ) : (
              <DataTable
                keyField="_rowKey"
                columns={columns}
                data={filtered}
                pagination
                customStyles={centerHeaderStyle}
                paginationPerPage={100}
                paginationRowsPerPageOptions={[100, 500, 1000, 5000]}
                dense
                highlightOnHover
                pointerOnHover
                fixedHeader
                fixedHeaderScrollHeight="520px"
                persistTableHead
                responsive
                noDataComponent={<EmptyState namespace="Harvest" onClearSearch={q ? () => setQ('') : undefined} />}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {open && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">
                {isEditing ? 'Edit Data Panen' : 'Tambah Data Panen'}
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => {
                  setOpen(false);
                  setPreview('');
                }}
                aria-label="Tutup"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Memuat detail...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* No Dokumen */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">No Dokumen *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.nodokumen}
                      readOnly
                      placeholder={
                        isFetchingDocumentNo && !isEditing
                          ? 'Menghitung otomatis...'
                          : 'Otomatis setelah FCBA, afdeling, field, kemandoran, karyawan terisi'
                      }
                      required
                    />
                    <p className="text-xs opacity-70">
                      Format: FCBA/Afdeling/Field-Ancak/DDMMYY/Running bulanan per kemandoran.
                    </p>
                  </fieldset>

                  {/* Tanggal */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Tanggal *</legend>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={form.tanggal}
                      max={getTodayISO()}
                      onChange={e => setForm(s => ({ ...s, tanggal: e.target.value }))}
                      required
                    />
                  </fieldset>

                  {/* FCBA: ADM bisa pilih, lainnya dikunci ke user_Fcba cookie */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      {userLevel === 'ADM' ? 'FCBA *' : 'FCBA (akun)'}
                    </legend>
                    {userLevel === 'ADM' ? (
                      <SearchSelect
                        options={fcbaOptions}
                        value={selFcba}
                        onChange={onChangeFcba}
                        placeholder={isLoadingBU ? 'Memuat FCBA...' : 'Pilih FCBA'}
                        disabled={isLoadingBU}
                        translationNamespace="Harvest"
                      />
                    ) : (
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={userFcbaCookie || homeFcba || ''}
                        readOnly
                        disabled
                      />
                    )}
                  </fieldset>

                  {/* Afdeling: ADM/MGR/KSI bisa pilih, lainnya dikunci ke user_Afdeling cookie */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      {userLevel === 'ADM' || userLevel === 'MGR' || userLevel === 'KSI'
                        ? 'Afdeling (Section) *'
                        : 'Afdeling (akun)'}
                    </legend>
                    {userLevel === 'ADM' || userLevel === 'MGR' || userLevel === 'KSI' ? (
                      <SearchSelect
                        options={sectionOptions}
                        value={selSection ?? ''}
                        onChange={onChangeSection}
                        placeholder={
                          isLoadingEmp
                            ? 'Memuat...'
                            : selFcba
                              ? 'Pilih Afdeling'
                              : 'Pilih FCBA dulu'
                        }
                        disabled={!selFcba || isLoadingEmp}
                        translationNamespace="Harvest"
                      />
                    ) : (
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={userAfdelingCookie || homeSection || ''}
                        readOnly
                        disabled
                      />
                    )}
                  </fieldset>

                  {/* Field Code - dari API TPH (fcba + afdeling) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Field Code *</legend>
                    {isLoadingFieldcode ? (
                      <div className="skeleton h-10 w-full rounded-md animate-pulse bg-base-300" />
                    ) : (
                      <SearchSelect
                        options={fieldcodeOptions}
                        value={form.fieldcode ?? ''}
                        onChange={onChangeFieldcode}
                        placeholder={
                          selFcba && selSection
                            ? fieldcodeOptions.length === 0
                              ? 'Tidak ada Field Code'
                              : 'Pilih Field Code'
                            : 'Pilih FCBA dan Afdeling dulu'
                        }
                        disabled={!selFcba || !selSection}
                        translationNamespace="Harvest"
                      />
                    )}
                  </fieldset>

                  {/* TPH - dari TPH API (fcba + afdeling + fieldcode) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">TPH *</legend>
                    {isLoadingTph ? (
                      <div className="skeleton h-10 w-full rounded-md animate-pulse bg-base-300" />
                    ) : (
                      <SearchSelect
                        options={tphOptions}
                        value={form.tph ?? ''}
                        onChange={v => setForm(s => ({ ...s, tph: v }))}
                        placeholder={
                          form.fieldcode
                            ? tphOptions.length === 0
                              ? 'Tidak ada TPH'
                              : 'Pilih TPH'
                            : 'Pilih Field Code dulu'
                        }
                        disabled={!form.fieldcode}
                        translationNamespace="Harvest"
                      />
                    )}
                  </fieldset>

                  {/* Kemandoran - hanya gang dengan prefix MD */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Kemandoran</legend>
                    <SearchSelect
                      options={kemandoranOptions}
                      value={form.kemandoran ?? ''}
                      onChange={onChangeGang}
                      placeholder={
                        isLoadingEmp
                          ? 'Memuat...'
                          : selSection
                            ? kemandoranOptions.length === 0
                              ? 'Tidak ada Kemandoran MD'
                              : 'Pilih Kemandoran'
                            : 'Pilih Afdeling dulu'
                      }
                      disabled={!selSection || isLoadingEmp}
                      translationNamespace="Harvest"
                    />
                  </fieldset>

                  {/* Kode Karyawan - dari API dengan fcba+afdeling+kemandoran (MD->PN) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Karyawan *</legend>
                    <SearchSelect
                      options={employeeOptions}
                      value={form.kode_karyawan ?? ''}
                      onChange={onChangeEmployee}
                      placeholder={
                        isLoadingEmpByGang
                          ? 'Memuat Karyawan...'
                          : selGang
                            ? employeeOptions.length === 0
                              ? 'Tidak ada Karyawan'
                              : 'Pilih Karyawan'
                            : 'Pilih Kemandoran dulu'
                      }
                      disabled={!selGang || isLoadingEmpByGang}
                      translationNamespace="Harvest"
                    />
                  </fieldset>

                  {/* No Ancak - otomatis dari Karyawan yang dipilih */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">No Ancak</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.noancak ?? ''}
                      readOnly
                      disabled
                      placeholder="Otomatis dari Karyawan"
                    />
                  </fieldset>
                </div>

                <div className="divider">Output Data</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Output */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Output</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.output}
                      onChange={e => setForm(s => ({ ...s, output: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>

                  {/* Mentah */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Mentah</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.mentah}
                      onChange={e => setForm(s => ({ ...s, mentah: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Overripe */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Overripe</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.overripe}
                      onChange={e => setForm(s => ({ ...s, overripe: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Busuk */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Busuk</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.busuk}
                      onChange={e => setForm(s => ({ ...s, busuk: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Busuk 2 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Busuk 2</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.busuk2}
                      onChange={e => setForm(s => ({ ...s, busuk2: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Buah Kecil */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Buah Kecil</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.buahkecil}
                      onChange={e => setForm(s => ({ ...s, buahkecil: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Brondol */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Brondol</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.brondol}
                      onChange={e => setForm(s => ({ ...s, brondol: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Tangkai Panjang */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Tangkai Panjang</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.tangkaipanjang}
                      onChange={e =>
                        setForm(s => ({
                          ...s,
                          tangkaipanjang: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Parteno */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Parteno</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.parteno}
                      onChange={e => setForm(s => ({ ...s, parteno: e.target.value }))}
                      min="0"
                    />
                  </div>

                  {/* Parteno 50+ */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Parteno 50+</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.parteno50plus}
                      onChange={e =>
                        setForm(s => ({
                          ...s,
                          parteno50plus: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Alas Brondol */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Alas Brondol</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={form.alasbrondol}
                      onChange={e => setForm(s => ({ ...s, alasbrondol: e.target.value }))}
                    >
                      <option value="">- Pilih -</option>
                      <option value="Y">Ya (Y)</option>
                      <option value="N">Tidak (N)</option>
                    </select>
                  </div>
                </div>

                <div className="divider">Informasi Tambahan</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lokasi */}
                  <fieldset className="fieldset md:col-span-2">
                    <legend className="fieldset-legend">Lokasi (lat,lng) *</legend>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.location}
                        onChange={e => setForm(s => ({ ...s, location: e.target.value }))}
                        placeholder="contoh: -2.2893371,118.0399877"
                        required
                      />

                      <button
                        type="button"
                        className={`btn btn-square ${locLoading ? 'btn-disabled' : ''}`}
                        onClick={handleGetLocation}
                        disabled={locLoading}
                      >
                        {locLoading ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          '📍'
                        )}
                      </button>
                    </div>

                    {form.location && (
                      <div className="mt-1">
                        <a
                          className="link link-primary text-sm"
                          href={buildMapUrl(form.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                  </fieldset>

                  {/* Exception Case + File PDF dalam 1 row */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Exception Case {!isEditing ? '*' : ''}
                    </legend>

                    <textarea
                      className="textarea textarea-bordered min-h-24 w-full"
                      value={form.exception_case}
                      onChange={e =>
                        setForm(s => ({
                          ...s,
                          exception_case: e.target.value,
                        }))
                      }
                      required={!isEditing}
                      rows={3}
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">File BA ExCa (PDF)</legend>

                    <input
                      type="file"
                      ref={pdfRef}
                      accept=".pdf"
                      className="file-input file-input-bordered w-full"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setForm(s => ({ ...s, no_ba_exca: file }));
                      }}
                    />
                  </fieldset>

                  {/* FOTO FULL WIDTH */}
                  <fieldset className="fieldset md:col-span-2">
                    <legend className="fieldset-legend">Foto</legend>

                    <input
                      type="file"
                      ref={imgRef}
                      accept="image/*"
                      className="file-input file-input-bordered w-full"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;

                        setForm(s => ({ ...s, images: file }));

                        if (file) {
                          const url = URL.createObjectURL(file);
                          setPreview(url);
                        }
                      }}
                    />

                    {/* Preview Full Width */}
                    {preview && (
                      <div className="mt-3 relative w-full h-80 rounded-xl overflow-hidden border">
                        <Image
                          src={preview}
                          alt="Preview"
                          fill
                          className="object-contain bg-base-200"
                          sizes="100vw"
                        />
                      </div>
                    )}
                  </fieldset>
                </div>

                {/* Actions */}
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setOpen(false);
                      setPreview('');
                    }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setOpen(false);
              setPreview('');
            }}
          ></div>
        </div>
      )}

      {deleteOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">Hapus Data Panen</h3>
            <p className="mt-2 text-sm text-base-content/70">
              Upload lampiran BA Delete dalam format PDF sebelum menghapus data.
            </p>

            <fieldset className="fieldset mt-3">
              <legend className="fieldset-legend">Lampiran BA Delete (PDF) *</legend>
              <input
                ref={deletePdfRef}
                type="file"
                accept="application/pdf"
                className="file-input file-input-bordered w-full"
                onChange={e => setDeleteFile(e.target.files?.[0])}
                required
              />
              <p className="text-xs opacity-70">Maksimal 2 MB.</p>
            </fieldset>

            <div className="modal-action">
              <button type="button" className="btn" onClick={closeDeleteModal}>
                Batal
              </button>
              <button
                type="button"
                className={`btn btn-error ${deleteMutation.isPending ? 'btn-disabled' : ''}`}
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending || !deleteFile}
              >
                {deleteMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeDeleteModal}></div>
        </div>
      )}
    </div>
  );
}
