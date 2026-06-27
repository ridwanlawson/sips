'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BusinessUnit } from '../../../utils/businessUnitService';
import { fetchBusinessUnits } from '../../../utils/businessUnitService';
import type { SectionMaster } from '../../../utils/masterDataService';
import { fetchGangs, fetchSections } from '../../../utils/masterDataService';
import Image from 'next/image';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkeletonTable } from '@/app/components/skeletons';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { exportJsonToCsv } from '@/utils/exportCsv';
import { useTranslations } from 'next-intl';
import { SearchSelect, type Option } from '@/app/components/search-select';
import { EmptyState } from '@/app/components/empty-state';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { useLocale } from '@/hooks/useLocale';
import { formatPerfDate } from '@/utils/perf-formatter';

/* =========================
   T Y P E S
========================= */
type Absensi = {
  _rowKey?: string;
  // ⚡ Bolt Optimization: cached display and search values
  _displayDate?: string;
  _dateOnly?: string;
  _searchContent?: string;
  _mandorLabel?: string;
  _karyawanLabel?: string;
  id: string;
  tanggal: string;
  kemandoran: string;
  kode_karyawan_mandor?: string | null;
  kode_karyawan: string;
  time_in?: string | null; // "YYYY-MM-DD HH:mm:ss"
  time_out?: string | null; // "YYYY-MM-DD HH:mm:ss"
  location_in?: string | null;
  location_out?: string | null;
  pengancakan?: string | null;
  total_late_time?: string | null; // "HH:MM"
  go_home_early?: string | null; // "HH:MM"
  attendance_type: 'REGULAR' | 'ASSISTENSI';
  attendance: 'KJ' | 'WH' | 'WS' | 'MK' | 'ML' | 'P1' | 'KB' | 'OT';
  exception_case?: string | null;
  no_ba_exca?: string | null; // URL/filename PDF
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

type FormState = {
  id?: string;
  tanggal: string; // "YYYY-MM-DD"
  kemandoran: string;
  kode_karyawan_mandor: string;
  kode_karyawan: string;
  time_in: string; // "HH:MM"
  time_out: string; // "HH:MM"
  location_in: string;
  location_out: string;
  pengancakan: string; // dari NOANCAK
  total_late_time: string; // H:MM (readOnly)
  go_home_early: string; // H:MM (readOnly)
  attendance_type: 'REGULAR' | 'ASSISTENSI';
  attendance: 'KJ' | 'WH' | 'WS' | 'MK' | 'ML' | 'P1' | 'KB' | 'OT';
  exception_case: string; // textarea
  no_ba_exca: string;
  no_ba_exca_file?: File | undefined; // PDF upload
  fcba: string;
  section: string;
  gang: string;
  fcba_destination: string;
  section_destination: string;
  id_device: string;
  mac_address: string;
  images: File | undefined;

  mandays: string; // readOnly "0 – 1"
};

const initialForm: FormState = {
  id: undefined,
  tanggal: '',
  kemandoran: '',
  kode_karyawan_mandor: '',
  kode_karyawan: '',
  time_in: '',
  time_out: '',
  location_in: '',
  location_out: '',
  pengancakan: '',
  total_late_time: '',
  go_home_early: '',
  attendance_type: 'REGULAR',
  attendance: 'KJ',
  exception_case: '',
  no_ba_exca: '',
  no_ba_exca_file: undefined,
  fcba: '',
  section: '',
  gang: '',
  fcba_destination: '',
  section_destination: '',
  id_device: '',
  mac_address: '',
  images: undefined,
  mandays: '0',
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  kemandoran: string;
  kode_karyawan_mandor: string;
  kode_karyawan: string;
  fcba: string;
  afdeling: string;
  gang: string;
  attendance: string;
  status_attendance: string;
  attendance_type: string;
  fcba_destination: string;
  section_destination: string;
}>;

type Triplet = { fcba: string; sectionname: string; gangcode: string };

type Employee = {
  fccode: string;
  fullname?: string;
  fcba?: string;
  sectionname?: string;
  gangcode?: string;
  noancak?: string;
};

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
  fcba?: unknown;
  sectionname?: unknown;
  gangcode?: unknown;
};

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

const matchesEmployeeFcba = (
  employeeFcba: string | undefined,
  selectedFcba: string,
  lookups: { codeMap: Map<string, BusinessUnit>; nameMap: Map<string, BusinessUnit> },
  preResolved?: { code: string; name: string }
): boolean => {
  const employeeValue = (employeeFcba || '').trim();
  if (!employeeValue || !selectedFcba) return false;

  const selectedCode = preResolved?.code || resolveBusinessUnitCode(selectedFcba, lookups);
  const selectedName = preResolved?.name || resolveBusinessUnitName(selectedFcba, lookups);

  return (
    employeeValue === selectedFcba ||
    employeeValue === selectedCode ||
    employeeValue === selectedName
  );
};

/* =========================
   U T I L S
========================= */
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';
import { getTodayISO, getYesterdayISO } from '@/utils/datetime';
import { buildMapUrl } from '@/utils/mapHelper';
import { cookieStore } from '@/utils/cookieStore';
import { getFilterCriteria, getLockedFields, type UserLevel } from '@/utils/filterHelper';
import { getReadableDevice, getOrCreateDeviceIds } from '@/utils/deviceHelper';
import { extractArrayData, extractSingleData } from '@/utils/apiHelpers';

const LocationButton: React.FC<{ loc?: string | null; label?: string }> = ({ loc, label }) => {
  const t = useTranslations('Attendance');
  if (!loc) return <>-</>;
  const href = buildMapUrl(loc);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-ghost btn-xs gap-1"
      title={loc}
    >
      <span aria-hidden>📍</span> {label ?? t('gpsDefaultLabel')}
    </a>
  );
};

/* ====== Date/Time helpers ====== */
const combineToDate = (dateISO: string, hhmm: string): Date | null => {
  if (!dateISO || !hhmm) return null;
  const [hhStr, mmStr] = hhmm.split(':');
  const hh = parseInt(hhStr ?? '', 10);
  const mm = parseInt(mmStr ?? '', 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date(`${dateISO}T00:00`);
  if (Number.isNaN(+d)) return null;
  d.setHours(hh, mm, 0, 0);
  return d;
};

const combineToApiString = (dateISO: string, hhmm: string): string => `${dateISO} ${hhmm}:00`;

const hhmm = (minutes: number) => {
  const m = Math.max(0, Math.floor(minutes));
  const H = Math.floor(m / 60);
  const M = m % 60;
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`;
};

const diffMinutes = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 60000);
};

/* Text H:MM normalizer */
const normalizeHM = (input: string) => {
  const s = (input || '').trim();
  if (!s) return '';
  const m1 = s.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (m1) {
    const H = Math.max(0, parseInt(m1[1] ?? '0', 10) || 0);
    const M = Math.max(0, Math.min(59, parseInt(m1[2] ?? '0') || 0));
    return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`;
  }
  const m2 = s.match(/^(\d{1,3})$/);
  if (m2) {
    const num = parseInt(m2[1] ?? '0', 10);
    const H = Math.floor(num / 100);
    const M = num % 100;
    return `${String(H).padStart(2, '0')}:${String(Math.min(59, M)).padStart(2, '0')}`;
  }
  return s;
};

