'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BusinessUnit } from '../../../utils/businessUnitService';
import { fetchBusinessUnits } from '../../../utils/businessUnitService';
import Image from 'next/image';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkeletonTable } from '@/app/components/skeletons';
import { centerHeaderStyle } from '@/utils/tableHelper';
/* =========================
   T Y P E S
========================= */
type Absensi = {
  _rowKey?: string;
  id: string;
  tanggal: string;
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
  kode_karyawan_mandor: string;
  kode_karyawan: string;
  time_in: string; // "HH:MM"
  time_out: string; // "HH:MM"
  location_in: string;
  location_out: string;
  pengancakan: string; // dari NOANlAK
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

  mandays: string; // readOnly “0 – 1”
};

const initialForm: FormState = {
  id: undefined,
  tanggal: '',
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

type UserLevel = 'ADM' | 'MGR' | 'KSI' | 'MD1' | 'AST' | 'KRT' | 'KRA' | 'KRP' | 'MDP' | 'OTHER';

const USER_LEVELS: UserLevel[] = [
  'ADM',
  'MGR',
  'KSI',
  'AST',
  'MD1',
  'MDP',
  'KRA',
  'KRT',
  'KRP',
  'OTHER',
];

const normalizeUserLevel = (level: string): UserLevel => {
  const upperLevel = level.toUpperCase();
  const normalizedLevel = upperLevel === 'ADMIN' ? 'ADM' : upperLevel;

  if (USER_LEVELS.includes(normalizedLevel as UserLevel)) {
    return normalizedLevel as UserLevel;
  }

  return 'OTHER';
};

type Triplet = { fcba: string; sectionname: string; gangcode: string };

type Employee = {
  fccode: string;
  fullname?: string;
  fcba?: string;
  sectionname?: string;
  gangcode?: string;
  noancak?: string;
};

type Option = { value: string; label: string };

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
  fcba?: unknown;
  sectionname?: unknown;
  gangcode?: unknown;
};

/* =========================
   U T I L S
========================= */
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';
import { getTodayISO, formatDateDMY, getYesterdayISO } from '@/utils/datetime';
import { buildMapUrl } from '@/utils/mapHelper';
import { cookieStore } from '@/utils/cookieStore';
import { getFilterCriteria, getLockedFields } from '@/utils/filterHelper';

const LocationButton: React.FC<{ loc?: string | null; label?: string }> = ({ loc, label }) => {
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
      <span aria-hidden>📍</span> {label ?? 'Maps'}
    </a>
  );
};

const getReadableDevice = () => {
  if (typeof navigator === 'undefined') return 'Unknown • Unknown';
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua)
    ? 'Windows'
    : /Android/i.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua)
        ? 'iOS'
        : /Mac OS X/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Unknown';
  const browser = /Sdg\//i.test(ua)
    ? 'Sdge'
    : /lhrome\//i.test(ua)
      ? 'lhrome'
      : /Firefox\//i.test(ua)
        ? 'Firefox'
        : /Safari\//i.test(ua)
          ? 'Safari'
          : 'Browser';
  return `${os} • ${browser}`;
};

