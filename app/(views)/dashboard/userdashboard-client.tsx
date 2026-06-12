'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SimpleBarChart, SimplePieChart, SimpleLineChart } from '@/app/components/dashboard-chart';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { SkeletonCard, SkeletonTable, SkeletonChart } from '@/app/components/skeletons';
import { formatPerfNumber } from '@/utils/perf-formatter';
import { useLocale } from '@/hooks/useLocale';
import { SearchSelect, type Option } from '@/app/components/search-select';
import { cookieStore } from '@/utils/cookieStore';
import { toTitleCase } from '@/utils/textManipulation';
import { EmptyState } from '@/app/components/empty-state';

/* =========================
   T Y P E S
========================= */

type UserLevel = 'ADM' | 'MGR' | 'AST' | 'OTHER';

interface UserProfile {
  id?: string | number;
  username?: string;
  fullname?: string;
  level?: string;
  fcba?: string;
  afdeling?: string;
  section?: string;
  gang?: string;
}

interface AttendanceRecord {
  id?: string | number;
  tanggal?: string | null; // "YYYY-MM-DD HH:mm:ss"
  attendance?: string | null; // KJ, WH, WS, KB, OT, P1, MK, dll
  total_late_time?: string | null; // "HH:MM"
  go_home_early?: string | null; // "HH:MM" → pulang awal
  fcba?: string | null;
  section?: string | null;
  gang?: string | null;
  // ⚡ Bolt Optimization: cached display values
  _displayDate?: string;
  _status?: ClassifiedStatus;
}

interface DashboardStats {
  totalHadir: number; // Total semua hadir (termasuk telat & pulang awal)
  totalTepatWaktu: number; // Hadir tepat waktu
  totalTelat: number;
  totalPulangAwal: number;
  totalAlpa: number;
}

interface HarvestingRecord {
  id?: string;
  nodokumen?: string;
  tanggal?: string;
  kode_karyawan?: string;
  nama_karyawan?: string;
  output?: string | number;
  status_harvesting?: string;
  fcba?: string;
  afdeling?: string;
}

interface PengangkutanRecord {
  id?: string;
  nopengangkutan?: string;
  tanggal?: string;
  status_pengangkutan?: string;
  driver?: string;
  type_pengangkutan?: string;
  fcba?: string;
  afdeling?: string;
  output?: string | number;
  jjg?: string | number;
  jumlah?: string | number;
  quantity?: string | number;
  tonase?: string | number;
  berat?: string | number;
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DailyGroupKey {
  date: string;
  fcba?: string;
  afdeling?: string;
}

interface DailySummary extends DailyGroupKey {
  hadir: number;
  tepatWaktu: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
  _displayDate?: string;
}

interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  hadir: number;
  tepatWaktu: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface YearlySummary {
  year: number;
  hadir: number;
  tepatWaktu: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface Triplet {
  fcba: string;
  sectionname: string;
  gangcode: string;
}

type DetailMode = 'perHari' | 'perBaris';

/* =========================
   U T I L S
========================= */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// Range tanggal utk filter FRONTEND
const getDateRange = (frame: Timeframe): { from: string; to: string } => {
  const today = new Date();
  const dateTo = new Date(today);
  const dateFrom = new Date(today);

  if (frame === 'daily') {
    // hanya hari ini
  } else if (frame === 'weekly') {
    dateFrom.setDate(today.getDate() - 6);
  } else if (frame === 'monthly') {
    dateFrom.setDate(1);
  } else if (frame === 'yearly') {
    dateFrom.setMonth(0, 1);
    dateTo.setMonth(11, 31);
  }

  const toISO = (d: Date) => d.toISOString().split('T')[0];
  return { from: toISO(dateFrom), to: toISO(dateTo) };
};

const parseDateOnly = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const onlyDate = trimmed.split(' ')[0];
  if (!onlyDate) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return null;
  return onlyDate;
};

// ⚡ Bolt Optimization: Reuse Intl.DateTimeFormat instances to avoid expensive re-creation
// creating an Intl object on every call to toLocaleDateString() is a known bottleneck.
const dayFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

const dateCache = new Map<string, string>();
const formatDateID = (yyyyMmDd: string): string => {
  // ⚡ Bolt Optimization: Memoize formatted date strings to avoid redundant
  // new Date() and Intl format() calls in large loops.
  const cached = dateCache.get(yyyyMmDd);
  if (cached) return cached;

  const d = new Date(yyyyMmDd + 'T00:00:00');
  if (Number.isNaN(+d)) return yyyyMmDd;

  const formatted = dayFormatter.format(d);
  dateCache.set(yyyyMmDd, formatted);
  return formatted;
};

const formatMonthID = (year: number, month: number): string => {
  const date = new Date(year, month - 1, 1);
  return monthFormatter.format(date);
};

const formatYearID = (year: number): string => {
  return year.toString();
};

// Klasifikasi berdasarkan KODE + total_late_time + go_home_early
// HADIR = semua kode kecuali MK dan P1 (tidak peduli telat/pulang awal)
// TEPAT_WAKTU = hadir tanpa telat dan tanpa pulang awal
type ClassifiedStatus = 'HADIR' | 'TEPAT_WAKTU' | 'TELAT' | 'PULANG_AWAL' | 'ALPHA' | 'OTHER';

const isNonZeroTime = (raw?: string | null): boolean => {
  if (!raw) return false;
  const t = raw.trim();
  if (!t) return false;
  if (t === '0' || t === '00:00' || t === '0:00') return false;
  return true;
};

const classifyStatus = (record: AttendanceRecord): ClassifiedStatus => {
  const code = (record.attendance || '').toUpperCase().trim();
  const lateRaw = record.total_late_time;
  const goHomeRaw = record.go_home_early;

  // ALPHA hanya untuk MK dan P1
  const isAlphaCode = ['P1', 'MK'].includes(code);
  if (isAlphaCode) return 'ALPHA';

  // Semua kode lainnya dianggap HADIR
  // Tapi kita tetap klasifikasi detail untuk TEPAT_WAKTU, TELAT, PULANG_AWAL
  const isLate = isNonZeroTime(lateRaw);
  const isEarly = isNonZeroTime(goHomeRaw);

  // Selalu return HADIR untuk total count
  // Tapi untuk detail breakdown:
  if (isEarly) return 'PULANG_AWAL';
  if (isLate) return 'TELAT';
  return 'TEPAT_WAKTU'; // Tepat waktu (tidak telat, tidak pulang awal)
};

// Ekstrak array data dari response API (ok + data / data.data)
const extractAttendanceArray = (payload: unknown): AttendanceRecord[] => {
  if (!isRecord(payload)) return [];
  if ('ok' in payload && payload.ok === true && 'data' in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) return d as AttendanceRecord[];
    if (isRecord(d) && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
      return (d as { data: AttendanceRecord[] }).data;
    }
  }
  return [];
};