/* =========================
   M A I N
========================= */
export default function Attendance() {
  const localeTag = useLocale();
  const queryClient = useQueryClient();
  const t = useTranslations('Attendance');
  const [q, setQ] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useSearchShortcut();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      tanggal: yesterday,
      tanggal_end: today,
      kemandoran: '',
      kode_karyawan_mandor: '',
      kode_karyawan: '',
      fcba: '',
      afdeling: '',
      gang: '',
      attendance: '',
      status_attendance: '',
      attendance_type: '',
      fcba_destination: '',
      section_destination: '',
    };
  });

  // Master data / cascading
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [selFcba, setSelFcba] = useState<string>('');
  const [selSection, setSelSection] = useState<string>('');
  const [selGang, setSelGang] = useState<string>('');
  const [homeFcba, setHomeFcba] = useState<string>('');
  const [homeSection, setHomeSection] = useState<string>('');
  const [homeKemandoran, setHomeKemandoran] = useState<string>('');
  const [userFcbaCookie, setUserFcbaCookie] = useState<string>('');
  const [userAfdelingCookie, setUserAfdelingCookie] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserLevel>('OTHER');
  const [destFcba, setDestFcba] = useState<string>('');
  const [destSection, setDestSection] = useState<string>('');
  const [destSections, setDestSections] = useState<SectionMaster[]>([]);
  const [isLoadingDestSections, setIsLoadingDestSections] = useState(false);
  const [optFcba, setOptFcba] = useState<string[]>([]);

  const isKemandoranScopedUser = (level: UserLevel) => ['MDP', 'KRT', 'KRP'].includes(level);

  const getScopedFilters = useCallback(
    (baseFilters: Filters): Filters => {
      const scopedFilters: Filters = { ...baseFilters };

      const filterCriteria = getFilterCriteria(
        {
          level: userLevel,
          fcba: userFcbaCookie || homeFcba,
          afdeling: userAfdelingCookie || homeSection,
          gang: homeKemandoran,
        },
        'attendance'
      );

      // Apply the filter criteria to base filters
      if (filterCriteria.fcba) scopedFilters.fcba = filterCriteria.fcba;
      if (filterCriteria.afdeling) scopedFilters.afdeling = filterCriteria.afdeling;
      if (filterCriteria.kemandoran) scopedFilters.kemandoran = filterCriteria.kemandoran;

      if (isKemandoranScopedUser(userLevel)) {
        scopedFilters.gang = '';
      }

      return scopedFilters;
    },
    [userLevel, homeFcba, homeSection, homeKemandoran, userFcbaCookie, userAfdelingCookie]
  );

  const { isFcbaLocked, isAfdelingLocked, isKemandoranLocked } = useMemo(
    () => getLockedFields(userLevel, 'attendance'),
    [userLevel]
  );

  useEffect(() => {
    setFilters(current => {
      const next = getScopedFilters(current);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [getScopedFilters]);

  // Query for attendance list
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['attendance', filters, userLevel, homeFcba, homeSection, homeKemandoran],
    queryFn: async () => {
      const base = filters;
      let start = (base.tanggal ?? '').trim();
      let end = (base.tanggal_end ?? '').trim();

      if (start && !end) end = start;
      else if (!start && end) start = end;

      if (start && end && end < start) {
        const tmp = start;
        start = end;
        end = tmp;
      }

      const f: Filters = getScopedFilters(base);

      delete f.tanggal;
      delete f.tanggal_end;

      if (start) {
        f.tanggal = start;
      }
      if (end && end !== start) {
        f.tanggal_end = end;
      }

      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.append(k, v as string);
        }
      });

      const res = await fetch(`/api/attendance${params.toString() ? `?${params}` : ''}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 404) return [];
        if (res.status === 401) {
          await logoutAndRedirect();
          return [];
        }
        // Baca error message dari response body untuk user-friendly feedback
        let detail = `HTTP ${res.status}`;
        try {
          const errBody = await res.clone().json();
          if (errBody?.error) detail = errBody.error;
        } catch {
          /* fallback ke HTTP status */
        }
        throw new Error(detail);
      }

      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      const raw = extractArrayData<Absensi>(json);

      // ⚡ Bolt Optimization: Consolidate filtering and deduplication into a single-pass O(N) loop.
      const byId = new Map<string, Absensi>();
      for (const row of raw) {
        if (!row?.id || byId.has(row.id)) continue;

        const dateOnly = (row.tanggal || '').split(' ')[0];
        if (start && end) {
          if (!dateOnly || dateOnly < start || dateOnly > end) continue;
        }

        byId.set(row.id, {
          ...row,
          _dateOnly: dateOnly,
        });
      }

      return Array.from(byId.values());
    },
    enabled: !!homeFcba || userLevel === 'ADM', // Wait until bootstrap is done
    staleTime: 2 * 60 * 1000, // 2 menit - attendance data lebih sering berubah
    gcTime: 5 * 60 * 1000, // 5 menit cache
  });

  // show toast if query produces error so the variable is referenced
  useEffect(() => {
    if (queryError) {
      // react-query error can be string or Error
      const msg =
        typeof queryError === 'string'
          ? queryError
          : queryError instanceof Error
            ? queryError.message
            : t('toastFetchError');
      toast.error(msg);
    }
  }, [queryError, t]);

  // Mutations
  const mutation = useMutation({
    mutationFn: async ({ url, method, body }: { url: string; method: string; body: FormData }) => {
      // Add CSRF token to FormData if not already present
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
      if (csrfToken && !body.has('_csrf_token')) {
        body.append('_csrf_token', csrfToken);
      }

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
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setOpen(false);
      setForm(s => ({
        ...initialForm,
        id_device: s.id_device,
        mac_address: s.mac_address,
      }));
      setPreview('');
      if (imgRef.current) imgRef.current.value = '';
      if (pdfRef.current) pdfRef.current.value = '';
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const body = new FormData();
      // Laravel expects file uploads to come via multipart POST; use _method override
      body.append('ba_deleted', file);
      body.append('_method', 'DELETE');

      // Add CSRF token for file upload
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
      if (csrfToken) {
        body.append('_csrf_token', csrfToken);
      }

      const res = await fetch(`/api/attendance/${id}`, {
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
              : t('toastDeleteError');
        throw new Error(errorMsg);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success(t('toastDeleteSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // modal
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteFile, setDeleteFile] = useState<File | undefined>(undefined);

  // Close the modal with Escape
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

  // form
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>('');
  const imgRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const deletePdfRef = useRef<HTMLInputElement | null>(null);

  // loading ambil lokasi (in/out)
  const [locLoading, setLocLoading] = useState<'in' | 'out' | null>(null);

  const handleGetLocation = (target: 'in' | 'out') => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast.error(t('toastGeolocUnsupported'));
      return;
    }

    setLocLoading(target);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const value = `${latitude},${longitude}`;

        setForm(s =>
          target === 'in' ? { ...s, location_in: value } : { ...s, location_out: value }
        );

        setLocLoading(null);
      },
      err => {
        console.error('Geolocation error:', err);
        let message = t('toastGeolocError');
        if (err.code === 1 || err.code === window.GeolocationPositionError?.PERMISSION_DENIED) {
          message = t('toastGeolocDenied');
        } else if (
          err.code === 2 ||
          err.code === window.GeolocationPositionError?.POSITION_UNAVAILABLE
        ) {
          message = t('toastGeolocUnavailable');
        } else if (err.code === 3 || err.code === window.GeolocationPositionError?.TIMEOUT) {
          message = t('toastGeolocTimeout');
        }
        toast.error(message);
        setLocLoading(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* ===== Device IDs (auto) ===== */
  useEffect(() => {
    const { deviceId, pseudoMac } = getOrCreateDeviceIds();
    setForm(s => ({
      ...s,
      id_device: s.id_device || `${getReadableDevice()} • ${deviceId}`,
      mac_address: s.mac_address || pseudoMac,
    }));
  }, []);

  /* ===== Bootstrap cookies (synchronous only) ===== */
  useEffect(() => {
    setHomeFcba(cookieStore.getFcba());
    setHomeSection(cookieStore.getSection());
    setHomeKemandoran(cookieStore.getGang());
    setUserFcbaCookie(
      cookieStore.getCookie('user_Fcba') || cookieStore.getCookie('user_fcba') || ''
    );
    setUserAfdelingCookie(
      cookieStore.getCookie('user_Afdeling') || cookieStore.getCookie('user_afdeling') || ''
    );

    const levelRaw = cookieStore.getLevel();
    const upperLevel = levelRaw.toUpperCase();
    const normalizedLevel = upperLevel === 'ADMIN' ? 'ADM' : upperLevel;
    setUserLevel((normalizedLevel as UserLevel) || 'OTHER');

    const ckTrip = cookieStore.getCookie('opt_triplets');
    if (ckTrip) {
      try {
        const arr = JSON.parse(ckTrip) as Triplet[];
        if (Array.isArray(arr) && arr.length) setTriplets(arr);
      } catch {
        // ignore
      }
    }

    const ckOptFcba = cookieStore.getCookie('opt_fcba');
    if (ckOptFcba) {
      try {
        const arr = JSON.parse(ckOptFcba) as string[];
        if (Array.isArray(arr)) setOptFcba(arr);
      } catch {
        // ignore
      }
    }
  }, []);

  /* ===== Parallel data fetching with useQuery ===== */

  // Business units query - runs in parallel dengan caching lebih lama
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
    staleTime: 30 * 60 * 1000, // 30 menit - data master jarang berubah
    gcTime: 60 * 60 * 1000, // 1 jam cache di memori
  });

  const buLookups = useMemo(() => getBusinessUnitLookups(businessUnits), [businessUnits]);

  const selectedFcbaCodeForMaster = useMemo(
    () => resolveBusinessUnitCode(selFcba || homeFcba || '', buLookups),
    [selFcba, homeFcba, buLookups]
  );

  const { data: masterSections = [], isLoading: isLoadingSections } = useQuery({
    queryKey: ['masterSections'],
    queryFn: async () => {
      try {
        const rows = await fetchSections();
        localStorage.setItem('master_sections', JSON.stringify(rows));
        return rows;
      } catch (err) {
        console.warn('failed to fetch master sections:', err);
        const cached = localStorage.getItem('master_sections');
        if (cached) {
          try {
            return JSON.parse(cached) as SectionMaster[];
          } catch {
            return [];
          }
        }
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: masterGangs = [], isLoading: isLoadingGangs } = useQuery({
    queryKey: ['masterGangs', selectedFcbaCodeForMaster, selSection],
    queryFn: async () => {
      if (!selectedFcbaCodeForMaster || !selSection) return [];
      return fetchGangs({
        fcba: selectedFcbaCodeForMaster,
        afdeling: selSection,
      });
    },
    enabled: !!selectedFcbaCodeForMaster && !!selSection,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Employees query - runs in parallel, depends on cookies only
  const { data: employees = [], isLoading: isLoadingSmp } = useQuery({
    queryKey: ['employees', userLevel, homeFcba, homeSection],
    queryFn: async () => {
      let apiUrl = '/api/karyawans';
      const params = new URLSearchParams();

      if (userLevel === 'AST' || userLevel === 'KRA') {
        if (homeFcba) params.append('fcba', homeFcba);
        if (homeSection) params.append('sectionname', homeSection);
      } else if (userLevel === 'ADM' || userLevel === 'MGR' || userLevel === 'KSI') {
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
      const mapSmp = new Map<string, Employee>();
      for (const it of rowsRaw) {
        const fccode = String(it.fccode ?? '').trim();
        if (!fccode) continue;
        if (!mapSmp.has(fccode)) {
          const noancakValue =
            (it as { noancak?: unknown }).noancak ?? (it as { NOANCAK?: unknown }).NOANCAK;
          const noancak = typeof noancakValue === 'string' ? noancakValue.trim() : undefined;

          mapSmp.set(fccode, {
            fccode,
            fullname: typeof it.fcname === 'string' ? it.fcname : undefined,
            fcba: String(it.fcba ?? '').trim(),
            sectionname: String(it.sectionname ?? '').trim(),
            gangcode: String(it.gangcode ?? '').trim(),
            noancak,
          });
        }
      }
      return Array.from(mapSmp.values());
    },
    enabled: !!homeFcba || userLevel === 'ADM',
    staleTime: 15 * 60 * 1000, // 15 menit - data karyawan jarang berubah
    gcTime: 30 * 60 * 1000, // 30 menit cache
  });

  /* ===== Attendance-type: reset cascade dari FCBA akun ===== */
  useEffect(() => {
    if (isEditing) return;

    if (userLevel === 'ADM') {
      setSelFcba(prev => prev || homeFcba || '');
      setForm(s => ({ ...s, fcba: s.fcba || homeFcba || '' }));
    } else {
      setSelFcba(homeFcba || '');
      setForm(s => ({ ...s, fcba: homeFcba || '' }));
    }

    if (userLevel === 'AST' || userLevel === 'KRA') {
      setSelSection(homeSection || '');
      setForm(s => ({ ...s, section: homeSection || '' }));
    } else if (userLevel === 'KRT') {
      // KRT: fcba + afdeling + gang locked
      setSelSection(homeSection || '');
      setForm(s => ({ ...s, section: homeSection || '' }));
      setSelGang(homeKemandoran || '');
    } else if (userLevel === 'MD1') {
      // MD1: fcba + afdeling locked
      setSelSection(homeSection || '');
      setForm(s => ({ ...s, section: homeSection || '' }));
    } else {
      setSelSection('');
      setForm(s => ({ ...s, section: '' }));
    }

    if (userLevel !== 'KRT') {
      setSelGang('');
    }
    setForm(s => ({ ...s, kode_karyawan: '' }));
  }, [form.attendance_type, homeFcba, homeSection, homeKemandoran, userLevel, isEditing]);

  /* ===== Options ===== */
  const fcbaOptions = useMemo(() => {
    // prefer list from businessUnits API if available
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

  // convert homeFcba (which might be fcname or fccode) to actual fccode for proper filtering
  const homeFcbaCode = useMemo(() => {
    return resolveBusinessUnitCode(homeFcba, buLookups);
  }, [homeFcba, buLookups]);

  const currentFcbaForForm = useMemo(() => {
    return userLevel === 'ADM' ? selFcba || homeFcbaCode || '' : homeFcbaCode || selFcba || '';
  }, [userLevel, selFcba, homeFcbaCode]);

  const sectionOptions: Option[] = useMemo(() => {
    if (!selFcba) return [];
    const fcbaCode = resolveBusinessUnitCode(selFcba, buLookups);
    const sectionsFromMaster = masterSections
      .filter(section => section.fcba === fcbaCode)
      .filter(section => section.fccode !== destSection)
      .map(section => ({
        value: section.fccode,
        label:
          section.fcname && section.fcname !== section.fccode
            ? `${section.fccode} - ${section.fcname}`
            : section.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (sectionsFromMaster.length) return sectionsFromMaster;

    // Match by fcba field in triplets (triplets use fcba name, not fccode)
    // Need to handle both cases: selFcba being fccode or fcba name
    return Array.from(
      new Set(
        triplets
          .filter(t => {
            // Direct match with fcba field
            if (t.fcba === selFcba) return true;
            // Also try to match by extracting fcba from business units if selFcba is fccode
            const buMatch = buLookups.codeMap.get(selFcba);
            if (buMatch && t.fcba === buMatch.fcname) return true;
            return false;
          })
          .map(t => t.sectionname)
          .filter(section => section !== destSection)
          .filter(Boolean)
      )
    )
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [triplets, selFcba, buLookups, masterSections, destSection]);

  const gangOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection) return [];
    const gangsFromMaster = masterGangs
      .map(gang => ({
        value: gang.fccode,
        label:
          gang.fcname && gang.fcname !== gang.fccode
            ? `${gang.fccode} - ${gang.fcname}`
            : gang.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (gangsFromMaster.length) return gangsFromMaster;

    // Get the actual fcba name for matching triplets
    let fcbaName = selFcba;
    const buMatch = buLookups.codeMap.get(selFcba);
    if (buMatch) fcbaName = buMatch.fcname || selFcba;

    return Array.from(
      new Set(
        triplets
          .filter(t => t.fcba === fcbaName && t.sectionname === selSection)
          .map(t => t.gangcode)
          .filter(Boolean)
      )
    )
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [triplets, selFcba, selSection, buLookups, masterGangs]);

  const currentFcbaPreresolved = useMemo(() => {
    const fcba = currentFcbaForForm || form.fcba || selFcba;
    if (!fcba) return undefined;
    return {
      value: fcba,
      code: resolveBusinessUnitCode(fcba, buLookups),
      name: resolveBusinessUnitName(fcba, buLookups),
    };
  }, [currentFcbaForForm, form.fcba, selFcba, buLookups]);

  const pengancakanOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang || !currentFcbaPreresolved) return [];

    const pool = employees.filter(
      e =>
        matchesEmployeeFcba(e.fcba, currentFcbaPreresolved.value, buLookups, {
          code: currentFcbaPreresolved.code,
          name: currentFcbaPreresolved.name,
        }) &&
        (e.sectionname || '') === selSection &&
        (e.gangcode || '') === selGang
    );
    const set = new Set<string>();
    for (const e of pool) {
      const raw = (e.noancak || '').trim();
      if (raw) set.add(raw);
    }
    return Array.from(set)
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [employees, selFcba, selSection, selGang, currentFcbaPreresolved, buLookups]);

  const employeeOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang || !currentFcbaPreresolved) return [];

    const pool = employees.filter(
      e =>
        matchesEmployeeFcba(e.fcba, currentFcbaPreresolved.value, buLookups, {
          code: currentFcbaPreresolved.code,
          name: currentFcbaPreresolved.name,
        }) &&
        (e.sectionname || '') === selSection &&
        (e.gangcode || '') === selGang
    );
    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || '').trim();
      if (!value) continue;
      const label = e.fullname ? `${e.fullname}` : value;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [employees, selFcba, selSection, selGang, currentFcbaPreresolved, buLookups]);

  // destination select options should include every FCBA, including the user's current FCBA.
  const destOptions = useMemo(() => {
    if (businessUnits && businessUnits.length > 0) {
      return businessUnits
        .map(bu => ({
          value: bu.fccode,
          label: bu.fcname ? `${bu.fccode} - ${bu.fcname}` : bu.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    if (optFcba && optFcba.length > 0) {
      return optFcba
        .map(fcba => ({
          value: fcba,
          label: fcba,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return fcbaOptions;
  }, [optFcba, fcbaOptions, businessUnits]);

  const destSectionOptions: Option[] = useMemo(() => {
    if (!destFcba) return [];

    return destSections
      .filter(section => section.fccode !== selSection)
      .map(section => ({
        value: section.fccode,
        label:
          section.fcname && section.fcname !== section.fccode
            ? `${section.fccode} - ${section.fcname}`
            : section.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [destFcba, destSections, selSection]);

  const mandorOptions: Option[] = useMemo(() => {
    const fcba = currentFcbaForForm || form.fcba || homeFcbaCode || homeFcba || '';
    const section = selSection || form.section || homeSection || '';

    // Reuse preresolved lookups if possible
    const isFcbaCurrent =
      currentFcbaPreresolved &&
      fcba === (currentFcbaPreresolved.value || currentFcbaForForm || form.fcba || selFcba);

    const preresolved = isFcbaCurrent
      ? { code: currentFcbaPreresolved!.code, name: currentFcbaPreresolved!.name }
      : {
          code: resolveBusinessUnitCode(fcba, buLookups),
          name: resolveBusinessUnitName(fcba, buLookups),
        };

    const pool = employees.filter(
      e =>
        matchesEmployeeFcba(e.fcba, fcba, buLookups, preresolved) &&
        (e.sectionname || '') === section
    );

    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || '').trim();
      if (!value) continue;
      const gangLabel = (e.gangcode || '').trim();
      const fullname = e.fullname ? ` - ${e.fullname}` : '';
      const label = gangLabel ? `${gangLabel} • ${value}${fullname}` : `${value}${fullname}`;
      const name = (e.fullname || '').trim();
      if (!map.has(value)) map.set(value, gangLabel ? `${gangLabel} - ${name || value}` : label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [
    employees,
    currentFcbaForForm,
    form.fcba,
    homeFcbaCode,
    homeFcba,
    homeSection,
    selSection,
    form.section,
    buLookups,
    currentFcbaPreresolved,
    selFcba,
  ]);

  /**
   * ⚡ Bolt Optimization: Use a Map for O(1) employee lookups by code.
   * This replaces multiple O(N) .find() calls and consolidates the previous empLabelMap.
   */
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const e of employees) {
      const code = (e.fccode || '').trim();
      if (code && !map.has(code)) map.set(code, e);
    }
    return map;
  }, [employees]);


  const selectedMandorGang = useMemo(() => {
    const mandor = employeeMap.get(form.kode_karyawan_mandor);
    return mandor?.gangcode || form.kemandoran || '';
  }, [employeeMap, form.kode_karyawan_mandor, form.kemandoran]);

  const onChangeMandor = (fccode: string) => {
    const mandor = employeeMap.get(fccode);
    setForm(s => ({
      ...s,
      kode_karyawan_mandor: fccode,
      kemandoran: mandor?.gangcode || '',
    }));
  };

  const onChangeSection = (v: string) => {
    setSelSection(v);
    setSelGang('');
    if (destSection === v) setDestSection('');
    setForm(s => ({ ...s, section: v, kode_karyawan: '', pengancakan: '' }));
  };

  const onChangeGang = (v: string) => {
    setSelGang(v);
    setForm(s => ({ ...s, gang: v, kode_karyawan: '', pengancakan: '' }));
  };

  const onChangeEmployee = (fccode: string) => {
    const emp = employeeMap.get(fccode);
    setForm(s => ({
      ...s,
      kode_karyawan: fccode,
      pengancakan: emp?.noancak ?? s.pengancakan,
    }));
  };

  const onChangeDestFcba = (v: string) => {
    setDestFcba(v);
    setForm(s => ({ ...s, fcba_destination: v }));
    if (!v) {
      setDestSections([]);
      setDestSection('');
    }
  };
  const onChangeDestSection = (v: string) => {
    if (v && v === selSection) {
      toast.error(t('toastSectionDestSame'));
      return;
    }
    setDestSection(v);
    setForm(s => ({ ...s, section_destination: v }));
  };

  // Fetch destination sections dari API saat FCBA destination berubah (hanya jika ada nilai)
  useEffect(() => {
    if (!destFcba) return;

    const destCode = resolveBusinessUnitCode(destFcba, buLookups);

    setIsLoadingDestSections(true);
    fetchSections({ fcba: destCode })
      .then(sections => {
        setDestSections(sections);

        // Auto-populate section destination
        const filtered = sections.filter(s => s.fccode !== selSection);
        if (filtered.length > 0) {
          const firstSection = filtered[0].fccode;
          setDestSection(firstSection);
          setForm(s => ({ ...s, section_destination: firstSection }));
        } else {
          setDestSection('');
        }
      })
      .catch(() => {
        setDestSections([]);
        setDestSection('');
      })
      .finally(() => {
        setIsLoadingDestSections(false);
      });
  }, [destFcba, buLookups, selSection]);

  /* ===== Defaults for add mode ===== */
  const setDefaultsForAdd = () => {
    const today = getTodayISO();
    const { deviceId, pseudoMac } = getOrCreateDeviceIds();

    setForm({
      ...initialForm,
      tanggal: today,
      time_in: '06:00',
      time_out: '14:00',
      id_device: `${getReadableDevice()} • ${deviceId}`,
      mac_address: pseudoMac,
      attendance_type: 'REGULAR',
      mandays: '1',
      fcba: userLevel === 'ADM' || userLevel === 'KSI' ? homeFcbaCode || '' : homeFcbaCode || '',
      section: userLevel === 'AST' || userLevel === 'KRA' ? homeSection || '' : '',
    });
  };

  const onAddClick = () => {
    setDefaultsForAdd();
    setIsEditing(false);
    setPreview('');
    setDestFcba('');
    setDestSection('');
    setSelFcba(
      userLevel === 'ADM' || userLevel === 'KSI' ? homeFcbaCode || '' : homeFcbaCode || ''
    );
    setSelSection(userLevel === 'AST' || userLevel === 'KRA' ? homeSection || '' : '');
    setSelGang('');
    setOpen(true);
    setDetailLoading(false);
    if (imgRef.current) imgRef.current.value = '';
    if (pdfRef.current) pdfRef.current.value = '';

    setTimeout(() => {
      handleGetLocation('in');
      handleGetLocation('out');
    }, 0);
  };

  /* ===== AUTO COMPUTE LATE / EARLY / MANDAYS ===== */
  const recomputeComputedFields = useCallback((s: FormState): FormState => {
    const dIn = combineToDate(s.tanggal, s.time_in);
    const dOut = combineToDate(s.tanggal, s.time_out);

    const baseIn = s.tanggal ? new Date(`${s.tanggal}T06:00`) : null;
    const baseOut = s.tanggal ? new Date(`${s.tanggal}T14:00`) : null;

    let totalLate = s.total_late_time;
    if (dIn && baseIn) {
      totalLate = dIn.getTime() > baseIn.getTime() ? hhmm(diffMinutes(baseIn, dIn)) : '00:00';
    }

    let goEarly = s.go_home_early;
    if (dOut && baseOut) {
      goEarly = dOut.getTime() < baseOut.getTime() ? hhmm(diffMinutes(dOut, baseOut)) : '00:00';
    }

    let effectiveMin = 0;
    if (dIn && dOut && baseIn && baseOut) {
      const effStart = dIn.getTime() > baseIn.getTime() ? dIn : (baseIn as Date);
      const effEnd = dOut.getTime() < baseOut.getTime() ? dOut : (baseOut as Date);
      effectiveMin = Math.max(0, diffMinutes(effStart, effEnd));
    }

    const fullHK =
      !!dIn &&
      !!dOut &&
      !!baseIn &&
      !!baseOut &&
      dIn.getTime() <= baseIn.getTime() &&
      dOut.getTime() >= baseOut.getTime();

    let mandays = '0';
    if (s.attendance === 'KJ' || s.attendance === 'WH' || s.attendance === 'WS') {
      mandays = fullHK ? '1' : (effectiveMin / 480).toFixed(4);
    } else {
      mandays = '0';
    }

    return {
      ...s,
      total_late_time: totalLate,
      go_home_early: goEarly,
      mandays,
    };
  }, []);

  useEffect(() => {
    setForm(s => recomputeComputedFields(s));
  }, [form.tanggal, form.time_in, form.time_out, form.attendance, recomputeComputedFields]);

  /* ===== SUBMIT ===== */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mutation.isPending) return;

    try {
      if (!form.tanggal) throw new Error(t('valDateRequired'));
      if (!form.time_in) throw new Error(t('valTimeInRequired'));
      if (!form.location_in) throw new Error(t('valLocInRequired'));
      if (!form.kode_karyawan) throw new Error(t('valEmployeeRequired'));

      let finalFcba = currentFcbaForForm || form.fcba || '';
      if (userLevel !== 'ADM' && userLevel !== 'KSI') {
        finalFcba = homeFcba || finalFcba;
      }
      if (!finalFcba) throw new Error(t('valFcbaNotFound'));
      const finalSection =
        (userLevel === 'AST' ||
          userLevel === 'KRA' ||
          userLevel === 'MD1' ||
          userLevel === 'KRT') &&
        homeSection
          ? homeSection
          : form.section || '';

      const trimmedException = form.exception_case.trim();
      const hasException = trimmedException.length > 0;

      const hasUploadedPdf = form.no_ba_exca_file instanceof File;
      const hasExistingPdf = !!form.no_ba_exca;

      const exceptionRequired = !isEditing;
      const baExcaRequired = !isEditing;

      if (exceptionRequired && !hasException) {
        throw new Error(t('valExceptionRequired'));
      }

      if (baExcaRequired && !hasUploadedPdf && !hasExistingPdf) {
        throw new Error(t('valBaExcaRequired')); // Fixed: was 'No BA ExlA' changed to 'No BA Exca'
      }

      const timeInApi = combineToApiString(form.tanggal, form.time_in);
      const timeOutApi = form.time_out ? combineToApiString(form.tanggal, form.time_out) : '';

      const fd = new FormData();
      fd.append('tanggal', form.tanggal);
      fd.append('kode_karyawan', form.kode_karyawan);
      fd.append('attendance', form.attendance);
      fd.append('attendance_type', form.attendance_type);
      fd.append('fcba', finalFcba);
      fd.append('time_in', timeInApi);
      if (form.time_out) fd.append('time_out', timeOutApi);
      fd.append('location_in', form.location_in);
      if (form.location_out) fd.append('location_out', form.location_out);
      if (form.pengancakan) fd.append('pengancakan', form.pengancakan);
      if (form.total_late_time) fd.append('total_late_time', normalizeHM(form.total_late_time));
      if (form.go_home_early) fd.append('go_home_early', normalizeHM(form.go_home_early));
      if (trimmedException) fd.append('exception_case', trimmedException);
      if (finalSection) fd.append('section', finalSection);
      if (form.gang) fd.append('gang', form.gang);
      if (form.kemandoran) fd.append('kemandoran', form.kemandoran);

      if (form.mandays) fd.append('mandays', form.mandays);

      const { deviceId, pseudoMac } = getOrCreateDeviceIds();
      fd.append('id_device', form.id_device || `${getReadableDevice()} • ${deviceId}`);
      fd.append('mac_address', form.mac_address || pseudoMac);

      if (form.attendance_type === 'ASSISTENSI') {
        if (!destFcba) throw new Error(t('valFcbaDestRequired'));
        if (!destSection) throw new Error(t('valSectionDestRequired'));
        if (finalSection && destSection === finalSection) {
          throw new Error(t('valSectionDestConflict'));
        }

        // Validate that the destination FCBA exists in opt_fcba or business units
        const destExistsInOptFcba = optFcba.length > 0 && optFcba.includes(destFcba);
        const destExistsInBu =
          Array.isArray(businessUnits) && businessUnits.some(bu => bu.fccode === destFcba);
        if (!destExistsInOptFcba && !destExistsInBu) {
          throw new Error(t('valFcbaDestInvalid'));
        }

        fd.append('fcba_destination', destFcba);
        fd.append('section_destination', destSection);
      }

      if (form.images instanceof File) fd.append('images', form.images);
      if (form.no_ba_exca_file instanceof File) {
        fd.append('no_ba_exca', form.no_ba_exca_file);
      } else if (isEditing && form.no_ba_exca) {
        fd.append('no_ba_exca', form.no_ba_exca);
      }

      if (form.kode_karyawan_mandor) fd.append('kode_karyawan_mandor', form.kode_karyawan_mandor);

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing && form.id ? `/api/attendance/${form.id}` : `/api/attendance`;

      mutation.mutate(
        { url, method, body: fd },
        {
          onSuccess: () => {
            toast.success(
              isEditing ? t('toastSaveSuccess') : t('toastAddSuccess')
            );
          },
        }
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : t('toastSaveError');
      toast.error(message);
    }
  };

  /* ===== DELETE ===== */
  // wrap in useCallback so memoized columns don't re-create on every render
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
      toast.error(t('toastPdfRequired'));
      return;
    }
    if (deleteFile.type !== 'application/pdf') {
      toast.error(t('toastPdfFormat'));
      return;
    }
    if (deleteFile.size > 2 * 1024 * 1024) {
      toast.error(t('toastPdfSize'));
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

  /* ===== DETAIL ===== */
  const handleDetail = useCallback(
    async (id: string) => {
      setIsEditing(true);
      setDetailLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/attendance/${id}`, {
          credentials: 'include',
        });
        const json: unknown = await res.json();
        const d = extractSingleData<Absensi>(json);
        if (!res.ok || !d) throw new Error('Gagal ambil data');

        const toHM = (dt?: string | null) =>
          dt && dt.includes(' ')
            ? (dt.split(' ')[1] ?? '').slice(0, 5)
            : dt
              ? dt.slice(11, 16)
              : '';

        const existingException = (d.exception_case || '').trim();
        const existingBaExca = (d.no_ba_exca || '').trim();

        const filled: FormState = {
          id: d.id,
          tanggal: (d.tanggal || '').split(' ')[0],
          kemandoran: d.kemandoran || '',
          kode_karyawan_mandor: d.kode_karyawan_mandor || '',
          kode_karyawan: d.kode_karyawan || '',
          time_in: toHM(d.time_in) || '06:00',
          time_out: toHM(d.time_out) || '14:00',
          location_in: d.location_in || '',
          location_out: d.location_out || '',
          pengancakan: d.pengancakan || '',
          total_late_time: d.total_late_time || '',
          go_home_early: d.go_home_early || '',
          attendance_type: d.attendance_type || 'REGULAR',
          attendance: d.attendance || 'MK',
          exception_case: existingException,
          no_ba_exca: existingBaExca,
          no_ba_exca_file: undefined,
          fcba: d.fcba || '',
          section: d.section || '',
          gang: d.gang || '',
          fcba_destination: d.fcba_destination || '',
          section_destination: d.section_destination || '',
          id_device: d.id_device || `${getReadableDevice()} • ${getOrCreateDeviceIds().deviceId}`,
          mac_address: d.mac_address || getOrCreateDeviceIds().pseudoMac,
          images: undefined,
          mandays: d.mandays != null ? String(d.mandays) : '0',
        };
        setForm(() => filled);

        setSelFcba(d.fcba || homeFcbaCode || '');
        setSelSection(d.section || homeSection || '');
        setSelGang(d.gang || '');

        setDestFcba(d.fcba_destination || '');
        setDestSection(d.section_destination || '');
        setPreview(d.images || '');
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('toastFetchDetailError');
        toast.error(msg);
      } finally {
        setDetailLoading(false);
      }
    },
    [homeFcbaCode, homeSection, t]
  );

  /* ===== PREVIEW FOTO ===== */
  const onChangeImage = (f?: File) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    if (!f) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(f);
    setPreview(url);
  };
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ===== Columns ===== */
  const sortByLabel = (a: Absensi, b: Absensi, getLabel: (r: Absensi) => string) =>
    getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base' });

  const columns: TableColumn<Absensi>[] = useMemo(
    () => [
      {
        name: <span title={t('colAksiTooltip')}>{t('colAksi')}</span>,
        width: '120px',
        cell: (row: Absensi) => {
          const status = (row.status_attendance || '').toLowerCase();
          const isPlanned = status === 'planned';
          const canEditRole = userLevel === 'ADM' || userLevel === 'KSI';
          const canEdit = canEditRole && isPlanned;

          const canDelete =
            (userLevel === 'ADM' || userLevel === 'KSI') && status !== 'approved' && status !== '';

          return (
            <div className="space-x-1 whitespace-nowrap overflow-visible">
              {canEditRole && (
                <button
                  className={`btn btn-xs ${canEdit ? 'btn-outline' : 'btn-disabled'}`}
                  onClick={() => canEdit && handleDetail(row.id)}
                  disabled={!canEdit}
                  title={canEdit ? t('edit') : t('editDisabledTooltip')}
                >
                  {t('edit')}
                </button>
              )}

              {canDelete && (
                <button
                  className="btn btn-xs btn-error"
                  onClick={() => handleDelete(row.id)}
                  title={t('deleteDisabledTooltip')}
                >
                  {t('delete')}
                </button>
              )}
            </div>
          );
        },
        ignoreRowClick: true,
      },
      {
        name: <span title={t('colStatusTooltip')}>{t('colStatus')}</span>,
        selector: r => r.status_attendance ?? '-',
        sortable: true,
        width: '120px',
        cell: r => (
          <span
            className={`badge ${
              (r.status_attendance || '').toLowerCase() === 'planned'
                ? 'badge-warning'
                : (r.status_attendance || '').toLowerCase() === 'approved'
                  ? 'badge-success'
                  : 'badge-ghost'
            }`}
          >
            {r.status_attendance ?? '-'}
          </span>
        ),
      },
      {
        name: <span title={t('colNoTooltip')}>{t('colNo')}</span>,
        width: '56px',
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: <span title={t('colTanggalTooltip')}>{t('colTanggal')}</span>,
        selector: r => r._dateOnly ?? '',
        sortable: true,
        width: '100px',
        cell: r => <span title={r._dateOnly}>{r._displayDate}</span>,
      },
      {
        name: <span title={t('colKemandoran')}>{t('colKemandoran')}</span>,
        selector: r => r.kemandoran ?? '-',
        sortable: true,
        width: '120px',
      },
      {
        name: <span title={t('colKaryawanTooltip')}>{t('colKaryawan')}</span>,
        style: { flexGrow: 2 as number, minWidth: '220px' },
        width: '240px',
        sortable: true,
        sortFunction: (a, b) => sortByLabel(a, b, r => r._karyawanLabel || ''),
        cell: r => {
          const label = r._karyawanLabel || '';
          const [fccode, fullname] = label.includes(' - ') ? label.split(' - ', 2) : [label, ''];
          return (
            <div className="min-w-0">
              <div className="font-semibold truncate" title={fullname || '-'}>
                {fullname || '-'}
              </div>
              <div className="text-xs opacity-70 truncate" title={fccode}>
                {fccode}
              </div>
            </div>
          );
        },
      },
      {
        name: <span title={t('colMandorTooltip')}>{t('colMandor')}</span>,
        width: '200px',
        style: { flexGrow: 1.5 as number, minWidth: '220px' },
        sortable: true,
        sortFunction: (a, b) => sortByLabel(a, b, r => r._mandorLabel || ''),
        cell: r => {
          const label = r._mandorLabel || '';
          if (!label) return <>-</>;
          const [fccode, fullname] = label.includes(' - ') ? label.split(' - ', 2) : [label, ''];
          return (
            <div className="min-w-0">
              <div className="font-medium truncate" title={fullname || '-'}>
                {fullname || '-'}
              </div>
              <div className="text-xs opacity-70 truncate" title={fccode}>
                {fccode}
              </div>
            </div>
          );
        },
      },
      {
        name: <span title={t('colFcbaTooltip')}>{t('colFcba')}</span>,
        selector: r => r.fcba ?? '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colSectionTooltip')}>{t('colSection')}</span>,
        selector: r => r.section || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span>{t('colGang')}</span>,
        selector: r => r.gang || '-',
        sortable: true,
        width: '90px',
      },
      {
        name: <span title={t('colTypeTooltip')}>{t('colType')}</span>,
        selector: r => r.attendance_type,
        sortable: true,
        width: '130px',
        cell: r => <span className="badge badge-outline">{r.attendance_type}</span>,
      },
      {
        name: <span title={t('colAttdTooltip')}>{t('colAttd')}</span>,
        selector: r => r.attendance,
        sortable: true,
        width: '80px',
      },
      {
        name: <span title={t('colMasukTooltip')}>{t('colMasuk')}</span>,
        selector: r => (r.time_in ? r.time_in.split(' ')[1]?.slice(0, 5) || r.time_in : '-'),
        sortable: true,
        width: '110px',
      },
      {
        name: <span title={t('colPulangTooltip')}>{t('colPulang')}</span>,
        selector: r => (r.time_out ? r.time_out.split(' ')[1]?.slice(0, 5) || r.time_out : '-'),
        sortable: true,
        width: '110px',
      },
      {
        name: <span title={t('colLateTooltip')}>{t('colLate')}</span>,
        selector: r => r.total_late_time || '-',
        sortable: true,
        width: '90px',
      },
      {
        name: <span title={t('colHomeEarlyTooltip')}>{t('colHomeEarly')}</span>,
        selector: r => r.go_home_early || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colPengancakanTooltip')}>{t('colPengancakan')}</span>,
        selector: r => r.pengancakan || '-',
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: '145px' },
      },
      {
        name: <span title={t('colHkTooltip')}>{t('colHk')}</span>,
        selector: r => (r.mandays != null ? String(r.mandays) : '-'),
        sortable: true,
        width: '90px',
      },
      {
        name: <span title={t('colFcbaDestTooltip')}>{t('colFcbaDest')}</span>,
        selector: r => r.fcba_destination || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title={t('colSectionDestTooltip')}>{t('colSectionDest')}</span>,
        selector: r => r.section_destination || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title={t('colLocInTooltip')}>{t('colLocIn')}</span>,
        style: { flexGrow: 1.2 as number, minWidth: '140px' },
        sortable: false,
        cell: r => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_in} />
          </div>
        ),
      },
      {
        name: <span title={t('colLocOutTooltip')}>{t('colLocOut')}</span>,
        style: { flexGrow: 1.2 as number, minWidth: '140px' },
        sortable: false,
        cell: r => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_out} />
          </div>
        ),
      },
      {
        name: <span title={t('colExcTooltip')}>{t('colExc')}</span>,
        selector: r => r.exception_case || '-',
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: '160px' },
      },
      {
        name: <span title={t('colBaExcaTooltip')}>{t('colBaExca')}</span>,
        selector: r => r.no_ba_exca || '-',
        sortable: true,
        width: '120px',
        cell: r =>
          r.no_ba_exca ? (
            <a
              href={r.no_ba_exca}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
              title={t('openPdfBaExca')}
            >
              PDF
            </a>
          ) : (
            '-'
          ),
      },
      {
        name: <span title={t('colDeviceTooltip')}>{t('colDevice')}</span>,
        selector: r => r.id_device || '-',
        sortable: true,
        width: '180px',
      },
      {
        name: <span title={t('colMacTooltip')}>{t('colMac')}</span>,
        selector: r => r.mac_address || '-',
        sortable: true,
        width: '160px',
      },
      {
        name: <span title={t('colFotoTooltip')}>{t('colFoto')}</span>,
        width: '90px',
        cell: (r: Absensi) =>
          r.images ? (
            <a
              href={getProxiedImageUrl(r.images)}
              target="_blank"
              rel="noopener noreferrer"
              title={t('openPhoto')}
            >
              {/*
                Changed: use container with fixed size and Image fill to avoid aspect ratio warnings.
                - Container is 40x40 with rounded corners and ring
                - Image fills container with object-cover for cropping
                - Maintains aspect ratio by cropping instead of distorting
              */}
              <div className="relative w-10 h-10 rounded-lg ring-1 ring-base-300 bg-base-200 overflow-hidden">
                <Image
                  src={getProxiedImageUrl(r.images)}
                  alt="foto"
                  fill
                  className="object-cover"
                  loading="lazy"
                  onError={e => {
                    // fallback to placeholder on error
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
    [handleDetail, handleDelete, userLevel, t]
  );

  /* ===== EXPORT EXCEL ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error(t('toastNoExportData'));
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      [t('exportColNo')]: idx + 1,
      [t('exportColTanggal')]: (r.tanggal || '').split(' ')[0],
      [t('exportColKemandoran')]: r.kemandoran || '-',
      [t('exportColKode')]: r.kode_karyawan || '-',
      [t('exportColNama')]: r.namakaryawan || '-',
      [t('exportColMandor')]: r.kode_karyawan_mandor || '-',
      [t('exportColFcba')]: r.fcba || '-',
      [t('exportColSection')]: r.section || '-',
      [t('exportColGang')]: r.gang || '-',
      [t('exportColType')]: r.attendance_type || '-',
      [t('exportColAttendance')]: r.attendance || '-',
      [t('exportColMasuk')]: r.time_in ? r.time_in.split(' ')[1]?.slice(0, 5) || r.time_in : '-',
      [t('exportColPulang')]: r.time_out ? r.time_out.split(' ')[1]?.slice(0, 5) || r.time_out : '-',
      [t('exportColLate')]: r.total_late_time || '-',
      [t('exportColHomeEarly')]: r.go_home_early || '-',
      [t('exportColHk')]: r.mandays != null ? String(r.mandays) : '-',
      [t('exportColStatus')]: r.status_attendance || '-',
    }));

    exportJsonToCsv(dataToExport, `Attendance_${filters.tanggal}_${filters.tanggal_end}.csv`);
  };

  /**
   * ⚡ Bolt Optimization:
   * 1. Single-pass enrichment to add display labels and search content.
   * 2. Uses formatPerfDate with cached formatters (~50x faster).
   * 3. Moves expensive Map lookups out of the render path.
   */
  const enrichedItems = useMemo(() => {
    const seen = new Set<string>();
    return items.map((it, idx) => {
      const displayDate = it._dateOnly ? formatPerfDate(it._dateOnly, localeTag) : '-';

      const mandorCode = (it.kode_karyawan_mandor || '').trim();
      const mandor = mandorCode ? employeeMap.get(mandorCode) : null;
      const mandorLabel = mandor?.fullname ? `${mandorCode} - ${mandor.fullname}` : mandorCode;

      const karyawanCode = (it.kode_karyawan || '').trim();
      const karyawanLabel = it.namakaryawan ? `${karyawanCode} - ${it.namakaryawan}` : karyawanCode;

      const searchContent = [
        it.kemandoran,
        it.namakaryawan,
        karyawanCode,
        mandorCode,
        mandorLabel,
        it.fcba,
        it.fcba_destination,
        it.section_destination,
        it.section,
        it.gang,
        it.attendance_type,
        it.attendance,
        it.no_ba_exca,
        it.id_device,
        it.mac_address,
        it.location_in,
        it.location_out,
        it.pengancakan,
        it.mandays,
        it._dateOnly,
        displayDate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const candidate = [it.id || '', karyawanCode, it._dateOnly || '', String(idx)].join('|');
      let key = candidate;
      while (seen.has(key)) key = `${key}_`;
      seen.add(key);

      return {
        ...it,
        _rowKey: key,
        _displayDate: displayDate,
        _mandorLabel: mandorLabel,
        _karyawanLabel: karyawanLabel,
        _searchContent: searchContent,
      };
    });
  }, [items, employeeMap, localeTag]);

  /* ===== Quick search lokal ===== */
  const filtered = useMemo(() => {
    if (!q.trim()) return enrichedItems;
    const s = q.toLowerCase();
    // ⚡ Bolt Optimization: Use pre-calculated search content for O(N) string check
    return enrichedItems.filter(it => it._searchContent?.includes(s));
  }, [q, enrichedItems]);

  const disableUnlessAllowed = (allowed: boolean) => (isEditing ? !allowed : false);

  const canAddOrEdit = userLevel === 'ADM' || userLevel === 'KSI';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start animate-slideUp">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title={t('pageTitleTooltip')}
          >
            {t('pageTitle')}
          </h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters(s => !s)}
              title={t('filterToggleTooltip')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              {showFilters ? t('hideFilters') : t('showFilters')}
            </button>
            <button
              className={`btn btn-sm ${loading ? 'btn-disabled' : ''}`}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}
              disabled={loading}
              title={t('refreshTooltip')}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  {t('loading')}
                </>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> {t('refresh')}</>
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExport}
              title={t('exportTooltip')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t('export')}
            </button>
            {canAddOrEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onAddClick}
                title={t('addAttendanceTooltip')}
              >
                {t('addAttendance')}
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-3 flex justify-end animate-slideUp [animation-delay:100ms]">
          <div className="relative w-full md:w-96 group">
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
              ref={searchInputRef}
              className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              placeholder={t('searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label={t('quickSearch')}
              title={t('quickSearch')}
            />
            {!isSearchFocused && !q && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none animate-fadeIn">
                <kbd className="kbd kbd-sm bg-base-200/50 opacity-50">/</kbd>
              </div>
            )}
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
                aria-label={t('clearSearch')}
                title={t('clearSearch')}
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

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Tanggal Awal */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder={t('filterDateStart')}
                value={filters.tanggal ?? ''}
                onChange={e => setFilters(s => ({ ...s, tanggal: e.target.value }))}
                title={t('filterDateStartTooltip')}
              />
              {/* Tanggal Akhir */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder={t('filterDateEnd')}
                value={filters.tanggal_end ?? ''}
                onChange={e => setFilters(s => ({ ...s, tanggal_end: e.target.value }))}
                title={t('filterDateEndTooltip')}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterKemandoran')}
                value={filters.kemandoran ?? ''}
                onChange={e => setFilters(s => ({ ...s, kemandoran: e.target.value }))}
                title={t('filterKemandoranTooltip')}
                disabled={isKemandoranLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterKodeKaryawan')}
                value={filters.kode_karyawan ?? ''}
                onChange={e => setFilters(s => ({ ...s, kode_karyawan: e.target.value }))}
                title={t('filterKodeKaryawanTooltip')}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterMandor')}
                value={filters.kode_karyawan_mandor ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_mandor: e.target.value,
                  }))
                }
                title={t('filterMandorTooltip')}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterFcba')}
                value={filters.fcba ?? ''}
                onChange={e => setFilters(s => ({ ...s, fcba: e.target.value }))}
                title={t('filterFcbaTooltip')}
                disabled={isFcbaLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterAfdeling')}
                value={filters.afdeling ?? ''}
                onChange={e => setFilters(s => ({ ...s, afdeling: e.target.value }))}
                title={t('filterAfdelingTooltip')}
                disabled={isAfdelingLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterGang')}
                value={filters.gang ?? ''}
                onChange={e => setFilters(s => ({ ...s, gang: e.target.value }))}
                title={t('filterGangTooltip')}
              />
              <select
                className="select select-bordered w-full"
                value={filters.attendance ?? ''}
                onChange={e => setFilters(s => ({ ...s, attendance: e.target.value }))}
                title={t('filterKodeAttendanceTooltip')}
              >
                <option value="">Attendance</option>
                {['KJ', 'MK', 'WH', 'WS', 'ML', 'P1', 'KB', 'OT'].map(v => (
                  <option key={`att-${v}`} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                className="select select-bordered w-full"
                value={filters.attendance_type ?? ''}
                onChange={e => setFilters(s => ({ ...s, attendance_type: e.target.value }))}
                title={t('filterJenisAttendanceTooltip')}
              >
                <option value="">Type</option>
                <option value="REGULAR">REGULAR</option>
                <option value="ASSISTENSI">ASSISTENSI</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={filters.status_attendance ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    status_attendance: e.target.value,
                  }))
                }
                title={t('filterStatusAttendanceTooltip')}
              >
                <option value="">Status</option>
                <option value="Approved">Approved</option>
                <option value="Planned">Planned</option>
                <option value="Reject">Reject</option>
              </select>
              <input
                className="input input-bordered w-full"
                placeholder={t('filterFcbaTujuan')}
                value={filters.fcba_destination ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    fcba_destination: e.target.value,
                  }))
                }
                title={t('filterFcbaTujuanTooltip')}
              />
              <input
                className="input input-bordered w-full"
                placeholder={t('filterAfdelingTujuan')}
                value={filters.section_destination ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    section_destination: e.target.value,
                  }))
                }
                title={t('filterAfdelingTujuanTooltip')}
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}
                disabled={loading}
                title={t('filterApplyTooltip')}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    {t('loading')}
                  </>
                ) : (
                  t('filterApply')
                )}
              </button>
              <button
                className={`btn ${loading ? 'btn-disabled' : ''}`}
                onClick={() => {
                  const resetFilters: Filters = {
                    tanggal: '',
                    tanggal_end: '',
                    kemandoran: '',
                    kode_karyawan_mandor: '',
                    kode_karyawan: '',
                    fcba: '',
                    afdeling: '',
                    gang: '',
                    attendance: '',
                    attendance_type: '',
                    status_attendance: '',
                    fcba_destination: '',
                    section_destination: '',
                  };
                  setFilters(getScopedFilters(resetFilters));
                }}
                disabled={loading}
                title={t('filterResetTooltip')}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    {t('loading')}
                  </>
                ) : (
                  t('filterReset')
                )}
              </button>
            </div>
          </div>
        )}

        {/* DataTable */}
        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100 animate-slideUp [animation-delay:200ms]">
          <div className="min-w-[900px] md:min-w-0">
            {loading ? (
              <div className="p-8">
                <SkeletonTable rows={10} />
              </div>
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
                noDataComponent={
                  <EmptyState
                    namespace="Attendance"
                    onClearSearch={q ? () => setQ('') : undefined}
                  />
                }
                progressPending={loading}
              />
            )}
          </div>
        </div>

        {/* MODAL ADD/EDIT */}
        {open && (
          <div className="modal modal-open">
            <div className="modal-box max-w-[calc(100vw-1rem)] sm:max-w-5xl mx-2 sm:mx-0 p-2 sm:p-6">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-base-100 pb-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-b border-base-300">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-xl">
                    {isEditing ? t('modalEditTitle') : t('modalAddTitle')}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost"
                    onClick={() => setOpen(false)}
                    aria-label={t('close')}
                    title={t('close')}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {detailLoading && (
                <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                  <div className="flex items-center gap-3">
                    <span className="loading loading-spinner loading-lg" />
                    <span>{t('modalLoadingDetail')}</span>
                  </div>
                </div>
              )}
              <form
                id="attendance-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-12 gap-2 max-h-[80vh] overflow-y-auto"
              >
                <div className="col-span-12">
                  <h4 className="text-sm font-semibold text-base-content/80">{t('formInfoTitle')}</h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* Tanggal */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formTanggal')}</legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.tanggal ?? ''}
                    max={getTodayISO()}
                    onChange={e => setForm(s => ({ ...s, tanggal: e.target.value }))}
                    required
                    disabled={disableUnlessAllowed(false)}
                    title={t('formTanggalTooltip')}
                  />
                </fieldset>

                {/* Type */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formAttendanceType')}</legend>
                  <SearchSelect
                    options={[
                      { value: 'REGULAR', label: 'REGULAR' },
                      { value: 'ASSISTENSI', label: 'ASSISTENSI' },
                    ]}
                    value={form.attendance_type}
                    onChange={v =>
                      setForm(s => ({
                        ...s,
                        attendance_type: v as FormState['attendance_type'],
                      }))
                    }
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* Attendance */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formAttendance')}</legend>
                  <SearchSelect
                    options={['KJ', 'MK', 'WH', 'WS', 'ML', 'P1', 'KB', 'OT'].map(v => ({
                      value: v,
                      label: v,
                    }))}
                    value={form.attendance ?? 'KJ'}
                    onChange={v =>
                      setForm(s => ({
                        ...s,
                        attendance: v as FormState['attendance'],
                      }))
                    }
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {form.attendance_type === 'ASSISTENSI' && (
                  <div className="col-span-12 mt-1">
                    <h4 className="text-sm font-semibold text-base-content/80">
                      {t('formDestTitle')}
                    </h4>
                    <div className="mt-1 border-t border-base-300" />
                  </div>
                )}

                {/* FCBA Dest */}
                {form.attendance_type === 'ASSISTENSI' && (
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">{t('formFcbaDest')}</legend>
                    <SearchSelect
                      options={destOptions}
                      value={destFcba ?? ''}
                      onChange={onChangeDestFcba}
                      placeholder={isLoadingBU ? 'Memuat...' : 'Pilih FCBA tujuan'}
                      disabled={disableUnlessAllowed(false) || isLoadingBU}
                    />
                  </fieldset>
                )}

                {/* Section Dest */}
                {form.attendance_type === 'ASSISTENSI' && (
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">{t('formSectionDest')}</legend>
                    <SearchSelect
                      key={`section-dest-${destFcba}`}
                      options={destSectionOptions}
                      value={destSection ?? ''}
                      onChange={onChangeDestSection}
                      placeholder={
                        isLoadingBU || isLoadingDestSections
                          ? 'Memuat...'
                          : destFcba
                            ? destSectionOptions.length > 0
                              ? 'Pilih Section tujuan'
                              : 'Tidak ada Section tujuan'
                            : 'Pilih FCBA tujuan dulu'
                      }
                      disabled={
                        !destFcba ||
                        disableUnlessAllowed(false) ||
                        isLoadingBU ||
                        isLoadingDestSections
                      }
                    />
                  </fieldset>
                )}

                <div className="col-span-12 mt-1">
                  <h4 className="text-sm font-semibold text-base-content/80">{t('formOriginTitle')}</h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* FCBA */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">
                    {userLevel === 'ADM' ? t('formFcba') : t('formFcbaAccount')}
                  </legend>
                  {userLevel === 'ADM' ? (
                    <SearchSelect
                      options={fcbaOptions}
                      value={selFcba}
                      onChange={v => {
                        setSelFcba(v);
                        setSelSection('');
                        setSelGang('');
                        setForm(s => ({
                          ...s,
                          fcba: v,
                          section: '',
                          gang: '',
                          kode_karyawan: '',
                          pengancakan: '',
                        }));
                      }}
                      placeholder={isLoadingBU ? 'Memuat FCBA...' : 'Pilih FCBA'}
                      disabled={disableUnlessAllowed(false) || isLoadingBU}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={homeFcba ?? ''}
                      readOnly
                      disabled
                    />
                  )}
                </fieldset>

                {/* Section / Gang / Karyawan */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formAfdeling')}</legend>
                  <SearchSelect
                    options={sectionOptions}
                    value={selSection ?? ''}
                    onChange={onChangeSection}
                    placeholder={
                      isLoadingSections
                        ? 'Memuat...'
                        : selFcba
                          ? userLevel === 'AST'
                            ? homeSection || 'Afdeling terkunci'
                            : 'Pilih Afdeling'
                          : 'Pilih FCBA dulu'
                    }
                    disabled={
                      !selFcba ||
                      disableUnlessAllowed(false) ||
                      userLevel === 'AST' ||
                      isLoadingSections
                    }
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formGang')}</legend>
                  <SearchSelect
                    options={gangOptions}
                    value={selGang ?? ''}
                    onChange={onChangeGang}
                    placeholder={
                      isLoadingGangs
                        ? 'Memuat...'
                        : selSection
                          ? 'Pilih Gang'
                          : 'Pilih Afdeling dulu'
                    }
                    disabled={!selSection || disableUnlessAllowed(false) || isLoadingGangs}
                  />
                </fieldset>

                <div className="col-span-12 mt-1">
                  <h4 className="text-sm font-semibold text-base-content/80">{t('formPersonnelTitle')}</h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* Mandor */}
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formMandor')}</legend>
                  <SearchSelect
                    options={mandorOptions}
                    value={form.kode_karyawan_mandor ?? ''}
                    onChange={onChangeMandor}
                    placeholder={isLoadingSmp ? 'Memuat Mandor...' : 'Pilih Mandor'}
                    disabled={disableUnlessAllowed(false) || isLoadingSmp}
                  />
                </fieldset>

                {/* Kemandoran */}
                <fieldset className="fieldset col-span-12 md:col-span-2">
                  <legend className="fieldset-legend">{t('formKemandoran')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={selectedMandorGang}
                    readOnly
                    disabled
                    title={t('formKemandoranTooltip')}
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formKaryawan')}</legend>
                  <SearchSelect
                    options={employeeOptions}
                    value={form.kode_karyawan ?? ''}
                    onChange={onChangeEmployee}
                    placeholder={
                      isLoadingSmp
                        ? 'Memuat Karyawan...'
                        : selGang
                          ? 'Pilih Karyawan'
                          : 'Pilih Gang dulu'
                    }
                    disabled={!selGang || disableUnlessAllowed(false) || isLoadingSmp}
                  />
                </fieldset>

                {/* Pengancakan */}
                <fieldset className="fieldset col-span-12 md:col-span-2">
                  <legend className="fieldset-legend">{t('formPengancakan')}</legend>
                  <SearchSelect
                    options={pengancakanOptions}
                    value={form.pengancakan ?? ''}
                    onChange={v => setForm(s => ({ ...s, pengancakan: v }))}
                    placeholder={
                      isLoadingSmp
                        ? 'Memuat...'
                        : selGang
                          ? 'Pilih Pengancakan'
                          : 'Pilih Gang/Karyawan dulu'
                    }
                    disabled={!selGang || disableUnlessAllowed(false) || isLoadingSmp}
                  />
                </fieldset>

                <div className="col-span-12 mt-1">
                  <h4 className="text-sm font-semibold text-base-content/80">{t('formTimeLocationTitle')}</h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* Time & Location */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formTimeIn')}</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_in ?? ''}
                    onChange={e => setForm(s => ({ ...s, time_in: e.target.value }))}
                    required
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    {t('hintTimeIn')}
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formTimeOut')}</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_out ?? ''}
                    onChange={e => setForm(s => ({ ...s, time_out: e.target.value }))}
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    {t('hintTimeOut')}
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formLocIn')}</legend>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.location_in ?? ''}
                      onChange={e => setForm(s => ({ ...s, location_in: e.target.value }))}
                      required
                      disabled={disableUnlessAllowed(false)}
                    />
                    <button
                      type="button"
                      className={`btn btn-square ${locLoading === 'in' ? 'btn-disabled' : ''}`}
                      onClick={() => handleGetLocation('in')}
                      disabled={disableUnlessAllowed(false) || locLoading !== null}
                      title={t('gpsGetLocation')}
                    >
                      {locLoading === 'in' ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        '📍'
                      )}
                    </button>
                  </div>
                  {form.location_in && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={buildMapUrl(form.location_in)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('gpsOpenMaps')}
                      </a>
                    </div>
                  )}
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formLocOut')}</legend>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.location_out ?? ''}
                      onChange={e => setForm(s => ({ ...s, location_out: e.target.value }))}
                      disabled={disableUnlessAllowed(false)}
                    />
                    <button
                      type="button"
                      className={`btn btn-square ${locLoading === 'out' ? 'btn-disabled' : ''}`}
                      onClick={() => handleGetLocation('out')}
                      disabled={disableUnlessAllowed(false) || locLoading !== null}
                      title={t('gpsGetLocation')}
                    >
                      {locLoading === 'out' ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        '📍'
                      )}
                    </button>
                  </div>
                  {form.location_out && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={buildMapUrl(form.location_out)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('gpsOpenMaps')}
                      </a>
                    </div>
                  )}
                </fieldset>

                <div className="col-span-12 mt-1">
                  <h4 className="text-sm font-semibold text-base-content/80">
                    {t('formCalcDeviceTitle')}
                  </h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* Lain-lain */}
                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">{t('formTotalLate')}</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center pointer-events-none select-none"
                    value={form.total_late_time ?? ''}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>

                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">{t('formHomeEarly')}</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center pointer-events-none select-none"
                    value={form.go_home_early ?? ''}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>

                {/* Mandays/HK */}
                <fieldset className="fieldset col-span-12 md:col-span-2">
                  <legend className="fieldset-legend">{t('formHk')}</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center"
                    value={form.mandays}
                    readOnly
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formMac')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.mac_address ?? ''}
                    readOnly
                  />
                </fieldset>

                {/* Device */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">{t('formDeviceId')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.id_device ?? ''}
                    readOnly
                  />
                </fieldset>

                <div className="col-span-12 mt-1">
                  <h4 className="text-sm font-semibold text-base-content/80">
                    {t('formDocNotesTitle')}
                  </h4>
                  <div className="mt-1 border-t border-base-300" />
                </div>

                {/* Exception Case */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    {t('formExceptionCase')}
                    {!isEditing ? ' *' : ''}
                  </legend>
                  <textarea
                    className="textarea textarea-bordered min-h-24 w-full"
                    value={form.exception_case ?? ''}
                    onChange={e => setForm(s => ({ ...s, exception_case: e.target.value }))}
                    required={!isEditing}
                  />
                </fieldset>

                {/* BA EXCA PDF */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    {t('formBaExca')}
                    {!isEditing ? ' *' : ''}
                  </legend>
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf"
                    className="file-input file-input-bordered w-full"
                    onChange={e =>
                      setForm(s => ({
                        ...s,
                        no_ba_exca_file: e.target.files?.[0],
                      }))
                    }
                    required={!isEditing}
                  />
                  {form.no_ba_exca && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={form.no_ba_exca}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('hintLinkBaExca')}
                      </a>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {t('hintFoto')}
                  </p>
                </fieldset>

                {/* Upload Foto & Preview */}
                <div className="col-span-12">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t('formFoto')}</legend>
                    <input
                      ref={imgRef}
                      type="file"
                      accept="image/*"
                      className="file-input file-input-bordered w-full"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        setForm(s => ({ ...s, images: f }));
                        onChangeImage(f);
                      }}
                      disabled={disableUnlessAllowed(false)}
                    />
                  </fieldset>
                  {preview && (
                    <div className="mt-2 relative h-48 w-full">
                      {preview.startsWith('blob:') ? (
                        <Image
                          src={preview}
                          alt="preview"
                          fill
                          className="object-contain rounded-xl ring-1 ring-inset ring-black/10"
                        />
                      ) : (
                        <a href={preview} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={preview}
                            alt="preview"
                            fill
                            className="object-contain rounded-xl ring-1 ring-inset ring-black/10"
                          />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </form>
              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 bg-base-100 pt-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-t border-base-300">
                <div className="flex flex-wrap gap-2 justify-end">
                  <button type="button" className="btn" onClick={() => setOpen(false)}>
                    {t('modalCancel')}
                  </button>
                  <button
                    type="submit"
                    form="attendance-form"
                    className={`btn btn-primary ${mutation.isPending ? 'btn-disabled' : ''}`}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <span className="loading loading-spinner" />
                    ) : isEditing ? (
                      t('modalUpdate')
                    ) : (
                      t('modalSave')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-lg">
              <h3 className="font-bold text-lg">{t('modalDeleteTitle')}</h3>
              <p className="mt-2 text-sm text-base-content/70">
                {t('modalDeleteDesc')}
              </p>

              <fieldset className="fieldset mt-3">
                <legend className="fieldset-legend">{t('modalDeleteLabel')}</legend>
                <input
                  ref={deletePdfRef}
                  type="file"
                  accept="application/pdf"
                  className="file-input file-input-bordered w-full"
                  onChange={e => setDeleteFile(e.target.files?.[0])}
                  required
                />
                <p className="text-xs opacity-70">{t('modalDeleteHint')}</p>
              </fieldset>

              <div className="modal-action">
                <button type="button" className="btn" onClick={closeDeleteModal}>
                  {t('modalCancel')}
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
                    t('modalDelete')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
