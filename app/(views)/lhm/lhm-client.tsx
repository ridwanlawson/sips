'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { SkeletonTable } from '@/app/components/skeletons';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { getTodayISO, formatDateDMY, getYesterdayISO } from '@/utils/datetime';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { exportJsonToCsv } from '@/utils/exportCsv';
import { formatPerfNumber } from '@/utils/perf-formatter';
import { useLocale } from '@/hooks/useLocale';
import { EmptyState } from '@/app/components/empty-state';

/* =========================
   T Y P E h
========================= */
type LhmData = {
  _rowKey?: string;
  // ⚡ Bolt Optimization: cached search values
  _searchContent?: string;
  _jjgNum?: number;
  _brdNum?: number;
  _totalalljjgNum?: number;
  _totalNum?: number;

  id: string;
  rowdata: string;
  fddate: string;
  kemandoran: string;
  level_user_detail: string;
  fcba: string;
  afdeling: string;
  employeecode: string;
  nama: string;
  attendance: string;
  hk: string | null;
  blok: string;
  tahuntanam: string;
  jjg: string;
  brd: string;
  ha: string;
  mentahqty: string;
  mentahrp: string;
  emptybunchqty: string;
  emptybunchrp: string;
  jumlahdenda: string;
  totalalljjg: string;
  basis: string;
  rpbasis: string;
  premilv1: string;
  rate1: string;
  rplv1: string;
  premilv2: string;
  rate2: string;
  rplv2: string;
  premilv3: string;
  rate3: string;
  rplv3: string;
  totalrppremi: string;
  brd_rp: string;
  kurangbasis: string;
  harilibur: string;
  rphk: string;
  total: string;
  under_ripe: string;
  overripe: string;
  abnormal: string;
  long_stalk: string;
  eaten_by_rat: string;
  unharvest_ffb: string;
  uncollect_lf_circle: string;
  uncollect_lf_piece: string;
  unarrange_ffb: string;
  unprune_frond: string;
  qe_1_pelepah_tidak_disusun: string;
  qe_2_buah_matahari: string;
  qe_3_buah_busuk: string;
  qe_4_buah_mentah_diperam: string;
  qe_5_over_pruning: string;
  qe_6_brondolan_tidak_dialas: string;
  qe_7_brondolan_kotor_sampah: string;
  qe_8_buah_dibelah: string;
  qe_9: string;
  qe_10: string;
  fcentry: string;
  fcedit: string;
  fcip: string;
  lastupdate: string;
  lasttime: string;
  qe_11_buah_mentah_a1: string;
  qe_12_buah_tinggal_s: string;
  qe_13_b_ggng_pjg_t_dipotong: string;
  qe_14: string;
  qe_15: string;
  qe_16_buah_mentah_kerani: string;
  qe_17_buah_mentah_mandor: string;
  documentno: string;
};

type Filters = Partial<{
  fddate: string;
  fddate_end: string;
  kemandoran: string;
  employeecode: string;
  fcba: string;
  afdeling: string;
  tahuntanam: string;
  blok: string;
  attendance: string;
}>;

/* =========================
   U T I L h
   ========================= */
const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value).replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

import { cookieStore } from '@/utils/cookieStore';
import { getFilterCriteria, getLockedFields, type UserLevel } from '@/utils/filterHelper';

/* =========================
   M A I N
   ========================= */