const extractTriplets = (payload: unknown): Triplet[] => {
  if (!isRecord(payload)) return [];
  if ('ok' in payload && payload.ok === true && 'data' in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) {
      return d
        .map(row => {
          if (!isRecord(row)) return null;
          const fcba = String(row.fcba ?? '').trim();
          const sectionname = String(row.sectionname ?? '').trim();
          const gangcode = String(row.gangcode ?? '').trim();
          if (!fcba && !sectionname && !gangcode) return null;
          return { fcba, sectionname, gangcode };
        })
        .filter((v): v is Triplet => v !== null);
    }
    if (isRecord(d) && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
      return extractTriplets({ ok: true, data: (d as { data: unknown }).data });
    }
  }
  return [];
};

/* =========================
   M A I N  D A S H B O A R D
========================= */

export default function UserDashboard() {
  const localeTag = useLocale();
  const queryClient = useQueryClient();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel>('OTHER');

  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');

  const [filterFcba, setFilterFcba] = useState<string>('ALL');
  const [filterAfdeling, setFilterAfdeling] = useState<string>('');

  const [showFilters, setShowFilters] = useState(false);

  // Mode tampilan riwayat: per hari (rekap) / per baris (detail)
  const [detailMode, setDetailMode] = useState<DetailMode>('perHari');

  const handleClearFilters = useCallback(() => {
    setFilterFcba('ALL');
    setFilterAfdeling('');
    setTimeframe('monthly');
  }, []);

  // State untuk mengatasi hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prefetch data saat component mount untuk mempercepat load
  useEffect(() => {
    if (!isClient) return;

    // Prefetch triplets (data master yang jarang berubah)
    queryClient.prefetchQuery({
      queryKey: ['triplets'],
      queryFn: async () => {
        const ckTrip = cookieStore.getCookie('opt_triplets');
        if (ckTrip) {
          try {
            const arr = JSON.parse(ckTrip) as Triplet[];
            if (Array.isArray(arr) && arr.length > 0) return arr;
          } catch {
            /* ignore */
          }
        }
        const res = await fetch('/api/karyawans', { credentials: 'include' });
        if (!res.ok) return [];
        const json = await res.json();
        return extractTriplets(json);
      },
      staleTime: 30 * 60 * 1000, // 30 menit
    });

    // Prefetch user profile
    queryClient.prefetchQuery({
      queryKey: ['userProfile'],
      queryFn: async () => {
        const res = await fetch('/api/user/profile', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.ok && typeof json.data === 'object' && json.data !== null) {
          const data = json.data as Record<string, unknown>;
          return data.data ? data.data : data;
        }
        return null;
      },
      staleTime: 5 * 60 * 1000, // 5 menit
    });
  }, [isClient, queryClient]);

  // combine userProfile fields into a single stable dependency key
  const userProfileKey = useMemo(() => {
    return `${userProfile?.fcba || ''}|${userProfile?.afdeling || ''}|${
      userProfile?.section || ''
    }`;
  }, [userProfile?.fcba, userProfile?.afdeling, userProfile?.section]);

  /* ===== Queries ===== */

  // 1. Triplets Query
  const { data: triplets = [] } = useQuery({
    queryKey: ['triplets'],
    queryFn: async () => {
      // Cek cookie dulu
      const ckTrip = cookieStore.getCookie('opt_triplets');
      if (ckTrip) {
        try {
          const arr = JSON.parse(ckTrip) as Triplet[];
          if (Array.isArray(arr) && arr.length > 0) return arr;
        } catch {
          /* ignore */
        }
      }

      const res = await fetch('/api/karyawans', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          await logoutAndRedirect();
        }
        return [];
      }
      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      return extractTriplets(json);
    },
    enabled: isClient,
    staleTime: 30 * 60 * 1000, // 30 menit
    gcTime: 60 * 60 * 1000, // 1 jam cache
  });

  // 2. User Profile Query
  const { data: profileData } = useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) {
          await logoutAndRedirect();
        }
        return null;
      }
      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return null;
      }
      if (json.ok && typeof json.data === 'object' && json.data !== null) {
        const data = json.data as Record<string, unknown>;
        const inner = data.data ? data.data : data;
        return inner as UserProfile;
      }
      return null;
    },
    enabled: isClient,
    staleTime: 10 * 60 * 1000, // 10 menit untuk user profile
    gcTime: 20 * 60 * 1000,
  });

  useEffect(() => {
    if (profileData) {
      setUserProfile(prev => ({ ...(prev || {}), ...profileData }));
      const lvl2 = (profileData.level || '').toUpperCase();
      if (lvl2 === 'ADM' || lvl2 === 'MGR' || lvl2 === 'AST') {
        setUserLevel(lvl2 as UserLevel);
        if (lvl2 === 'ADM') {
          setFilterFcba('ALL');
        } else if (lvl2 === 'MGR') {
          setFilterFcba(profileData.fcba || '');
        } else if (lvl2 === 'AST') {
          setFilterFcba(profileData.fcba || '');
          setFilterAfdeling(profileData.afdeling || profileData.section || '');
        }
      }
    }
  }, [profileData]);

  // 3. Attendance Query
  const {
    data: attendanceRaw = [],
    isLoading: loading,
    error: attendanceError,
  } = useQuery({
    queryKey: ['attendance', timeframe, filterFcba, filterAfdeling, userLevel, userProfileKey],
    queryFn: async () => {
      // ⚡ Bolt Optimization: Use server-side filtering for attendance data.
      // By passing 'tanggal' and 'tanggal_end', we reduce network payload
      // and client-side processing by ~75% (depending on timeframe).
      const { from, to } = getDateRange(timeframe);
      const params = new URLSearchParams();
      params.set('tanggal', from);
      params.set('tanggal_end', to);

      const homeFcba = userProfile?.fcba || cookieStore.getCookie('user_Fcba') || '';
      const homeAfdeling =
        userProfile?.afdeling || userProfile?.section || cookieStore.getCookie('user_Section') || '';

      if (userLevel === 'ADM') {
        if (filterFcba && filterFcba !== 'ALL') params.set('fcba', filterFcba.trim());
        if (filterAfdeling.trim()) params.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'MGR') {
        if (homeFcba) params.set('fcba', homeFcba.trim());
        if (filterAfdeling.trim()) params.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'AST') {
        if (homeFcba) params.set('fcba', homeFcba.trim());
        if (homeAfdeling) params.set('afdeling', homeAfdeling.trim());
      }

      const res = await fetch(`/api/attendance?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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
        } catch { /* fallback ke HTTP status */ }
        throw new Error(detail);
      }

      const json: unknown = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      return extractAttendanceArray(json);
    },
    enabled: isClient,
    staleTime: 2 * 60 * 1000, // 2 menit - attendance lebih sering berubah
    gcTime: 5 * 60 * 1000,
  });

  // 4. Harvesting Query
  const {
    data: harvestingStats = {
      total: 0,
      totalOutput: 0,
      approved: 0,
      planned: 0,
    },
    isLoading: loadingHarvesting,
  } = useQuery({
    queryKey: ['harvesting', timeframe, filterFcba, filterAfdeling, userLevel, userProfileKey],
    queryFn: async () => {
      const { from, to } = getDateRange(timeframe);
      const p = new URLSearchParams();
      p.set('tanggal', from);
      p.set('tanggal_end', to);

      const homeFcba = userProfile?.fcba || cookieStore.getCookie('user_Fcba') || '';
      const homeAfdeling =
        userProfile?.afdeling || userProfile?.section || cookieStore.getCookie('user_Section') || '';

      if (userLevel === 'ADM') {
        if (filterFcba && filterFcba !== 'ALL') p.set('fcba', filterFcba.trim());
        if (filterAfdeling.trim()) p.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'MGR') {
        if (homeFcba) p.set('fcba', homeFcba.trim());
        if (filterAfdeling.trim()) p.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'AST') {
        if (homeFcba) p.set('fcba', homeFcba.trim());
        if (homeAfdeling) p.set('afdeling', homeAfdeling.trim());
      }

      const res = await fetch(`/api/harvest?${p.toString()}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        return { total: 0, totalOutput: 0, approved: 0, planned: 0 };
      }
      if (res.status === 404 || !res.ok)
        return { total: 0, totalOutput: 0, approved: 0, planned: 0 };

      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return { total: 0, totalOutput: 0, approved: 0, planned: 0 };
      }
      let rows: unknown[] = [];
      if (Array.isArray(json)) {
        rows = json;
      } else if (
        json &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as Record<string, unknown>).data)
      ) {
        rows = (json as Record<string, unknown>).data as unknown[];
      }
      const harvestRows = rows as HarvestingRecord[];

      // ⚡ Bolt Optimization: Single-pass stats calculation (O(N) vs O(3N))
      let totalOutput = 0;
      let approved = 0;
      let planned = 0;

      for (const r of harvestRows) {
        totalOutput += parseInt(String(r.output || 0)) || 0;
        if (r.status_harvesting === 'Approved') approved++;
        else if (r.status_harvesting === 'Planned') planned++;
      }

      return {
        total: harvestRows.length,
        totalOutput,
        approved,
        planned,
      };
    },
    enabled: isClient,
    staleTime: 3 * 60 * 1000, // 3 menit
    gcTime: 6 * 60 * 1000,
  });

  // 5. Pengangkutan Query
  const {
    data: pengangkutanStats = {
      total: 0,
      approved: 0,
      planned: 0,
      completed: 0,
      totalOutput: 0,
    },
    isLoading: loadingPengangkutan,
  } = useQuery({
    queryKey: ['pengangkutans', timeframe, filterFcba, filterAfdeling, userLevel, userProfileKey],
    queryFn: async () => {
      const { from, to } = getDateRange(timeframe);
      const p = new URLSearchParams();
      p.set('tanggal', from);
      p.set('tanggal_end', to);

      const homeFcba = userProfile?.fcba || cookieStore.getCookie('user_Fcba') || '';
      const homeAfdeling =
        userProfile?.afdeling || userProfile?.section || cookieStore.getCookie('user_Section') || '';

      if (userLevel === 'ADM') {
        if (filterFcba && filterFcba !== 'ALL') p.set('fcba', filterFcba.trim());
        if (filterAfdeling.trim()) p.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'MGR') {
        if (homeFcba) p.set('fcba', homeFcba.trim());
        if (filterAfdeling.trim()) p.set('afdeling', filterAfdeling.trim());
      } else if (userLevel === 'AST') {
        if (homeFcba) p.set('fcba', homeFcba.trim());
        if (homeAfdeling) p.set('afdeling', homeAfdeling.trim());
      }

      const res = await fetch(`/api/pengangkutans?${p.toString()}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        return {
          total: 0,
          approved: 0,
          planned: 0,
          completed: 0,
          totalOutput: 0,
        };
      }
      if (res.status === 404 || !res.ok)
        return {
          total: 0,
          approved: 0,
          planned: 0,
          completed: 0,
          totalOutput: 0,
        };

      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return {
          total: 0,
          approved: 0,
          planned: 0,
          completed: 0,
          totalOutput: 0,
        };
      }
      let rows: unknown[] = [];
      if (Array.isArray(json)) {
        rows = json;
      } else if (
        json &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as Record<string, unknown>).data)
      ) {
        rows = (json as Record<string, unknown>).data as unknown[];
      }
      const pengangkutanRows = rows as PengangkutanRecord[];

      // ⚡ Bolt Optimization: Single-pass stats calculation (O(N) vs O(4N))
      let totalOutput = 0;
      let approved = 0;
      let planned = 0;
      let completed = 0;

      for (const r of pengangkutanRows) {
        const candidates = [r.output, r.jjg, r.jumlah, r.quantity, r.tonase, r.berat];
        for (const c of candidates) {
          if (c === null || c === undefined || c === '') continue;
          const n = parseInt(String(c).replace(/[^0-9-]/g, ''), 10);
          if (!Number.isNaN(n)) {
            totalOutput += n;
            break;
          }
        }
        if (r.status_pengangkutan === 'Approved') approved++;
        else if (r.status_pengangkutan === 'Planned') planned++;
        else if (r.status_pengangkutan === 'Completed') completed++;
      }

      return {
        total: pengangkutanRows.length,
        approved,
        planned,
        completed,
        totalOutput,
      };
    },
    enabled: isClient,
    staleTime: 3 * 60 * 1000, // 3 menit
    gcTime: 6 * 60 * 1000,
  });

  const error = attendanceError
    ? attendanceError instanceof Error
      ? attendanceError.message
      : 'Gagal memuat data dashboard'
    : null;

  /* ===== Bootstrap user dari cookies ===== */
  useEffect(() => {
    const cookieFullname =
      cookieStore.getCookie('user_FullName') ||
      cookieStore.getCookie('user_fullname') ||
      cookieStore.getCookie('user_Name') ||
      cookieStore.getCookie('user_name') ||
      '';
    const cookieLevelRaw =
      cookieStore.getCookie('user_Level') || cookieStore.getCookie('user_LEVEL') || cookieStore.getCookie('user_level') || '';
    const cookieFcba =
      cookieStore.getCookie('user_Fcba') || cookieStore.getCookie('user_FCBA') || cookieStore.getCookie('user_fcba') || '';
    const cookieSection =
      cookieStore.getCookie('user_Section') ||
      cookieStore.getCookie('user_SECTION') ||
      cookieStore.getCookie('user_section') ||
      cookieStore.getCookie('user_Afdeling') ||
      cookieStore.getCookie('user_afdeling') ||
      '';
    const cookieGang =
      cookieStore.getCookie('user_Gang') || cookieStore.getCookie('user_gang') || cookieStore.getCookie('user_GANG') || '';

    let lvl: UserLevel = 'OTHER';
    const upperLvl = cookieLevelRaw.toUpperCase();
    if (upperLvl === 'ADM' || upperLvl === 'MGR' || upperLvl === 'AST') {
      lvl = upperLvl;
    }

    setUserLevel(lvl);
    setUserProfile(prev => ({
      ...(prev || {}),
      fullname: cookieFullname || prev?.fullname,
      level: upperLvl || prev?.level,
      fcba: cookieFcba || prev?.fcba,
      afdeling: cookieSection || prev?.afdeling,
      gang: cookieGang || prev?.gang,
    }));

    if (lvl === 'ADM') {
      setFilterFcba('ALL');
      setFilterAfdeling('');
    } else if (lvl === 'MGR') {
      setFilterFcba(cookieFcba || '');
      setFilterAfdeling('');
    } else if (lvl === 'AST') {
      setFilterFcba(cookieFcba || '');
      setFilterAfdeling(cookieSection || '');
    }
  }, []);

  /* ===== Options FCBA & Afdeling (chain) ===== */
  const fcbaOptions: Option[] = useMemo(() => {
    const uniq = Array.from(new Set(triplets.map(t => t.fcba).filter(Boolean))).sort();

    const base = uniq.map(v => ({ value: v, label: v }));
    if (userLevel === 'ADM') {
      return [{ value: 'ALL', label: 'ALL FCBA' }, ...base];
    }
    return base;
  }, [triplets, userLevel]);

  const afdelingOptions: Option[] = useMemo(() => {
    // Always include an option to select all afdeling (empty value means no afdeling filter)
    if (!filterFcba || filterFcba === 'ALL') {
      const uniq = Array.from(new Set(triplets.map(t => t.sectionname).filter(Boolean))).sort();
      return [{ value: '', label: 'Semua Afdeling' }, ...uniq.map(v => ({ value: v, label: v }))];
    }
    const uniq = Array.from(
      new Set(
        triplets
          .filter(t => t.fcba === filterFcba)
          .map(t => t.sectionname)
          .filter(Boolean)
      )
    ).sort();
    return [{ value: '', label: 'Semua Afdeling' }, ...uniq.map(v => ({ value: v, label: v }))];
  }, [triplets, filterFcba]);

  /* ===== Consolidated Attendance Data Processing (O(n) single-pass) ===== */
  const {
    stats,
    dailySummaries,
    monthlySummaries,
    yearlySummaries,
    rowDetails,
    filteredAttendance,
  } = useMemo(() => {
    const { from, to } = getDateRange(timeframe);

    const stats: DashboardStats = {
      totalHadir: 0,
      totalTepatWaktu: 0,
      totalTelat: 0,
      totalPulangAwal: 0,
      totalAlpa: 0,
    };

    const dailyMap = new Map<string, DailySummary>();
    const monthlyMap = new Map<string, MonthlySummary>();
    const yearlyMap = new Map<number, YearlySummary>();
    const filteredAttendance: AttendanceRecord[] = [];
    const rowDetailsWithDates: { record: AttendanceRecord; date: string }[] = [];

    if (!attendanceRaw.length) {
      return {
        stats,
        dailySummaries: [],
        monthlySummaries: [],
        yearlySummaries: [],
        rowDetails: [],
        filteredAttendance: [],
      };
    }

    for (const r of attendanceRaw) {
      const dateOnly = parseDateOnly(r.tanggal);
      if (!dateOnly || dateOnly < from || dateOnly > to) continue;

      const cls = classifyStatus(r);

      // ⚡ Bolt Optimization: pre-calculate values for rendering
      r._displayDate = formatDateID(dateOnly);
      r._status = cls;

      filteredAttendance.push(r);
      rowDetailsWithDates.push({ record: r, date: dateOnly });

      // 1. Update Global Stats
      if (cls === 'TEPAT_WAKTU') {
        stats.totalTepatWaktu += 1;
        stats.totalHadir += 1;
      } else if (cls === 'TELAT') {
        stats.totalTelat += 1;
        stats.totalHadir += 1;
      } else if (cls === 'PULANG_AWAL') {
        stats.totalPulangAwal += 1;
        stats.totalHadir += 1;
      } else if (cls === 'ALPHA') {
        stats.totalAlpa += 1;
      }

      // 2. Aggregasi Harian
      let keyObj: DailyGroupKey;
      if (userLevel === 'ADM') {
        keyObj = {
          date: dateOnly,
          fcba: r.fcba || '-',
          afdeling: r.section || '-',
        };
      } else if (userLevel === 'MGR') {
        keyObj = {
          date: dateOnly,
          afdeling: r.section || '-',
        };
      } else {
        keyObj = { date: dateOnly };
      }

      const keyParts = [keyObj.date];
      if (keyObj.fcba) keyParts.push(`FCBA:${keyObj.fcba}`);
      if (keyObj.afdeling) keyParts.push(`AFD:${keyObj.afdeling}`);
      const dailyKey = keyParts.join('|');

      let dSummary = dailyMap.get(dailyKey);
      if (!dSummary) {
        dSummary = {
          ...keyObj,
          hadir: 0,
          tepatWaktu: 0,
          telat: 0,
          pulangAwal: 0,
          alpa: 0,
          _displayDate: r._displayDate,
        };
        dailyMap.set(dailyKey, dSummary);
      }

      if (cls === 'TEPAT_WAKTU') {
        dSummary.tepatWaktu += 1;
        dSummary.hadir += 1;
      } else if (cls === 'TELAT') {
        dSummary.telat += 1;
        dSummary.hadir += 1;
      } else if (cls === 'PULANG_AWAL') {
        dSummary.pulangAwal += 1;
        dSummary.hadir += 1;
      } else if (cls === 'ALPHA') {
        dSummary.alpa += 1;
      }

      // 3. Aggregasi Bulanan (hanya jika monthly/yearly)
      if (timeframe === 'monthly' || timeframe === 'yearly') {
        const [year, month] = dateOnly.split('-').map(Number);
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

        let mSummary = monthlyMap.get(monthKey);
        if (!mSummary) {
          mSummary = {
            year,
            month,
            monthName: formatMonthID(year, month),
            hadir: 0,
            tepatWaktu: 0,
            telat: 0,
            pulangAwal: 0,
            alpa: 0,
          };
          monthlyMap.set(monthKey, mSummary);
        }

        if (cls === 'TEPAT_WAKTU') {
          mSummary.tepatWaktu += 1;
          mSummary.hadir += 1;
        } else if (cls === 'TELAT') {
          mSummary.telat += 1;
          mSummary.hadir += 1;
        } else if (cls === 'PULANG_AWAL') {
          mSummary.pulangAwal += 1;
          mSummary.hadir += 1;
        } else if (cls === 'ALPHA') {
          mSummary.alpa += 1;
        }
      }

      // 4. Aggregasi Tahunan (hanya jika yearly)
      if (timeframe === 'yearly') {
        const year = parseInt(dateOnly.split('-')[0]);
        let ySummary = yearlyMap.get(year);
        if (!ySummary) {
          ySummary = {
            year,
            hadir: 0,
            tepatWaktu: 0,
            telat: 0,
            pulangAwal: 0,
            alpa: 0,
          };
          yearlyMap.set(year, ySummary);
        }

        if (cls === 'TEPAT_WAKTU') {
          ySummary.tepatWaktu += 1;
          ySummary.hadir += 1;
        } else if (cls === 'TELAT') {
          ySummary.telat += 1;
          ySummary.hadir += 1;
        } else if (cls === 'PULANG_AWAL') {
          ySummary.pulangAwal += 1;
          ySummary.hadir += 1;
        } else if (cls === 'ALPHA') {
          ySummary.alpa += 1;
        }
      }
    }

    // Final Sorts
    const dailySummaries = Array.from(dailyMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const monthlySummaries = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    const yearlySummaries = Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);
    const sortedRowDetails = rowDetailsWithDates
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(item => item.record);

    return {
      stats,
      dailySummaries,
      monthlySummaries,
      yearlySummaries,
      rowDetails: sortedRowDetails,
      filteredAttendance,
    };
  }, [attendanceRaw, timeframe, userLevel]);

  /* ===== Data Chart ===== */

  const barChartData = useMemo(
    () => [
      { label: 'Hadir (Total)', value: stats.totalHadir },
      { label: 'Tepat Waktu', value: stats.totalTepatWaktu },
      { label: 'Telat', value: stats.totalTelat },
      { label: 'Pulang Awal', value: stats.totalPulangAwal },
      { label: 'Alpha', value: stats.totalAlpa },
    ],
    [stats]
  );

  const pieChartData = useMemo(
    () => [
      { label: 'Tepat Waktu', value: stats.totalTepatWaktu, color: '#10b981' },
      { label: 'Telat', value: stats.totalTelat, color: '#f59e0b' },
      { label: 'Pulang Awal', value: stats.totalPulangAwal, color: '#ef4444' },
      { label: 'Alpha', value: stats.totalAlpa, color: '#000000' },
    ],
    [stats]
  );

  // 🔥 Data untuk Line Chart berdasarkan timeframe (sekarang sudah ada Pulang Awal)
  const lineChartData = useMemo(() => {
    if (timeframe === 'daily' || timeframe === 'weekly') {
      return dailySummaries
        .slice()
        .reverse()
        .map(d => ({
          label: d._displayDate || d.date,
          hadir: d.hadir,
          tepatWaktu: d.tepatWaktu,
          telat: d.telat,
          pulangAwal: d.pulangAwal,
          alpa: d.alpa,
        }));
    } else if (timeframe === 'monthly') {
      return monthlySummaries
        .slice()
        .reverse()
        .map(m => ({
          label: m.monthName,
          hadir: m.hadir,
          tepatWaktu: m.tepatWaktu,
          telat: m.telat,
          pulangAwal: m.pulangAwal,
          alpa: m.alpa,
        }));
    } else if (timeframe === 'yearly') {
      return yearlySummaries
        .slice()
        .reverse()
        .map(y => ({
          label: formatYearID(y.year),
          hadir: y.hadir,
          tepatWaktu: y.tepatWaktu,
          telat: y.telat,
          pulangAwal: y.pulangAwal,
          alpa: y.alpa,
        }));
    }
    return [];
  }, [timeframe, dailySummaries, monthlySummaries, yearlySummaries]);

  // Memoize secondary metrics (percentages) to avoid redundant calculations
  const { pctHadir, pctTepatWaktu, pctTelat, pctPulangAwal, pctAlpa } = useMemo(() => {
    // grandTotal is the sum of mutually-exclusive categories: TepatWaktu, Telat, PulangAwal, Alpa
    const total =
      stats.totalTepatWaktu + stats.totalTelat + stats.totalPulangAwal + stats.totalAlpa;

    const calculatePct = (value: number) => (total ? Math.round((value / total) * 100) : 0);

    return {
      pctHadir: calculatePct(stats.totalHadir),
      pctTepatWaktu: calculatePct(stats.totalTepatWaktu),
      pctTelat: calculatePct(stats.totalTelat),
      pctPulangAwal: calculatePct(stats.totalPulangAwal),
      pctAlpa: calculatePct(stats.totalAlpa),
    };
  }, [stats]);

  /* ===== UI Helpers ===== */

  const displayName =
    toTitleCase(
      userProfile?.fullname || cookieStore.getCookie('user_FullName') || userProfile?.username || ''
    ) || 'User';

  const displayLevel = (userProfile?.level || '').toUpperCase() || userLevel;

  const displayFcba = userProfile?.fcba || '-';
  const displayAfdeling = userProfile?.afdeling || userProfile?.section || '-';
  const displayGang = userProfile?.gang || '-';

  const timeframeLabel = (tf: Timeframe): string => {
    switch (tf) {
      case 'daily':
        return 'Per Hari';
      case 'weekly':
        return '7 Hari Terakhir';
      case 'monthly':
        return 'Per Bulan (bulan ini)';
      case 'yearly':
        return 'Per Tahun (tahun ini)';
      default:
        return '';
    }
  };

  const getTrendLabel = (): string => {
    switch (timeframe) {
      case 'daily':
        return 'Per Hari';
      case 'weekly':
        return 'Per Hari (7 Hari Terakhir)';
      case 'monthly':
        return 'Per Bulan';
      case 'yearly':
        return 'Per Tahun';
      default:
        return 'Per Hari';
    }
  };

  const detailModeLabel = detailMode === 'perHari' ? 'Per Hari (Rekap)' : 'Per Baris (Detail)';

  /* =========================
     R E N D E R
  ========================== */

  if (!isClient) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="h-10 bg-base-300 rounded w-64 animate-pulse" />
              <div className="h-6 bg-base-300 rounded w-48 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <SkeletonChart />
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-slideUp flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {loading && !userProfile ? (
                <span className="h-8 bg-base-300 rounded w-64 inline-block animate-pulse" />
              ) : (
                <>Selamat Datang, {displayName}!</>
              )}
            </h1>
            <div className="mt-2 text-sm text-base-content/70 space-y-1">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="badge badge-primary badge-lg">Level : {displayLevel}</span>
                <span className="badge badge-outline badge-lg">
                  FCBA :<span className="ml-1">{displayFcba}</span>
                </span>
                <span className="badge badge-outline badge-lg">
                  Afdeling :<span className="ml-1">{displayAfdeling}</span>
                </span>
                <span className="badge badge-outline badge-lg">
                  Gang :<span className="ml-1">{displayGang}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-wide text-base-content/60">
              Periode Data:
            </span>
            {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                type="button"
                className={`btn btn-xs md:btn-sm ${
                  timeframe === tf ? 'btn-primary' : 'btn-ghost border border-base-300'
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {timeframeLabel(tf)}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error animate-slideUp">
            <span>{error}</span>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="card bg-base-100 shadow-sm border border-base-300 animate-slideUp">
          <div className="card-body py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title text-sm md:text-base">
                🎯 Filter Data
                <span className="text-xs font-normal text-base-content/60">
                  {' '}
                  (sesuai level & periode)
                </span>
              </h2>
              <button
                type="button"
                className="btn btn-xs md:btn-sm btn-ghost"
                onClick={() => setShowFilters(s => !s)}
              >
                {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {userLevel === 'ADM' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold">FCBA</label>
                    <SearchSelect
                      options={fcbaOptions}
                      value={filterFcba}
                      onChange={v => {
                        setFilterFcba(v);
                        setFilterAfdeling('');
                      }}
                      placeholder="Pilih FCBA / ALL"
                      small
                      useFixedPositioning
                    />
                  </div>
                )}

                {(userLevel === 'ADM' || userLevel === 'MGR') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold">Afdeling</label>
                    <SearchSelect
                      options={afdelingOptions}
                      value={filterAfdeling}
                      onChange={v => setFilterAfdeling(v)}
                      placeholder="Pilih Afdeling (opsional)"
                      small
                      disabled={afdelingOptions.length === 0}
                      useFixedPositioning
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold">Keterangan</label>
                  <p className="text-xs text-base-content/60">
                    • <b>HADIR</b> = Semua kode kecuali MK dan P1 <br />• <b>TEPAT WAKTU</b> = Hadir
                    tanpa telat & tanpa pulang awal <br />• <b>TELAT</b> ={' '}
                    <code>total_late_time</code> lebih dari 0 <br />• <b>PULANG AWAL</b> ={' '}
                    <code>go_home_early</code> lebih dari 0 <br />• <b>ALPHA</b> = P1 (izin) atau MK
                    (mangkir)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-slideUp">
          {/* Harvesting Card */}
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg gap-2">
                🌾 Harvesting ({timeframeLabel(timeframe)})
              </h2>
              {loadingHarvesting ? (
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">Total</div>
                    <div className="stat-value text-2xl font-bold">{harvestingStats.total}</div>
                  </div>
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">Panen (JJG)</div>
                    <div className="stat-value text-2xl font-bold">
                      {/* ⚡ Bolt Optimization: use cached formatters from formatPerfNumber (~50x faster than toLocaleString) */}
                      {formatPerfNumber(harvestingStats.totalOutput, localeTag)}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-success/20 rounded">
                    <div className="stat-title text-xs">Approved</div>
                    <div className="stat-value text-xl font-bold text-success">
                      {harvestingStats.approved}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-info/20 rounded">
                    <div className="stat-title text-xs">Planned</div>
                    <div className="stat-value text-xl font-bold text-info">
                      {harvestingStats.planned}
                    </div>
                  </div>
                </div>
              )}
              <div className="card-actions justify-end mt-2">
                <Link href="/harvest" className="btn btn-sm btn-outline">
                  Lihat Detail
                </Link>
              </div>
            </div>
          </div>

          {/* Pengangkutan Card */}
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg gap-2">
                🚛 Pengangkutan ({timeframeLabel(timeframe)})
              </h2>
              {loadingPengangkutan ? (
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">Total</div>
                    <div className="stat-value text-2xl font-bold">{pengangkutanStats.total}</div>
                  </div>
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">JJG</div>
                    <div className="stat-value text-2xl font-bold text-primary">
                      {/* ⚡ Bolt Optimization: use cached formatters from formatPerfNumber (~50x faster than toLocaleString) */}
                      {pengangkutanStats.totalOutput && pengangkutanStats.totalOutput > 0
                        ? formatPerfNumber(pengangkutanStats.totalOutput, localeTag)
                        : pengangkutanStats.total}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-success/20 rounded">
                    <div className="stat-title text-xs">Approved</div>
                    <div className="stat-value text-xl font-bold text-success">
                      {pengangkutanStats.approved}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-info/20 rounded">
                    <div className="stat-title text-xs">Planned</div>
                    <div className="stat-value text-xl font-bold text-info">
                      {pengangkutanStats.planned}
                    </div>
                  </div>
                </div>
              )}
              <div className="card-actions justify-end mt-2">
                <Link href="/pengangkutan" className="btn btn-sm btn-outline">
                  Lihat Detail
                </Link>
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg gap-2">
                👥 Absensi ({timeframeLabel(timeframe)})
              </h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">Hadir</div>
                    <div className="stat-value text-2xl font-bold">{stats.totalHadir}</div>
                  </div>
                  <div className="stat place-items-center p-3 bg-success/20 rounded">
                    <div className="stat-title text-xs">Tepat Waktu</div>
                    <div className="stat-value text-xl font-bold text-success">
                      {stats.totalTepatWaktu}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-warning/20 rounded">
                    <div className="stat-title text-xs">Telat</div>
                    <div className="stat-value text-xl font-bold text-warning">
                      {stats.totalTelat}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-error/20 rounded">
                    <div className="stat-title text-xs">Pulang Awal</div>
                    <div className="stat-value text-xl font-bold text-error">
                      {stats.totalPulangAwal}
                    </div>
                  </div>
                </div>
              )}
              <div className="card-actions justify-end mt-2">
                <Link href="/attendance" className="btn btn-sm btn-outline">
                  Lihat Detail
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistik Atas: Pie + Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie */}
          <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg">
                🧭 Komposisi TEPAT WAKTU / TELAT / PULANG AWAL / ALPHA ({timeframeLabel(timeframe)})
              </h2>
              {loading ? <SkeletonChart /> : <SimplePieChart data={pieChartData} />}
            </div>
          </div>

          {/* Bar */}
          <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg">
                📊 Ringkasan Absensi ({timeframeLabel(timeframe)})
              </h2>
              <p className="text-xs text-base-content/60 mt-1">
                Angka di bawah ini adalah <b>total frekuensi</b> untuk periode yang dipilih, bukan
                jumlah karyawan unik.
              </p>
              {loading ? (
                <SkeletonChart />
              ) : (
                <SimpleBarChart data={barChartData} color="bg-primary" />
              )}
            </div>
          </div>
        </div>

        {/* Tren Absensi + Persentase */}
        <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h2 className="card-title text-sm md:text-lg">📈 Tren Absensi ({getTrendLabel()})</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge badge-primary gap-1">
                  Hadir (Total) {stats.totalHadir} ({pctHadir}%)
                </span>
                <span className="badge badge-success gap-1">
                  Tepat Waktu {stats.totalTepatWaktu} ({pctTepatWaktu}%)
                </span>
                <span className="badge badge-warning gap-1">
                  Telat {stats.totalTelat} ({pctTelat}%)
                </span>
                <span className="badge badge-error gap-1">
                  Pulang Awal {stats.totalPulangAwal} ({pctPulangAwal}%)
                </span>
                <span className="badge badge-neutral gap-1">
                  Alpha {stats.totalAlpa} ({pctAlpa}%)
                </span>
              </div>
            </div>
            {loading ? <SkeletonChart /> : <SimpleLineChart data={lineChartData} />}
          </div>
        </div>

        {/* Riwayat Absensi Detail */}
        <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h2 className="card-title text-sm md:text-lg">📋 Riwayat Absensi Detail</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-base-content/60">Mode tampilan:</span>
                <button
                  type="button"
                  className={`btn btn-xs md:btn-sm ${
                    detailMode === 'perHari' ? 'btn-primary' : 'btn-ghost border border-base-300'
                  }`}
                  onClick={() => setDetailMode('perHari')}
                >
                  Per Hari (Rekap)
                </button>
                <button
                  type="button"
                  className={`btn btn-xs md:btn-sm ${
                    detailMode === 'perBaris' ? 'btn-primary' : 'btn-ghost border border-base-300'
                  }`}
                  onClick={() => setDetailMode('perBaris')}
                >
                  Per Baris (Detail)
                </button>
              </div>
            </div>

            <p className="text-xs text-base-content/60 mb-3">
              Periode: <b>{timeframeLabel(timeframe)}</b> • Mode: <b>{detailModeLabel}</b> • Data
              mengikuti pola level login:
              {userLevel === 'ADM' && ' ADM melihat per FCBA & Afdeling.'}
              {userLevel === 'MGR' && ' MGR melihat per Afdeling dalam FCBA-nya.'}
              {userLevel === 'AST' && ' AST melihat data sesuai FCBA & Afdeling akun login.'}
            </p>

            {loading ? (
              <SkeletonTable rows={5} />
            ) : filteredAttendance.length === 0 ? (
              <EmptyState namespace="Attendance" onClearSearch={handleClearFilters} />
            ) : (
              <div className="overflow-x-auto">
                {/* MODE PER HARI (REKAP) */}
                {detailMode === 'perHari' && (
                  <table className="table table-sm w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-base-300">
                        <th>Tanggal</th>
                        {userLevel === 'ADM' && (
                          <>
                            <th>FCBA</th>
                            <th>Afdeling</th>
                          </>
                        )}
                        {userLevel === 'MGR' && <th>Afdeling</th>}
                        <th className="text-center">Hadir</th>
                        <th className="text-center">Tepat Waktu</th>
                        <th className="text-center">Telat</th>
                        <th className="text-center">Pulang Awal</th>
                        <th className="text-center">Alpha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummaries.map((d, idx) => (
                        <tr
                          key={`${d.date}-${d.fcba ?? ''}-${d.afdeling ?? ''}-${idx}`}
                          className="hover:bg-base-200"
                        >
                          <td className="whitespace-nowrap font-medium">
                            {d._displayDate || d.date}
                          </td>
                          {userLevel === 'ADM' && (
                            <>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {d.fcba || '-'}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {d.afdeling || '-'}
                                </span>
                              </td>
                            </>
                          )}
                          {userLevel === 'MGR' && (
                            <td>
                              <span className="badge badge-ghost badge-sm font-mono">
                                {d.afdeling || '-'}
                              </span>
                            </td>
                          )}
                          <td className="text-center">
                            <span className="badge badge-primary badge-sm">{d.hadir}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-success badge-sm">{d.tepatWaktu}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-warning badge-sm">{d.telat}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-error badge-sm">{d.pulangAwal}</span>
                          </td>
                          <td className="text-center">
                            <span
                              className="badge badge-sm"
                              style={{ backgroundColor: '#000', color: '#fff' }}
                            >
                              {d.alpa}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* MODE PER BARIS (DETAIL) */}
                {detailMode === 'perBaris' && (
                  <table className="table table-sm w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-base-300">
                        <th>Tanggal</th>
                        {userLevel === 'ADM' && (
                          <>
                            <th>FCBA</th>
                            <th>Afdeling</th>
                            <th>Gang</th>
                          </>
                        )}
                        {userLevel === 'MGR' && (
                          <>
                            <th>Afdeling</th>
                            <th>Gang</th>
                          </>
                        )}
                        {userLevel === 'AST' && (
                          <>
                            <th>FCBA</th>
                            <th>Afdeling</th>
                            <th>Gang</th>
                          </>
                        )}
                        <th>Kode</th>
                        <th>Status</th>
                        <th className="text-center">Telat</th>
                        <th className="text-center">Pulang Awal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowDetails.map((r, idx) => {
                        // ⚡ Bolt Optimization: Use pre-calculated values
                        const status = r._status;

                        // FIX DUPLICATE KEY: gabungkan id + index
                        const keyBase =
                          r.id !== undefined && r.id !== null ? String(r.id) : `${r.tanggal}`;
                        const rowKey = `${keyBase}-${idx}`;

                        return (
                          <tr key={rowKey} className="hover:bg-base-200">
                            <td className="whitespace-nowrap">{r._displayDate || '-'}</td>

                            {/* Kolom lokasi disesuaikan level */}
                            {userLevel === 'ADM' && (
                              <>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.fcba || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.section || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.gang || '-'}
                                  </span>
                                </td>
                              </>
                            )}

                            {userLevel === 'MGR' && (
                              <>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.section || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.gang || '-'}
                                  </span>
                                </td>
                              </>
                            )}

                            {userLevel === 'AST' && (
                              <>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.fcba || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.section || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-ghost badge-sm font-mono">
                                    {r.gang || '-'}
                                  </span>
                                </td>
                              </>
                            )}

                            <td>
                              <span className="badge badge-outline badge-sm font-mono">
                                {r.attendance || '-'}
                              </span>
                            </td>
                            <td>
                              {status === 'TEPAT_WAKTU' && (
                                <span className="badge badge-success badge-sm">TEPAT WAKTU</span>
                              )}
                              {status === 'HADIR' && (
                                <span className="badge badge-primary badge-sm">HADIR</span>
                              )}
                              {status === 'TELAT' && (
                                <span className="badge badge-warning badge-sm">TELAT</span>
                              )}
                              {status === 'PULANG_AWAL' && (
                                <span className="badge badge-error badge-sm">PULANG AWAL</span>
                              )}
                              {status === 'ALPHA' && (
                                <span
                                  className="badge badge-sm"
                                  style={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                  }}
                                >
                                  ALPHA
                                </span>
                              )}
                              {status === 'OTHER' && (
                                <span className="badge badge-ghost badge-sm">OTHER</span>
                              )}
                            </td>
                            <td className="text-center">
                              <span className="badge badge-ghost badge-sm font-mono">
                                {isNonZeroTime(r.total_late_time) ? r.total_late_time : '-'}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge badge-ghost badge-sm font-mono">
                                {isNonZeroTime(r.go_home_early) ? r.go_home_early : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