const getOrCreateDeviceIds = () => {
  if (typeof window === 'undefined') return { deviceId: '', pseudoMac: '' };
  const devKey = 'sips_device_id';
  const macKey = 'sips_pseudo_mac';
  let deviceId = localStorage.getItem(devKey) || '';
  let pseudoMac = localStorage.getItem(macKey) || '';
  const ensurePseudoMacFormat = (s: string) => {
    const hex = s
      .replace(/[^a-f0-9]/gi, '')
      .padEnd(12, '0')
      .slice(0, 12);
    const formatted =
      hex
        .match(/.{1,2}/g)
        ?.join(':')
        .toUpperCase() ?? '00:00:00:00:00:00';
    return formatted;
  };
  if (!deviceId) {
    const rnd = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
    deviceId = rnd ?? String(Date.now()) + Math.random().toString(16).slice(2);
    localStorage.setItem(devKey, deviceId);
  }
  if (!pseudoMac) {
    const seed = `${navigator.userAgent}|${deviceId}|${screen.width}x${
      screen.height
    }|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    pseudoMac = ensurePseudoMacFormat(h.toString(16));
    localStorage.setItem(macKey, pseudoMac);
  }
  return { deviceId, pseudoMac };
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
   Searchable Select
========================= */
const SearchSelect: React.FC<{
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  small?: boolean;
}> = ({ options, value, onChange, placeholder, disabled, required, name, small }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter(
      o => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
  }, [q, options]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const target = e.target as Node | null;
      if (target && !boxRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const currentLabel = options.find(o => o.value === value)?.label || value || '';

  return (
    <div className="relative min-w-0" ref={boxRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        className={`input input-bordered w-full flex items-center justify-between whitespace-nowrap overflow-hidden ${
          small ? 'input-sm' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setOpen(s => !s)}
        aria-expanded={open}
        title={currentLabel || placeholder}
        disabled={disabled}
      >
        <span className={`truncate ${!value ? 'text-base-content/50' : ''}`}>
          {currentLabel || placeholder || 'Pilih...'}
        </span>
        <span className="ml-2">▾</span>
      </button>

      {required && !value && (
        <span className="sr-only" aria-live="polite">
          required
        </span>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-base-300 bg-base-100 shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              className="input input-bordered w-full"
              placeholder="Ketik untuk mencari..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.length === 0 && <li className="p-3 text-base-content/60">Tidak ada data</li>}
            {filtered.map(opt => (
              <li key={`ss-${opt.value}`}>
                <button
                  type="button"
                  className={`w-full text-left p-2 hover:bg-base-200 ${
                    opt.value === value ? 'bg-base-200' : ''
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQ('');
                  }}
                  title={opt.label}
                >
                  <div className="font-medium truncate">{opt.label}</div>
                  {opt.label !== opt.value && (
                    <div className="text-xs opacity-70 truncate">{opt.value}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* =========================
   T Y P S  G U A R D S
========================= */
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const extractArrayData = <T,>(payload: unknown): T[] => {
  if (!isObject(payload)) return [];
  if ('ok' in payload && payload.ok === true && 'data' in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
    if (isObject(d) && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
      return (d as { data: T[] }).data;
    }
  }
  return [];
};

const extractSingleData = <T,>(payload: unknown): T | null => {
  if (!isObject(payload)) return null;
  if ('ok' in payload && payload.ok === true && 'data' in payload) {
    const d = (payload as { data: unknown }).data;
    if (isObject(d) && 'data' in d) {
      const inner = (d as { data: unknown }).data as T;
      return inner;
    }
    return d as T;
  }
  return null;
};

/* =========================
   M A I N
========================= */
export default function Attendance() {
  const queryllient = useQueryClient();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      tanggal: yesterday,
      tanggal_end: today,
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
  const [homeGang, setHomeGang] = useState<string>('');
  const [userFcbaCookie, setUserFcbaCookie] = useState<string>('');
  const [userAfdelingCookie, setUserAfdelingCookie] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserLevel>('OTHER');
  const [destFcba, setDestFcba] = useState<string>('');
  const [destSection, setDestSection] = useState<string>('');
  const [optFcba, setOptFcba] = useState<string[]>([]);

  const getScopedFilters = useCallback(
    (baseFilters: Filters): Filters => {
      const scopedFilters: Filters = { ...baseFilters };

      const filterCriteria = getFilterCriteria(
        {
          level: userLevel,
          fcba: userFcbaCookie || homeFcba,
          afdeling: userAfdelingCookie || homeSection,
          gang: homeGang,
        },
        'attendance'
      );

      // Apply the filter criteria to base filters
      if (filterCriteria.fcba) scopedFilters.fcba = filterCriteria.fcba;
      if (filterCriteria.afdeling) scopedFilters.afdeling = filterCriteria.afdeling;
      if (filterCriteria.kemandoran) scopedFilters.gang = filterCriteria.kemandoran;

      return scopedFilters;
    },
    [userLevel, homeFcba, homeSection, homeGang, userFcbaCookie, userAfdelingCookie]
  );

  const { isFcbaLocked, isAfdelingLocked, isKemandoranLocked } = useMemo(
    () => getLockedFields(userLevel, 'attendance'),
    [userLevel]
  );
  const isGangLocked = isKemandoranLocked;

  useEffect(() => {
    setFilters(current => getScopedFilters(current));
  }, [getScopedFilters]);

  // Query for attendance list
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['attendance', filters, userLevel, homeFcba, homeSection, homeGang],
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

      const isAnyDateFilled = !!(start || end);
      const isRange = !!(start && end && start !== end);

      const f: Filters = getScopedFilters(base);

      delete f.tanggal;
      delete f.tanggal_end;

      if (isAnyDateFilled && !isRange) {
        f.tanggal = start;
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
        throw new Error(`HTTP ${res.status}`);
      }

      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      const raw = extractArrayData<Absensi>(json);

      let filteredByDate = raw;
      if (start && end) {
        filteredByDate = raw.filter(row => {
          const dateOnly = (row.tanggal || '').split(' ')[0];
          if (!dateOnly) return false;
          return dateOnly >= start! && dateOnly <= end!;
        });
      }

      const byId = new Map<string, Absensi>();
      for (const row of filteredByDate) if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
      const dataRaw = Array.from(byId.values());

      const seen = new Set<string>();
      return dataRaw.map((it, idx) => {
        const candidate = [
          it.id || '',
          it.kode_karyawan || '',
          (it.tanggal || '').split(' ')[0],
          String(idx),
        ].join('|');
        let key = candidate;
        while (seen.has(key)) key = `${key}_`;
        seen.add(key);
        return { ...it, _rowKey: key };
      });
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
            : 'Terjadi kesalahan saat mengambil data';
      toast.error(msg);
    }
  }, [queryError]);

  // Mutations
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
      queryllient.invalidateQueries({ queryKey: ['attendance'] });
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
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attendance/${id}`, {
        method: 'DSLSTS',
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
        const errorMsg = typeof json.error === 'string' ? json.error : 'Gagal hapus';
        throw new Error(errorMsg);
      }
      return id;
    },
    onSuccess: () => {
      queryllient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Data berhasil dihapus 🗑️');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // modal
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // loading ambil lokasi (in/out)
  const [locLoading, setLocLoading] = useState<'in' | 'out' | null>(null);

  const handleGetLocation = (target: 'in' | 'out') => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast.error('Browser tidak mendukung GPS / geolocation. Isi manual saja.');
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
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mengambil lokasi. loba lagi.'
        );
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
    setHomeGang(cookieStore.getGang());
    setUserFcbaCookie(
      cookieStore.getCookie('user_Fcba') || cookieStore.getCookie('user_fcba') || ''
    );
    setUserAfdelingCookie(
      cookieStore.getCookie('user_Afdeling') || cookieStore.getCookie('user_afdeling') || ''
    );

    const levelRaw = cookieStore.getLevel();
    setUserLevel(normalizeUserLevel(levelRaw));

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
            (it as { noancak?: unknown }).noancak ?? (it as { NOANlAK?: unknown }).NOANlAK;
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
      setSelGang(homeGang || '');
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
  }, [form.attendance_type, homeFcba, homeSection, userLevel, isEditing]);

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

  const sectionOptions: Option[] = useMemo(() => {
    if (!selFcba) return [];
    // Match by fcba field in triplets (triplets use fcba name, not fccode)
    // Need to handle both cases: selFcba being fccode or fcba name
    return Array.from(
      new Set(
        triplets
          .filter(t => {
            // Direct match with fcba field
            if (t.fcba === selFcba) return true;
            // Also try to match by extracting fcba from business units if selFcba is fccode
            const buMatch = Array.isArray(businessUnits)
              ? businessUnits.find(b => b.fccode === selFcba)
              : undefined;
            if (buMatch && t.fcba === buMatch.fcname) return true;
            return false;
          })
          .map(t => t.sectionname)
          .filter(Boolean)
      )
    )
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [triplets, selFcba, businessUnits]);

  const gangOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection) return [];
    // Get the actual fcba name for matching triplets
    let fcbaName = selFcba;
    const buMatch = Array.isArray(businessUnits)
      ? businessUnits.find(b => b.fccode === selFcba)
      : undefined;
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
  }, [triplets, selFcba, selSection, businessUnits]);

  const pengancakanOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang) return [];
    // Get the actual fcba name for matching employees
    let fcbaName = selFcba;
    const buMatch = Array.isArray(businessUnits)
      ? businessUnits.find(b => b.fccode === selFcba)
      : undefined;
    if (buMatch) fcbaName = buMatch.fcname || selFcba;

    const pool = employees.filter(
      e =>
        (e.fcba || '') === fcbaName &&
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
  }, [employees, selFcba, selSection, selGang, businessUnits]);

  const employeeOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang) return [];
    // Get the actual fcba name for matching employees
    let fcbaName = selFcba;
    const buMatch = Array.isArray(businessUnits)
      ? businessUnits.find(b => b.fccode === selFcba)
      : undefined;
    if (buMatch) fcbaName = buMatch.fcname || selFcba;

    const pool = employees.filter(
      e =>
        (e.fcba || '') === fcbaName &&
        (e.sectionname || '') === selSection &&
        (e.gangcode || '') === selGang
    );
    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || '').trim();
      if (!value) continue;
      const label = e.fullname ? `${value} - ${e.fullname}` : value;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [employees, selFcba, selSection, selGang, businessUnits]);

  // convert homeFcba (which might be fcname or fccode) to actual fccode for proper filtering
  const homeFcbaCode = useMemo(() => {
    if (!homeFcba || !Array.isArray(businessUnits) || !businessUnits.length) return homeFcba;
    // lheck if homeFcba is already a fccode in businessUnits
    const match = businessUnits.find(b => b.fccode === homeFcba);
    if (match) return homeFcba;
    // Otherwise, try to match by fcname
    const matchByName = businessUnits.find(b => b.fcname?.toLowerCase() === homeFcba.toLowerCase());
    const result = matchByName?.fccode || homeFcba;
    // console.log("[homeFcbaCode] convert:", {
    //   homeFcba,
    //   businessUnitslount: businessUnits.length,
    //   matchFound: !!matchByName,
    //   result,
    // });
    return result;
  }, [homeFcba, businessUnits]);

  const currentFcbaForForm = useMemo(() => {
    const result =
      userLevel === 'ADM' ? selFcba || homeFcbaCode || '' : homeFcbaCode || selFcba || '';
    // console.log("[currentFcbaForForm]", {
    //   userLevel,
    //   selFcba,
    //   homeFcbaCode,
    //   result,
    // });
    return result;
  }, [userLevel, selFcba, homeFcbaCode]);

  // destination select options should include every Fcba except the user's current one
  const destOptions = useMemo(() => {
    // Use opt_fcba from cookie as primary source
    if (optFcba && optFcba.length > 0) {
      const filtered = optFcba
        .filter(fcba => !currentFcbaForForm || fcba !== currentFcbaForForm)
        .map(fcba => ({
          value: fcba,
          label: fcba,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // console.log("[destOptions] From opt_fcba:", {
      //   optFcbalount: optFcba.length,
      //   currentFcbaForForm,
      //   filteredlount: filtered.length,
      //   filtered,
      // });
      return filtered;
    }

    // Fallback to businessUnits if opt_fcba not available
    if (businessUnits && businessUnits.length > 0) {
      const filtered = businessUnits
        .filter(bu => !currentFcbaForForm || bu.fccode !== currentFcbaForForm)
        .map(bu => ({
          value: bu.fccode,
          label: bu.fcname ? `${bu.fccode} - ${bu.fcname}` : bu.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // console.log("[destOptions] From businessUnits:", {
      //   businessUnitlount: businessUnits.length,
      //   currentFcbaForForm,
      //   filteredlount: filtered.length,
      //   filtered,
      // });
      return filtered;
    }

    // Fallback to fcbaOptions if business units not available
    const fallback = fcbaOptions.filter(o => !currentFcbaForForm || o.value !== currentFcbaForForm);
    // console.log("[destOptions] Fallback to fcbaOptions:", {
    //   fcbaOptionslount: fcbaOptions.length,
    //   currentFcbaForForm,
    //   fallbacklount: fallback.length,
    //   fallback,
    // });
    return fallback;
  }, [optFcba, fcbaOptions, businessUnits, currentFcbaForForm]);

  const mandorOptions: Option[] = useMemo(() => {
    let pool: Employee[] = [];
    let fcbaName = '';

    if (userLevel === 'ADM') {
      const fc = selFcba || homeFcbaCode || '';
      // convert fccode to fcba name if needed
      if (fc) {
        const buMatch = Array.isArray(businessUnits)
          ? businessUnits.find(b => b.fccode === fc)
          : undefined;
        fcbaName = buMatch ? buMatch.fcname || fc : fc;
      }
      pool = employees.filter(e => (e.fcba || '') === fcbaName);
    } else if (userLevel === 'MGR' || userLevel === 'KSI') {
      fcbaName = homeFcba || '';
      pool = employees.filter(e => (e.fcba || '') === fcbaName);
    } else if (userLevel === 'AST' || userLevel === 'KRA') {
      fcbaName = homeFcba || '';
      const sec = homeSection || '';
      pool = employees.filter(
        e => (e.fcba || '') === fcbaName && (!sec || (e.sectionname || '') === sec)
      );
    } else if (userLevel === 'MD1' || userLevel === 'KRT') {
      fcbaName = homeFcba || '';
      const sec = homeSection || '';
      pool = employees.filter(
        e => (e.fcba || '') === fcbaName && (!sec || (e.sectionname || '') === sec)
      );
    } else {
      const fc = homeFcbaCode || selFcba || '';
      // convert fccode to fcba name if needed
      if (fc) {
        const buMatch = Array.isArray(businessUnits)
          ? businessUnits.find(b => b.fccode === fc)
          : undefined;
        fcbaName = buMatch ? buMatch.fcname || fc : fc;
      }
      pool = employees.filter(e => (e.fcba || '') === fcbaName);
    }

    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || '').trim();
      if (!value) continue;
      const label = e.fullname ? `${value} - ${e.fullname}` : value;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [employees, selFcba, homeFcbaCode, homeFcba, homeSection, userLevel, businessUnits]);

  const empLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      const code = (e.fccode || '').trim();
      if (!code) continue;
      const label = e.fullname ? `${code} - ${e.fullname}` : code;
      if (!map.has(code)) map.set(code, label);
    }
    return map;
  }, [employees]);

  const onChangeSection = (v: string) => {
    setSelSection(v);
    setSelGang('');
    setForm(s => ({ ...s, section: v, kode_karyawan: '', pengancakan: '' }));
  };

  const onChangeGang = (v: string) => {
    setSelGang(v);
    setForm(s => ({ ...s, gang: v, kode_karyawan: '', pengancakan: '' }));
  };

  const onChangeEmployee = (fccode: string) => {
    const emp = employees.find(e => e.fccode === fccode);
    setForm(s => ({
      ...s,
      kode_karyawan: fccode,
      pengancakan: emp?.noancak ?? s.pengancakan,
    }));
  };

  const onChangeDestFcba = (v: string) => setDestFcba(v);
  const onChangeDestSection = (v: string) => setDestSection(v);

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

  /* ===== AUTO lOMPUTS LATS / SARLY / MANDAYS ===== */
  const recomputelomputedFields = useCallback((s: FormState): FormState => {
    const dIn = combineToDate(s.tanggal, s.time_in);
    const dOut = combineToDate(s.tanggal, s.time_out);

    const baseIn = s.tanggal ? new Date(`${s.tanggal}T06:00`) : null;
    const baseOut = s.tanggal ? new Date(`${s.tanggal}T14:00`) : null;

    let totalLate = s.total_late_time;
    if (dIn && baseIn) {
      totalLate = dIn.getTime() > baseIn.getTime() ? hhmm(diffMinutes(baseIn, dIn)) : '00:00';
    }

    let goSarly = s.go_home_early;
    if (dOut && baseOut) {
      goSarly = dOut.getTime() < baseOut.getTime() ? hhmm(diffMinutes(dOut, baseOut)) : '00:00';
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
      go_home_early: goSarly,
      mandays,
    };
  }, []);

  useEffect(() => {
    setForm(s => recomputelomputedFields(s));
  }, [form.tanggal, form.time_in, form.time_out, form.attendance, recomputelomputedFields]);

  /* ===== SUBMIT ===== */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mutation.isPending) return;

    try {
      if (!form.tanggal) throw new Error('Tanggal wajib diisi');
      if (!form.time_in) throw new Error('Time In wajib diisi');
      if (!form.location_in) throw new Error('Location In wajib diisi');
      if (!form.kode_karyawan) throw new Error('Pilih Karyawan');

      let finalFcba = currentFcbaForForm || form.fcba || '';
      if (userLevel !== 'ADM' && userLevel !== 'KSI') {
        finalFcba = homeFcba || finalFcba;
      }
      if (!finalFcba) throw new Error('Fcba akun tidak ditemukan (cookie)');
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
        throw new Error('Exception Case wajib diisi.');
      }

      if (baExcaRequired && !hasUploadedPdf && !hasExistingPdf) {
        throw new Error('No BA ExlA (PDF) wajib diisi.');
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

      if (form.mandays) fd.append('mandays', form.mandays);

      const { deviceId, pseudoMac } = getOrCreateDeviceIds();
      fd.append('id_device', form.id_device || `${getReadableDevice()} • ${deviceId}`);
      fd.append('mac_address', form.mac_address || pseudoMac);

      if (form.attendance_type === 'ASSISTENSI') {
        if (!destFcba) throw new Error('Fcba Destination wajib diisi untuk ASSISTENSI');
        if (destFcba === currentFcbaForForm)
          throw new Error('Fcba Destination tidak boleh sama dengan FCBA akun');

        // Validate that the destination FCBA exists in opt_fcba or business units
        const destExistsInOptFcba = optFcba.length > 0 && optFcba.includes(destFcba);
        const destExistsInBu =
          Array.isArray(businessUnits) && businessUnits.some(bu => bu.fccode === destFcba);
        if (!destExistsInOptFcba && !destExistsInBu) {
          throw new Error('FCBA Destination tidak valid');
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
              isEditing ? 'Data berhasil diperbarui ✅' : 'Data berhasil ditambahkan ✅'
            );
          },
        }
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan saat menyimpan';
      toast.error(message);
    }
  };

  /* ===== DSLSTS ===== */
  // wrap in useCallback so memoized columns don't re-create on every render
  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm('Yakin ingin menghapus data ini?')) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  /* ===== DSTAIL ===== */
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
        const msg = e instanceof Error ? e.message : 'Gagal memuat detail';
        toast.error(msg);
      } finally {
        setDetailLoading(false);
      }
    },
    [homeFcbaCode, homeSection]
  );

  /* ===== PRSVISW FOTO ===== */
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

  /* ===== lolumns ===== */
  const sortByLabel = (a: Absensi, b: Absensi, getLabel: (r: Absensi) => string) =>
    getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base' });

  const columns: TableColumn<Absensi>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data absensi">Aksi</span>,
        width: '120px',
        cell: (row: Absensi) => {
          const status = (row.status_attendance || '').toLowerCase();
          const isPlanned = status === 'planned';
          const canEditRole = userLevel === 'ADM' || userLevel === 'KSI';
          const canEdit = canEditRole && isPlanned;

          const canDelete = userLevel === 'ADM' && status !== 'approved' && status !== '';

          return (
            <div className="space-x-1 whitespace-nowrap overflow-visible">
              {canEditRole && (
                <button
                  className={`btn btn-xs ${canEdit ? 'btn-outline' : 'btn-disabled'}`}
                  onClick={() => canEdit && handleDetail(row.id)}
                  disabled={!canEdit}
                  title={canEdit ? 'Edit' : 'Hanya bisa edit saat Planned (ADM & KSI saja)'}
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
        name: <span title="Status persetujuan absensi (Planned/Approved/dll)">Status</span>,
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
        name: <span title="Nomor urut baris">#</span>,
        width: '56px',
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: <span title="Tanggal absensi (DD-MM-YYYY)">Tanggal</span>,
        selector: r => (r.tanggal || '').split(' ')[0],
        sortable: true,
        width: '100px',
        cell: r => {
          const raw = (r.tanggal || '').split(' ')[0];
          return <span title={raw}>{formatDateDMY(raw)}</span>;
        },
      },
      {
        name: <span title="Nama dan kode karyawan">Karyawan</span>,
        style: { flexGrow: 2 as number, minWidth: '220px' },
        width: '240px',
        sortable: true,
        sortFunction: (a, b) =>
          sortByLabel(a, b, r => `${r.namakaryawan || ''} ${r.kode_karyawan || ''}`),
        cell: r => (
          <div className="min-w-0">
            <div className="font-semibold truncate" title={r.namakaryawan || '-'}>
              {r.namakaryawan || '-'}
            </div>
            <div className="text-xs opacity-70 truncate" title={r.kode_karyawan || ''}>
              {r.kode_karyawan}
            </div>
          </div>
        ),
      },
      {
        name: <span title="Mandor (atasan langsung) karyawan">Mandor</span>,
        width: '200px',
        style: { flexGrow: 1.5 as number, minWidth: '220px' },
        sortable: true,
        sortFunction: (a, b) =>
          sortByLabel(a, b, r => {
            const code = r.kode_karyawan_mandor || '';
            const label = (code && (empLabelMap.get(code) || code)) || '';
            return label;
          }),
        cell: r => {
          const code = r.kode_karyawan_mandor || '';
          if (!code) return <>-</>;
          const label = empLabelMap.get(code) || code;
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
        name: <span title="FCBA asal (kebun/estate)">FCBA</span>,
        selector: r => r.fcba ?? '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title="Afdeling / Section">Section</span>,
        selector: r => r.section || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title="Kode gang kerja">Gang</span>,
        selector: r => r.gang || '-',
        sortable: true,
        width: '90px',
      },
      {
        name: <span title="Jenis absensi (REGULAR atau ASSISTENSI)">Type</span>,
        selector: r => r.attendance_type,
        sortable: true,
        width: '130px',
        cell: r => <span className="badge badge-outline">{r.attendance_type}</span>,
      },
      {
        name: <span title="Kode kehadiran (KJ, WH, WS, dll)">Attd</span>,
        selector: r => r.attendance,
        sortable: true,
        width: '80px',
      },
      {
        name: <span title="Jam masuk (HH:MM)">Masuk</span>,
        selector: r => (r.time_in ? r.time_in.split(' ')[1]?.slice(0, 5) || r.time_in : '-'),
        sortable: true,
        width: '110px',
      },
      {
        name: <span title="Jam pulang (HH:MM)">Pulang</span>,
        selector: r => (r.time_out ? r.time_out.split(' ')[1]?.slice(0, 5) || r.time_out : '-'),
        sortable: true,
        width: '110px',
      },
      {
        name: <span title="Total keterlambatan (jam:menit)">Late</span>,
        selector: r => r.total_late_time || '-',
        sortable: true,
        width: '90px',
      },
      {
        name: <span title="Total pulang cepat (jam:menit)">Home Sarly</span>,
        selector: r => r.go_home_early || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title="Pengancakan diambil dari NOANlAK karyawan">Pengancakan</span>,
        selector: r => r.pengancakan || '-',
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: '145px' },
      },
      {
        name: <span title="HK (mandays), hanya >0 untuk KJ/WH/WS">HK</span>,
        selector: r => (r.mandays != null ? String(r.mandays) : '-'),
        sortable: true,
        width: '90px',
      },
      {
        name: <span title="FCBA tujuan (khusus ASSISTENSI)">FCBA Dest</span>,
        selector: r => r.fcba_destination || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title="Afdeling tujuan (khusus ASSISTENSI)">Section Dest</span>,
        selector: r => r.section_destination || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title="Lokasi koordinat masuk (Google Maps)">Loc In</span>,
        style: { flexGrow: 1.2 as number, minWidth: '140px' },
        sortable: false,
        cell: r => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_in} />
          </div>
        ),
      },
      {
        name: <span title="Lokasi koordinat pulang (Google Maps)">Loc Out</span>,
        style: { flexGrow: 1.2 as number, minWidth: '140px' },
        sortable: false,
        cell: r => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_out} />
          </div>
        ),
      },
      {
        name: <span title="Exception Case (alasan/keterangan khusus)">Exc</span>,
        selector: r => r.exception_case || '-',
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: '160px' },
      },
      {
        name: <span title="Nomor BA ExlA (link ke PDF)">BA ExlA</span>,
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
              title="Buka PDF BA ExlA"
            >
              PDF
            </a>
          ) : (
            '-'
          ),
      },
      {
        name: <span title="Informasi device yang digunakan absen">Device</span>,
        selector: r => r.id_device || '-',
        sortable: true,
        width: '180px',
      },
      {
        name: <span title="Pseudo MAl address device">MAl</span>,
        selector: r => r.mac_address || '-',
        sortable: true,
        width: '160px',
      },
      {
        name: <span title="Foto pendukung absensi (bila ada)">Foto</span>,
        width: '90px',
        cell: (r: Absensi) =>
          r.images ? (
            <a
              href={getProxiedImageUrl(r.images)}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka foto"
            >
              {/*
                Changed: use container with fixed size and Image fill to avoid aspect ratio warnings.
                - lontainer is 40x40 with rounded corners and ring
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
    [handleDetail, handleDelete, empLabelMap, userLevel]
  );

  /* ===== ExPORT ExlSL ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      No: idx + 1,
      Tanggal: (r.tanggal || '').split(' ')[0],
      Nama: r.namakaryawan || '-',
      Kode: r.kode_karyawan || '-',
      Mandor: r.kode_karyawan_mandor || '-',
      FCBA: r.fcba || '-',
      Section: r.section || '-',
      Gang: r.gang || '-',
      Type: r.attendance_type || '-',
      Attendance: r.attendance || '-',
      Masuk: r.time_in ? r.time_in.split(' ')[1]?.slice(0, 5) || r.time_in : '-',
      Pulang: r.time_out ? r.time_out.split(' ')[1]?.slice(0, 5) || r.time_out : '-',
      Late: r.total_late_time || '-',
      'Home Sarly': r.go_home_early || '-',
      HK: r.mandays != null ? String(r.mandays) : '-',
      Status: r.status_attendance || '-',
    }));

    const xlsx = await import('xlsx');
    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Attendance');
    xlsx.writeFile(wb, `Attendance_${filters.tanggal}_${filters.tanggal_end}.xlsx`);
  };

  /* ===== Quick search lokal ===== */
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(it =>
      [
        it.namakaryawan,
        it.kode_karyawan,
        it.kode_karyawan_mandor,
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
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s))
    );
  }, [q, items]);

  const disableUnlessAllowed = (allowed: boolean) => (isEditing ? !allowed : false);

  const canAddOrEdit = userLevel === 'ADM' || userLevel === 'KSI';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Attendance (Absensi)"
          >
            Attendance (Absensi)
          </h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters(s => !s)}
              title="Tampilkan / sembunyikan filter lanjutan"
            >
              {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            </button>
            <button
              className={`btn btn-sm ${loading ? 'btn-disabled' : ''}`}
              onClick={() => queryllient.invalidateQueries({ queryKey: ['attendance'] })}
              disabled={loading}
              title="Refresh data absensi"
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
              title="Skspor data yang difilter ke Excel"
            >
              Export
            </button>
            {canAddOrEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onAddClick}
                title="Tambah data absensi baru (hanya ADM & KSI)"
              >
                + Tambah Absensi
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="lari apapun (karyawan, fcba, mandor, device, lokasi...)"
            value={q}
            onChange={e => setQ(e.target.value)}
            title="Pencarian cepat di semua kolom penting"
          />
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Tanggal Awal */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Awal"
                value={filters.tanggal ?? ''}
                onChange={e => setFilters(s => ({ ...s, tanggal: e.target.value }))}
                title="Filter tanggal awal absensi"
              />
              {/* Tanggal Akhir */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Akhir"
                value={filters.tanggal_end ?? ''}
                onChange={e => setFilters(s => ({ ...s, tanggal_end: e.target.value }))}
                title="Filter tanggal akhir absensi"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.kode_karyawan ?? ''}
                onChange={e => setFilters(s => ({ ...s, kode_karyawan: e.target.value }))}
                title="Filter berdasarkan kode karyawan"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Mandor"
                value={filters.kode_karyawan_mandor ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_mandor: e.target.value,
                  }))
                }
                title="Filter berdasarkan kode mandor"
              />
              <input
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba ?? ''}
                onChange={e => setFilters(s => ({ ...s, fcba: e.target.value }))}
                title="Filter berdasarkan FCBA"
                disabled={isFcbaLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling ?? ''}
                onChange={e => setFilters(s => ({ ...s, afdeling: e.target.value }))}
                title="Filter berdasarkan Afdeling / Section"
                disabled={isAfdelingLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Gang"
                value={filters.gang ?? ''}
                onChange={e => setFilters(s => ({ ...s, gang: e.target.value }))}
                title="Filter berdasarkan kode Gang"
                disabled={isGangLocked}
              />
              <select
                className="select select-bordered w-full"
                value={filters.attendance ?? ''}
                onChange={e => setFilters(s => ({ ...s, attendance: e.target.value }))}
                title="Filter berdasarkan kode attendance"
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
                title="Filter berdasarkan jenis attendance"
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
                title="Filter berdasarkan status attendance"
              >
                <option value="">Status</option>
                <option value="Approved">Approved</option>
                <option value="Planned">Planned</option>
                <option value="Reject">Reject</option>
              </select>
              <input
                className="input input-bordered w-full"
                placeholder="FCBA Tujuan"
                value={filters.fcba_destination ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    fcba_destination: e.target.value,
                  }))
                }
                title="Filter berdasarkan FCBA tujuan"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Afdeling Tujuan"
                value={filters.section_destination ?? ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    section_destination: e.target.value,
                  }))
                }
                title="Filter berdasarkan Afdeling tujuan"
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => queryllient.invalidateQueries({ queryKey: ['attendance'] })}
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

        {/* DataTable */}
        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
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
                progressPending={loading}
                pagination
                customStyles={centerHeaderStyle}
                paginationPerPage={100}
                paginationRowsPerPageOptions={[10, 30, 100, 500]}
                dense
                highlightOnHover
                fixedHeader
                fixedHeaderScrollHeight="520px"
                persistTableHead
                responsive
                noDataComponent={<div className="py-8 text-base-content/70">Tidak ada data.</div>}
              />
            )}
          </div>
        </div>

        {/* MODAL ADD/SDIT */}
        {open && (
          <div className="modal modal-open">
            <div className="modal-box max-w-5xl relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setOpen(false)}
                aria-label="llose"
                title="Tutup"
              >
                ✕
              </button>
              <h3 className="font-bold text-xl mb-3">
                {isEditing ? 'Edit Data Absensi' : 'Tambah Absensi'}
              </h3>
              {detailLoading && (
                <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                  <div className="flex items-center gap-3">
                    <span className="loading loading-spinner loading-lg" />
                    <span>Memuat detail...</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-1">
                {/* Tanggal */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Tanggal *</legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.tanggal ?? ''}
                    max={getTodayISO()}
                    onChange={e => setForm(s => ({ ...s, tanggal: e.target.value }))}
                    required
                    disabled={disableUnlessAllowed(false)}
                    title="Tanggal absensi"
                  />
                </fieldset>

                {/* Type */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Attendance Type *</legend>
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

                {/* FCBA */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">
                    {userLevel === 'ADM' ? 'FCBA' : 'FCBA (akun)'}
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
                      small
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

                {/* FCBA Dest */}
                {form.attendance_type === 'ASSISTENSI' && (
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">FCBA Destination *</legend>
                    <SearchSelect
                      options={destOptions}
                      value={destFcba ?? ''}
                      onChange={onChangeDestFcba}
                      placeholder={
                        isLoadingBU
                          ? 'Memuat...'
                          : currentFcbaForForm
                            ? 'Pilih FCBA tujuan'
                            : 'Pilih FCBA dulu'
                      }
                      disabled={!currentFcbaForForm || disableUnlessAllowed(false) || isLoadingBU}
                    />
                  </fieldset>
                )}

                {/* Section Dest */}
                {form.attendance_type === 'ASSISTENSI' && (
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Section Destination *</legend>
                    <SearchSelect
                      options={destOptions}
                      value={destSection ?? ''}
                      onChange={onChangeDestSection}
                      placeholder={
                        isLoadingBU
                          ? 'Memuat...'
                          : currentFcbaForForm
                            ? 'Pilih Section tujuan'
                            : 'Pilih Section dulu'
                      }
                      disabled={!currentFcbaForForm || disableUnlessAllowed(false) || isLoadingBU}
                    />
                  </fieldset>
                )}

                {/* Mandor */}
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">Mandor (opsional)</legend>
                  <SearchSelect
                    options={mandorOptions}
                    value={form.kode_karyawan_mandor ?? ''}
                    onChange={v => setForm(s => ({ ...s, kode_karyawan_mandor: v }))}
                    placeholder={isLoadingSmp ? 'Memuat Mandor...' : 'Pilih Mandor'}
                    small
                    disabled={disableUnlessAllowed(false) || isLoadingSmp}
                  />
                </fieldset>

                {/* Section / Gang / Karyawan */}
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">Afdeling (Section)</legend>
                  <SearchSelect
                    options={sectionOptions}
                    value={selSection ?? ''}
                    onChange={onChangeSection}
                    placeholder={
                      isLoadingSmp
                        ? 'Memuat...'
                        : selFcba
                          ? userLevel === 'AST'
                            ? homeSection || 'Afdeling terkunci'
                            : 'Pilih Afdeling'
                          : 'Pilih FCBA dulu'
                    }
                    disabled={
                      !selFcba || disableUnlessAllowed(false) || userLevel === 'AST' || isLoadingSmp
                    }
                    small
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">Gang</legend>
                  <SearchSelect
                    options={gangOptions}
                    value={selGang ?? ''}
                    onChange={onChangeGang}
                    placeholder={
                      isLoadingSmp ? 'Memuat...' : selSection ? 'Pilih Gang' : 'Pilih Afdeling dulu'
                    }
                    disabled={!selSection || disableUnlessAllowed(false) || isLoadingSmp}
                    small
                  />
                </fieldset>

                <fieldset className="fieldset  col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">Karyawan *</legend>
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

                {/* Attendance */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Attendance *</legend>
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
                    small
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* Pengancakan */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Pengancakan (No Ancak)</legend>
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
                    small
                  />
                </fieldset>

                {/* Time & Location */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Time In (HH:MM) *</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_in ?? ''}
                    onChange={e => setForm(s => ({ ...s, time_in: e.target.value }))}
                    required
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    Default 06:00. Jika di atas 06:00, kolom Late otomatis terisi.
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Time Out (HH:MM)</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_out ?? ''}
                    onChange={e => setForm(s => ({ ...s, time_out: e.target.value }))}
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    Default 14:00. Jika sebelum 14:00, kolom Go Home Sarly otomatis terisi.
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Location In *</legend>
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
                      title="Ambil lokasi otomatis dari GPS"
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
                        Buka di Google Maps
                      </a>
                    </div>
                  )}
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Location Out</legend>
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
                      title="Ambil lokasi otomatis dari GPS"
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
                        Buka di Google Maps
                      </a>
                    </div>
                  )}
                </fieldset>

                {/* Lain-lain */}
                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">Total Late (H:MM)</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center pointer-events-none select-none"
                    value={form.total_late_time ?? ''}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>

                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">Go Home Sarly (H:MM)</legend>
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
                  <legend className="fieldset-legend">HK (otomatis)</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center"
                    value={form.mandays}
                    readOnly
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">MAl Address (pseudo)</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.mac_address ?? ''}
                    readOnly
                  />
                </fieldset>

                {/* Device */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">ID Device (auto)</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.id_device ?? ''}
                    readOnly
                  />
                </fieldset>

                {/* Exception Case */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    Exception Case
                    {!isEditing ? ' *' : ''}
                  </legend>
                  <textarea
                    className="textarea textarea-bordered min-h-24 w-full"
                    value={form.exception_case ?? ''}
                    onChange={e => setForm(s => ({ ...s, exception_case: e.target.value }))}
                    required={!isEditing}
                  />
                </fieldset>

                {/* BA EXlA PDF */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    File BA Exla (PDF)
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
                        Lihat BA EXlA saat ini (PDF)
                      </a>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    Disimpan di folder yang sama dengan foto (images).
                  </p>
                </fieldset>

                {/* Upload Foto & Preview */}
                <div className="col-span-12">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Lampiran Foto</legend>
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

                <div className="modal-action col-span-12">
                  <button type="button" className="btn" onClick={() => setOpen(false)}>
                    Batal
                  </button>
                  <button
                    className={`btn btn-primary ${mutation.isPending ? 'btn-disabled' : ''}`}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <span className="loading loading-spinner" />
                    ) : isEditing ? (
                      'Update'
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