export default function Lhm() {
  const localeTag = useLocale();
  const tL = useTranslations('Lhm');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      fddate: yesterday,
      fddate_end: today,
      kemandoran: '',
      employeecode: '',
      fcba: '',
      afdeling: '',
      tahuntanam: '',
      blok: '',
      attendance: '',
    };
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

  const [userLevel, setUserLevel] = useState<UserLevel>('OTHER');
  const [homeFcba, setHomeFcba] = useState<string>('');
  const [homeSection, setHomeSection] = useState<string>('');
  const [homeGang, setHomeGang] = useState<string>('');
  const [userFcbaCookie, setUserFcbaCookie] = useState<string>('');
  const [userAfdelingCookie, setUserAfdelingCookie] = useState<string>('');

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

    const level = cookieStore.getLevel();
    const upperLevel = level.toUpperCase();
    const normalizedLevel = upperLevel === 'ADMIN' ? 'ADM' : upperLevel;
    setUserLevel((normalizedLevel as UserLevel) || 'OTHER');
  }, []);

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
        'lhm'
      );

      // Apply the filter criteria to base filters
      if (filterCriteria.fcba) scopedFilters.fcba = filterCriteria.fcba;
      if (filterCriteria.afdeling) scopedFilters.afdeling = filterCriteria.afdeling;
      if (filterCriteria.kemandoran) scopedFilters.kemandoran = filterCriteria.kemandoran;

      return scopedFilters;
    },
    [userLevel, homeFcba, homeSection, homeGang, userFcbaCookie, userAfdelingCookie]
  );

  const { isFcbaLocked, isAfdelingLocked, isKemandoranLocked } = useMemo(
    () => getLockedFields(userLevel, 'lhm'),
    [userLevel]
  );

  useEffect(() => {
    setFilters(current => {
      const next = getScopedFilters(current);
      setAppliedFilters(prev => prev ?? next);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [getScopedFilters]);

  /* ===== Fetch LHM data ===== */
  const [items, setItems] = useState<LhmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (currentFilters: Filters) => {
      setLoading(true);
      setError(null);
      setItems([]);

      try {
        const params = new URLSearchParams();
        const f = getScopedFilters(currentFilters);

        Object.entries(f).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, v as string);
          }
        });

        const res = await fetch(`/api/lhm${params.toString() ? `?${params}` : ''}`, {
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

        if (!res.ok) {
          const msg = json.message || `HTTP ${res.status}`;
          setError(msg);
          setItems([]);
          return;
        }

        if (json.success && Array.isArray(json.data)) {
          if (json.data.length === 0) {
            // Show the API message when data is empty
            setError(json.message || 'Data tidak ditemukan.');
            setItems([]);
          } else {
            const seen = new Set<string>();
            const data = json.data.map((it: LhmData, idx: number) => {
              const candidate = [
                it.employeecode || '',
                it.kemandoran || '',
                (it.fddate || '').split(' ')[0],
                it.blok || '',
                it.fcba || '',
                it.afdeling || '',
                String(idx),
              ].join('|');
              let key = candidate;
              while (seen.has(key)) key = `${key}_`;
              seen.add(key);

              // ⚡ Bolt Optimization: pre-calculate search content string
              const searchContent = [
                it.employeecode,
                it.nama,
                it.fddate,
                it.kemandoran,
                it.blok,
                it.fcba,
                it.afdeling,
                it.attendance,
                it.tahuntanam,
                it.documentno,
                it.fcentry,
                it.lastupdate,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

              return {
                ...it,
                _rowKey: key,
                _searchContent: searchContent,
                // ⚡ Bolt Optimization: pre-calculate numeric values to avoid redundant regex parsing in loops
                _jjgNum: toNumber(it.jjg),
                _brdNum: toNumber(it.brd),
                _totalalljjgNum: toNumber(it.totalalljjg),
                _totalNum: toNumber(it.total),
              };
            });
            setItems(data);
          }
        } else {
          const msg = json.message || 'Gagal mengambil data';
          setError(msg);
          setItems([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [getScopedFilters]
  );

  useEffect(() => {
    if (appliedFilters && (homeFcba || userLevel === 'ADM')) {
      fetchData(appliedFilters);
    }
  }, [appliedFilters, userLevel, homeFcba, fetchData]);

  /* ===== Quick search ===== */
  // ⚡ Bolt Optimization: Consolidated filtering and totals calculation in a single pass
  // to avoid redundant O(N) loops. This reduces iterations by ~66% during search/filter operations.
  const { filtered, lhmTotals, attendanceExists } = useMemo(() => {
    const s = q.trim().toLowerCase();
    const result: LhmData[] = [];
    const totals = {
      jjg: 0,
      totalalljjg: 0,
      brd: 0,
      total: 0,
    };
    let hasAttendance = false;

    for (const it of items) {
      if (!s || it._searchContent?.includes(s)) {
        result.push(it);

        // ⚡ Bolt Optimization: Use pre-calculated numbers to avoid thousands of O(N*M) toNumber/regex calls during search
        totals.jjg += it._jjgNum || 0;
        totals.totalalljjg += it._totalalljjgNum || 0;
        totals.brd += it._brdNum || 0;
        totals.total += it._totalNum || 0;

        if (s && (it.attendance || '').toLowerCase().includes(s)) {
          hasAttendance = true;
        }
      }
    }

    return {
      filtered: result,
      lhmTotals: totals,
      attendanceExists: !s || hasAttendance,
    };
  }, [q, items]);

  // ⚡ Bolt Optimization: Side-effects (setError) moved out of useMemo to useEffect
  // to preserve existing error-reporting logic while avoiding React render-phase state updates.
  useEffect(() => {
    if (!q || items.length === 0) {
      setError(null);
    } else if (!attendanceExists) {
      setError(`Data dengan attendance "${q}" tidak ditemukan.`);
    } else {
      setError(null);
    }
  }, [q, items.length, attendanceExists]);

  const totalCards = [
    {
      label: 'Total Janjang (JJG)',
      value: lhmTotals.jjg,
      className: 'text-primary',
    },
    {
      label: 'Total Brondolan (BRD)',
      value: lhmTotals.brd,
      className: 'text-success',
    },
    {
      label: 'Total Gaji',
      value: lhmTotals.total,
      className: 'text-warning',
    },
  ];

  /* ===== Export Excel ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      No: idx + 1,
      Tanggal: formatDateDMY(r.fddate),
      Kemandoran: r.kemandoran || '-',
      FCBA: r.fcba || '-',
      Afdeling: r.afdeling || '-',
      'Kode Karyawan': r.employeecode || '-',
      Nama: r.nama || '-',
      Attendance: r.attendance || '-',
      HK: r.hk ?? '-',
      Blok: r.blok || '-',
      'Tahun Tanam': r.tahuntanam || '-',
      JJG: Number(r.jjg || '0'),
      BRD: Number(r.brd || '0'),
      HA: Number(r.ha || '0'),
      MentahQty: Number(r.mentahqty || '0'),
      MentahRp: Number(r.mentahrp || '0'),
      EmptyBunchQty: Number(r.emptybunchqty || '0'),
      EmptyBunchRp: Number(r.emptybunchrp || '0'),
      JumlahDenda: Number(r.jumlahdenda || '0'),
      TotalAllJjg: Number(r.totalalljjg || '0'),
      Basis: Number(r.basis || '0'),
      RpBasis: Number(r.rpbasis || '0'),
      PremiLv1: Number(r.premilv1 || '0'),
      Rate1: Number(r.rate1 || '0'),
      RpLv1: Number(r.rplv1 || '0'),
      PremiLv2: Number(r.premilv2 || '0'),
      Rate2: Number(r.rate2 || '0'),
      RpLv2: Number(r.rplv2 || '0'),
      PremiLv3: Number(r.premilv3 || '0'),
      Rate3: Number(r.rate3 || '0'),
      RpLv3: Number(r.rplv3 || '0'),
      TotalRpPremi: Number(r.totalrppremi || '0'),
      KurangBasis: Number(r.kurangbasis || '0'),
      HariLibur: Number(r.harilibur || '0'),
      RpHK: Number(r.rphk || '0'),
      'Brondolan RP': Number(r.brd_rp || '0'),
      Total: Number(r.total || '0'),
      'Under Ripe': Number(r.under_ripe || '0'),
      Overripe: Number(r.overripe || '0'),
      Abnormal: Number(r.abnormal || '0'),
      'Long Stalk': Number(r.long_stalk || '0'),
      'Eaten by Rat': Number(r.eaten_by_rat || '0'),
      'Unharvest FFB': Number(r.unharvest_ffb || '0'),
      'Uncollect LF Circle': Number(r.uncollect_lf_circle || '0'),
      'Uncollect LF Piece': Number(r.uncollect_lf_piece || '0'),
      'Unarrange FFB': Number(r.unarrange_ffb || '0'),
      'Unprune Frond': Number(r.unprune_frond || '0'),
      'QE1 Pelepah Tidak Disusun': Number(r.qe_1_pelepah_tidak_disusun || '0'),
      'QE2 Buah Matahari': Number(r.qe_2_buah_matahari || '0'),
      'QE3 Buah Busuk': Number(r.qe_3_buah_busuk || '0'),
      'QE4 Buah Mentah Diperam': Number(r.qe_4_buah_mentah_diperam || '0'),
      'QE5 Over Pruning': Number(r.qe_5_over_pruning || '0'),
      'QE6 Brondolan Tidak Dialas': Number(r.qe_6_brondolan_tidak_dialas || '0'),
      'QE7 Brondolan Kotor Sampah': Number(r.qe_7_brondolan_kotor_sampah || '0'),
      'QE8 Buah Dibelah': Number(r.qe_8_buah_dibelah || '0'),
      QE9: Number(r.qe_9 || '0'),
      QE10: Number(r.qe_10 || '0'),
      'QE11 Buah Mentah A1': Number(r.qe_11_buah_mentah_a1 || '0'),
      'QE12 Buah Tinggal S': Number(r.qe_12_buah_tinggal_s || '0'),
      'QE13 B Ggng Pjg T Dipotong': Number(r.qe_13_b_ggng_pjg_t_dipotong || '0'),
      QE14: Number(r.qe_14 || '0'),
      QE15: Number(r.qe_15 || '0'),
      'QE16 Buah Mentah Kerani': Number(r.qe_16_buah_mentah_kerani || '0'),
      'QE17 Buah Mentah Mandor': Number(r.qe_17_buah_mentah_mandor || '0'),
      'Document No': r.documentno || '-',
      'Last Update': r.lastupdate || '-',
      'Last Time': r.lasttime || '-',
    }));

    exportJsonToCsv(dataToExport, `LHM_${filters.fddate}_${filters.fddate_end}.csv`);
  };

  /* ===== Columns ===== */
  const formatNumber = useCallback(
    (val: string | number | null | undefined) => {
      // ⚡ Bolt Optimization: Use cached Intl.NumberFormat via formatPerfNumber
      return formatPerfNumber(val ?? '0', localeTag);
    },
    [localeTag]
  );

  const numCell = useCallback(
    (val: string | number | null | undefined) => {
      const formatted = formatNumber(val);
      return <span className="text-right inline-block w-full text-gray-700">{formatted}</span>;
    },
    [formatNumber]
  );

  const columns: TableColumn<LhmData>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data absensi">Act</span>,
        width: '50px',
        cell: r => {
          const tanggal = (r.fddate || '').split(' ')[0];

          return (
            <div className="space-x-1 whitespace-nowrap">
              {r.fcba && r.fddate && r.kemandoran && (
                <a
                  href={`/lhm/lhm-report?fcba=${r.fcba}&afdeling=${r.afdeling}&tanggal=${tanggal}&kemandoran=${r.kemandoran}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tooltip tooltip-right"
                  data-tip={` Print LHM Kemandoran ${r.kemandoran} `}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="css-i6dzq1"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </a>
              )}
            </div>
          );
        },
        ignoreRowClick: true,
      },
      {
        name: <span title="Nomor urut baris">#</span>,
        width: '70px',
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: <span title="Approval">Next Approval</span>,
        selector: r => r.level_user_detail,
        sortable: true,
        width: '150px',
      },
      {
        name: <span title="Tanggal panen">Tanggal</span>,
        selector: r => (r.fddate || '').split(' ')[0],
        sortable: true,
        width: '125px',
        cell: r => {
          const raw = (r.fddate || '').split(' ')[0];
          return <span title={raw}>{formatDateDMY(raw)}</span>;
        },
      },
      {
        name: <span title="Kemandoran">Kemandoran</span>,
        selector: r => r.kemandoran,
        sortable: true,
        width: '120px',
      },
      {
        name: <span title="Kode Karyawan">Karyawan</span>,
        selector: r => r.employeecode,
        sortable: true,
        width: '180px',
        style: { flexGrow: 2 as number, minWidth: '160px' },
      },
      {
        name: <span title="Nama Karyawan">Nama</span>,
        selector: r => r.nama,
        sortable: true,
        width: '160px',
        style: { flexGrow: 2 as number, minWidth: '140px' },
      },
      {
        name: <span title="Kode Attendance">Att</span>,
        selector: r => r.attendance,
        sortable: true,
        width: '80px',
        cell: r =>
          r.attendance ? <span className="badge badge-sm badge-ghost">{r.attendance}</span> : null,
      },
      {
        name: <span title="Hari Kerja (HK)">HK</span>,
        selector: r => r.hk ?? '-',
        sortable: true,
        width: '65px',
        cell: r => r.hk,
      },
      {
        name: <span title="Kode Blok">Blok</span>,
        selector: r => r.blok,
        sortable: true,
        width: '75px',
      },
      {
        name: <span title="Tahun Tanam">Tahun Tanam</span>,
        selector: r => r.tahuntanam,
        sortable: true,
        width: '80px',
      },
      {
        name: <span title="Janjang (JJG)">JJG</span>,
        selector: r => r._jjgNum ?? 0,
        sortable: true,
        width: '70px',
        cell: r => numCell(r._jjgNum),
      },
      {
        name: <span title="Brondolan (BRD)">BRD</span>,
        selector: r => r._brdNum ?? 0,
        sortable: true,
        width: '70px',
        cell: r => numCell(r._brdNum),
      },
      {
        name: <span title="Hektar (HA)">HA</span>,
        selector: r => r.ha,
        sortable: true,
        width: '65px',
        cell: r => numCell(r.ha),
      },
      {
        name: <span title="Mentah Qty">Mentah-A (Jjg)</span>,
        selector: r => r.mentahqty,
        sortable: true,
        width: '110px',
        cell: r => numCell(r.mentahqty),
      },
      {
        name: <span title="Mentah Rp">Mentah-A (Rp)</span>,
        selector: r => r.mentahrp,
        sortable: true,
        width: '110px',
        cell: r => numCell(r.mentahrp),
      },
      {
        name: <span title="Empty Bunch Qty">E (Jjg)</span>,
        selector: r => r.emptybunchqty,
        sortable: true,
        width: '70px',
        cell: r => numCell(r.emptybunchqty),
      },
      {
        name: (
          <span title="Empty Bunch Rp">
            E <br />
            (Rp)
          </span>
        ),
        selector: r => r.emptybunchrp,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.emptybunchrp),
      },
      {
        name: <span title="Jumlah Denda">Jumlah (Rp)</span>,
        selector: r => r.jumlahdenda,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.jumlahdenda),
      },
      {
        name: <span title="Hasil Netto Jjg">Hasil Netto (Jjg)</span>,
        selector: r => r.totalalljjg,
        sortable: true,
        width: '80px',
        cell: r => numCell(r.totalalljjg),
      },
      {
        name: <span title="Janjang Basis">Basis (Jjg)</span>,
        selector: r => r.basis,
        sortable: true,
        width: '70px',
        cell: r => numCell(r.basis),
      },
      {
        name: <span title="Rupiah Siap Basis">Siap Basis (Rp)</span>,
        selector: r => r.rpbasis,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rpbasis),
      },
      {
        name: <span title="Jumlah Janjang Lebih Basis Level 1">Level 1 Jlh Jjg</span>,
        selector: r => r.premilv1,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.premilv1),
      },
      {
        name: <span title="Rupiah / Janjang Level 1">Level 1 Rp/Jjg</span>,
        selector: r => r.rate1,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rate1),
      },
      {
        name: <span title="Rupiah Level 1">Level 1 Rp</span>,
        selector: r => r.rplv1,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rplv1),
      },
      {
        name: <span title="Jumlah Janjang Lebih Basis Level 2">Level 2 Jlh Jjg</span>,
        selector: r => r.premilv2,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.premilv2),
      },
      {
        name: <span title="Rupiah / Janjang Level 2">Level 2 Rp/Jjg</span>,
        selector: r => r.rate2,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rate2),
      },
      {
        name: <span title="Rupiah Level 2">Level 2 Rp</span>,
        selector: r => r.rplv2,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rplv2),
      },
      {
        name: <span title="Jumlah Janjang Lebih Basis Level 3">Level 3 Jlh Jjg</span>,
        selector: r => r.premilv3,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.premilv3),
      },
      {
        name: <span title="Rupiah / Janjang Level 3">Level 3 Rp/Jjg</span>,
        selector: r => r.rate3,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rate3),
      },
      {
        name: <span title="Rupiah Level 3">Level 3 Rp</span>,
        selector: r => r.rplv3,
        sortable: true,
        width: '85px',
        cell: r => numCell(r.rplv3),
      },
      {
        name: <span title="Jumlah Premi (Rp)">Jumlah Premi (Rp)</span>,
        selector: r => r.totalrppremi,
        sortable: true,
        width: '95px',
        cell: r => numCell(r.totalrppremi),
      },
      {
        name: <span title="Upah Pokok (Rp)">Upah Pokok (Rp)</span>,
        selector: r => r.rphk,
        sortable: true,
        width: '95px',
        cell: r => numCell(r.rphk),
      },
      {
        name: <span title="Tidak Capai Basis (Rp)">Tidak Capai Basis (Rp)</span>,
        selector: r => r.kurangbasis,
        sortable: true,
        width: '95px',
        cell: r => numCell(r.kurangbasis),
      },
      {
        name: <span title="Premi Panen (Rp)">Premi Panen (Rp)</span>,
        selector: r => Number(r.totalrppremi || 0) + Number(r.rpbasis || 0),
        sortable: true,
        width: '95px',
        cell: r => numCell(String(Number(r.totalrppremi || 0) + Number(r.rpbasis || 0))),
      },
      {
        name: <span title="Premi Brondol (Rp)">Premi Brondol (Rp)</span>,
        selector: r => r.brd_rp,
        sortable: true,
        width: '95px',
        cell: r => numCell(r.brd_rp),
      },
      {
        name: <span title="Total">Total</span>,
        selector: r => r._totalNum ?? 0,
        sortable: true,
        width: '100px',
        cell: r => (
          <span className="font-bold w-full text-right inline-block">
            {formatNumber(r._totalNum)}
          </span>
        ),
      },
    ],
    [numCell, formatNumber]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start animate-slideUp">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman LHM (Laporan Harian Mandor)"
          >
            Laporan Harian Mandor (LHM)
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
              onClick={() => fetchData(appliedFilters ?? getScopedFilters(filters))}
              disabled={loading}
              title="Refresh data LHM"
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
              📤 Export
            </button>
          </div>
        </div>

        {/* Quick Search + Total Cards */}
        <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 animate-slideUp [animation-delay:100ms]">
          {/* Total Cards */}
          <div className="flex gap-2 overflow-x-auto flex-1 min-w-0">
            {totalCards.map(card => (
              <div
                key={card.label}
                className="bg-base-100 border border-base-200 rounded-lg px-3 py-2 shadow-sm whitespace-nowrap shrink-0"
              >
                <div className="text-[10px] opacity-70 leading-none">{card.label}</div>
                <div className={`text-sm font-semibold ${card.className}`}>
                  {formatPerfNumber(String(card.value), localeTag)}
                </div>
              </div>
            ))}
          </div>
          <div className="relative w-full sm:w-72 md:w-80 group shrink-0">
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
              placeholder={tL('searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label={tL('quickSearch')}
              title={tL('quickSearch')}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
                aria-label={tL('clearSearch')}
                title={tL('clearSearch')}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Awal"
                value={filters.fddate ?? ''}
                onChange={e => setFilters(s => ({ ...s, fddate: e.target.value }))}
                title="Filter tanggal awal panen"
              />
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Akhir"
                value={filters.fddate_end ?? ''}
                onChange={e => setFilters(s => ({ ...s, fddate_end: e.target.value }))}
                title="Filter tanggal akhir panen"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kemandoran"
                value={filters.kemandoran ?? ''}
                onChange={e => setFilters(s => ({ ...s, kemandoran: e.target.value }))}
                title="Filter berdasarkan kemandoran"
                disabled={isKemandoranLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.employeecode ?? ''}
                onChange={e => setFilters(s => ({ ...s, employeecode: e.target.value }))}
                title="Filter berdasarkan kode karyawan"
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
                title="Filter berdasarkan Afdeling"
                disabled={isAfdelingLocked}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Tahun Tanam"
                value={filters.tahuntanam ?? ''}
                onChange={e => setFilters(s => ({ ...s, tahuntanam: e.target.value }))}
                title="Filter berdasarkan tahun tanam"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Blok"
                value={filters.blok ?? ''}
                onChange={e => setFilters(s => ({ ...s, blok: e.target.value }))}
                title="Filter berdasarkan kode blok"
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
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => setAppliedFilters(getScopedFilters(filters))}
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
                  const yesterday = getYesterdayISO();
                  const today = getTodayISO();
                  const resetFilters: Filters = {
                    fddate: yesterday,
                    fddate_end: today,
                    kemandoran: '',
                    employeecode: '',
                    fcba: '',
                    afdeling: '',
                    tahuntanam: '',
                    blok: '',
                    attendance: '',
                  };
                  const scopedResetFilters = getScopedFilters(resetFilters);
                  setFilters(scopedResetFilters);
                  setAppliedFilters(scopedResetFilters);
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

        {/* Error */}
        {/* Error visual dihilangkan, cukup toast saja yang muncul */}

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
                progressPending={loading}
                pagination
                customStyles={centerHeaderStyle}
                paginationPerPage={100}
                paginationRowsPerPageOptions={[100, 500, 1000, 5000]}
                dense
                highlightOnHover
                fixedHeader
                fixedHeaderScrollHeight="520px"
                persistTableHead
                responsive
                noDataComponent={
                  <EmptyState namespace="Lhm" onClearSearch={q ? () => setQ('') : undefined} />
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
