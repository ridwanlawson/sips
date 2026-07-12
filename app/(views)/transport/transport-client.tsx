'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { cookieStore } from '@/utils/cookieStore';
import { getFilterCriteria, getLockedFields } from '@/utils/filterHelper';
import { formatPerfNumber, formatPerfDate } from '@/utils/perf-formatter';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { fetchBusinessUnits } from '@/utils/businessUnitService';
import { SearchSelect, type Option } from '@/app/components/search-select';
import { QuickSearch } from '@/app/components/quick-search';
import { extractArrayData } from '@/utils/apiHelpers';
import { exportJsonToCsv } from '@/utils/exportCsv';
import { useLocale } from '@/hooks/useLocale';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/app/components/empty-state';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonTable } from '@/app/components/skeletons';
import AppTour from '@/app/components/app-tour';
import type { TourStep } from '@/app/components/app-tour';
import { Icon } from '@/app/components/icons';

/* =========================
   T Y P E S
========================= */
type Pengangkutan = {
  _rowKey?: string;
  // ⚡ Bolt Optimization: cached display and search values
  _displayDate?: string;
  _searchContent?: string;
  _outputNum?: number;
  _janjangnormalNum?: number;
  _mentahNum?: number;
  _abnormalNum?: number;
  _totaljanjangNum?: number;
  _brondolanNum?: number;
  _typeLabel?: string;
  id: string;
  nopengangkutan: string;
  nospb?: string | null;
  nodokumen?: string | null;
  tanggal?: string | null;
  kode_karyawan_kerani?: string | null;
  nama_karyawan_kerani?: string | null;
  kode_karyawan_driver?: string | null;
  nama_karyawan_driver?: string | null;
  tkbm1?: string | null;
  nama_tkbm1?: string | null;
  tkbm2?: string | null;
  nama_tkbm2?: string | null;
  tkbm3?: string | null;
  nama_tkbm3?: string | null;
  tkbm4?: string | null;
  nama_tkbm4?: string | null;
  tkbm5?: string | null;
  nama_tkbm5?: string | null;
  type_pengangkutan?: number | string | null;
  kode_kendaraan?: string | null;
  nama_kendaraan?: string | null;
  fcba?: string | null;
  pabrik_tujuan?: string | null;
  afdeling?: string | null;
  tph?: string | null;
  fieldcode?: string | null;
  fcba_destination?: string | null;
  afdeling_destination?: string | null;
  etd?: string | null;
  eta?: string | null;
  totaljanjang?: string | null;
  output?: string | null;
  janjangnormal?: string | null;
  brondolan?: string | null;
  mentah?: string | null;
  abnormal?: string | null;
  status_pengangkutan?: string | null;
  card_id?: string | null;
  flag?: string | null;
  exception_case?: string | null;
  images?: string | null;
  no_ba_exca?: string | null;
  registrationno?: string | null;
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  nopengangkutan: string;
  nospb: string;
  nodokumen: string;
  kode_karyawan_kerani: string;
  kode_karyawan_driver: string;
  type_pengangkutan: string;
  kode_kendaraan: string;
  fcba: string;
  pabrik_tujuan: string;
  afdeling: string;
  tph: string;
  fieldcode: string;
  status_pengangkutan: string;
  kemandoran: string;
  flag: string;
}>;

type FormState = {
  id: string;
  nopengangkutan: string;
  nospb: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan_kerani: string;
  kode_karyawan_driver: string;
  tkbm1: string;
  tkbm2: string;
  tkbm3: string;
  tkbm4: string;
  tkbm5: string;
  type_pengangkutan: string;
  kode_kendaraan: string;
  tph: string;
  fieldcode: string;
  fcba: string;
  afdeling: string;
  fcba_destination: string;
  afdeling_destination: string;
  pabrik_tujuan: string;
  totaljanjang: string;
  output: string;
  janjangnormal: string;
  brondolan: string;
  mentah: string;
  abnormal: string;
  etd: string;
  card_id: string;
  flag: string;
  exception_case: string;
};

type DeleteTarget = {
  id: string;
  nopengangkutan: string;
};

type MasterUser = {
  fccode?: string;
  idkaryawan?: string;
  fullname?: string;
  fcba?: string;
  afdeling?: string;
  gangcode?: string;
  [key: string]: unknown;
};

const normalizeNonNegative = (value: string) => (value.startsWith('-') ? '0' : value);

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatTotal = (value: number, localeTag = 'id-ID'): string =>
  formatPerfNumber(value, localeTag, { maximumFractionDigits: 2 });

const initialForm: FormState = {
  id: '',
  nopengangkutan: '',
  nospb: '',
  nodokumen: '',
  tanggal: getTodayISO(),
  kode_karyawan_kerani: '',
  kode_karyawan_driver: '',
  tkbm1: '',
  tkbm2: '',
  tkbm3: '',
  tkbm4: '',
  tkbm5: '',
  type_pengangkutan: '',
  kode_kendaraan: '',
  tph: '',
  fieldcode: '',
  fcba: '',
  afdeling: '',
  fcba_destination: '',
  afdeling_destination: '',
  pabrik_tujuan: '',
  totaljanjang: '0',
  output: '0',
  janjangnormal: '0',
  brondolan: '0',
  mentah: '0',
  abnormal: '0',
  etd: '',
  card_id: '',
  flag: '',
  exception_case: '',
};

const formatDateTimeForApi = (value: string) => {
  if (!value) return '';
  const s = value.replace('T', ' ');
  return s.includes(':') && s.split(':').length === 3 ? s : `${s}:00`;
};

/* =========================
   U T I L S
========================= */
import { getTodayISO, getYesterdayISO } from '@/utils/datetime';
const getUserScope = () => ({
  level: cookieStore.getLevel(),
  fcba: cookieStore.getFcba(),
  afdeling: cookieStore.getSection(),
  gang: cookieStore.getGang(),
});

const applyClientUserScope = (params: URLSearchParams) => {
  const { level, fcba, afdeling, gang } = getUserScope();

  const filterCriteria = getFilterCriteria(
    {
      level: (level.toUpperCase() === 'ADMIN' ? 'ADM' : level.toUpperCase()) as
        | 'ADM'
        | 'MGR'
        | 'KSI'
        | 'MD1'
        | 'AST'
        | 'KRT'
        | 'KRA'
        | 'KRP'
        | 'MDP'
        | 'OTHER',
      fcba,
      afdeling,
      gang,
    },
    'transport'
  );

  if (filterCriteria.fcba) params.set('fcba', filterCriteria.fcba);
  if (filterCriteria.afdeling) params.set('afdeling', filterCriteria.afdeling);
  if (filterCriteria.kemandoran) params.set('kemandoran', filterCriteria.kemandoran);
};

/* =========================
   M A I N
========================= */
export default function PengangkutanPage() {
  const localeTag = useLocale();
  const t = useTranslations('Transport');

  const tourSteps: TourStep[] = useMemo(() => [
    {
      icon: '👋',
      title: t('tourWelcomeTitle'),
      content: t('tourWelcomeDesc'),
    },
    {
      icon: '🔍',
      title: t('tourActionsTitle'),
      content: t('tourActionsDesc'),
      targetSelector: '[data-tour="action-buttons"]',
    },
    {
      icon: '🔎',
      title: t('tourSearchTitle'),
      content: t('tourSearchDesc'),
      targetSelector: '[data-tour="quick-search"]',
    },
    {
      icon: '📋',
      title: t('tourFilterTitle'),
      content: t('tourFilterDesc'),
      targetSelector: '[data-tour="filter-button"]',
      modalPosition: 'bottom',
    },
    {
      icon: '📄',
      title: t('tourTableTitle'),
      content: t('tourTableDesc'),
      targetSelector: '[data-tour="data-table"]',
      modalPosition: 'top',
    },
    {
      icon: '➕',
      title: t('tourFormTitle'),
      content: t('tourFormDesc'),
      targetSelector: '[data-tour="add-button"]',
      modalPosition: 'top-left',
    },
  ], [t]);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      tanggal: yesterday,
      tanggal_end: today,
      nopengangkutan: '',
      nospb: '',
      nodokumen: '',
      kode_karyawan_kerani: '',
      kode_karyawan_driver: '',
      type_pengangkutan: '',
      kode_kendaraan: '',
      fcba: '',
      pabrik_tujuan: '',
      afdeling: '',
      tph: '',
      fieldcode: '',
      status_pengangkutan: '',
      kemandoran: '',
      flag: '',
    };
  });

  // Read tanggal/tanggal_end from URL params (from dashboard navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tanggal = params.get('tanggal');
    const tanggal_end = params.get('tanggal_end');
    if (tanggal || tanggal_end) {
      setFilters(prev => ({
        ...prev,
        ...(tanggal ? { tanggal } : {}),
        ...(tanggal_end ? { tanggal_end } : {}),
      }));
    }
  }, []);

  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();
  const [userLevel, setUserLevel] = useState<
    'ADM' | 'MGR' | 'KSI' | 'MD1' | 'AST' | 'KRT' | 'KRA' | 'KRP' | 'MDP' | 'OTHER'
  >('OTHER');
  const canModify = userLevel === 'ADM' || userLevel === 'KSI';
  const [scopeReady, setScopeReady] = useState(false);
  const [homeFcba, setHomeFcba] = useState<string>('');
  const [homeSection, setHomeSection] = useState<string>('');
  const [homeGang, setHomeGang] = useState<string>('');

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [noBaExcaFile, setNoBaExcaFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteFile, setDeleteFile] = useState<File | null>(null);

  const [pabrikOptions, setPabrikOptions] = useState<Array<{ fccode: string; fcname: string }>>([]);
  const [driverOptions, setDriverOptions] = useState<Array<{ fccode: string; fullname: string }>>(
    []
  );
  const [harvestMatched, setHarvestMatched] = useState(false);
  const [harvestSource, setHarvestSource] = useState<{
    fcba: string;
    afdeling: string;
    fieldcode: string;
    tph: string;
    totaljanjang: string;
    output: string;
    brondolan: string;
    mentah: string;
  } | null>(null);
  const [harvestStatus, setHarvestStatus] = useState('');

  const deleteFileRef = useRef<HTMLInputElement | null>(null);
  const harvestFetchTimerRef = useRef<number | null>(null);

  const fetchMasterUsers = async (params: Record<string, string>) => {
    try {
      const url = new URL('/api/master/sips-users', window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
      const res = await fetch(url.toString(), {
        credentials: 'include',
      });
      if (!res.ok) return [] as MasterUser[];
      const json = await res.json();
      return Array.isArray(json.data) ? (json.data as MasterUser[]) : [];
    } catch (err) {
      console.error('Failed to fetch master users', err);
      return [] as MasterUser[];
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [pabrikRows, driverRows] = await Promise.all([
          fetchBusinessUnits({ fctype: 'M' }),
          fetch('/api/karyawans?fcba=CNT', { credentials: 'include' }).then(r =>
            r.ok ? r.json() : { data: [] }
          ),
        ]);

        setPabrikOptions(
          pabrikRows.map(row => ({
            fccode: String(row.fccode || ''),
            fcname: String(row.fcname || ''),
          }))
        );
        setDriverOptions(
          extractArrayData<{ fccode?: string; fcname?: string }>(driverRows)
            .filter(row => row.fccode)
            .map(row => ({
              fccode: String(row.fccode),
              fullname: String(row.fcname || ''),
            }))
        );
      } catch (err) {
        console.warn('Error initializing master data', err);
      }
    };
    init();
  }, []);

  const { data: keraniOptions = [] } = useQuery({
    queryKey: ['kerani-options', form.fcba, homeFcba],
    queryFn: async () => {
      const fcba = form.fcba || homeFcba;
      if (!fcba) return [];
      const rows = await fetchMasterUsers({ level: 'KRT', fcba });
      return rows
        .filter(row => row.idkaryawan)
        .map(row => ({
          idkaryawan: String(row.idkaryawan),
          fullname: String(row.fullname || ''),
          fcba: String(row.fcba || ''),
          afdeling: String(row.afdeling || ''),
          gangcode: String(row.gangcode || ''),
        }));
    },
    enabled: !!(form.fcba || homeFcba) && scopeReady,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  /**
   * ⚡ Bolt Optimization: Use a Map for O(1) kerani lookups by employee ID.
   * This replaces multiple O(N) .find() calls and speeds up data processing.
   */
  const keraniMap = useMemo(() => {
    const map = new Map<
      string,
      {
        idkaryawan: string;
        fullname: string;
        fcba: string;
        afdeling: string;
        gangcode: string;
      }
    >();
    for (const option of keraniOptions) {
      if (option.idkaryawan) map.set(option.idkaryawan, option);
    }
    return map;
  }, [keraniOptions]);

  const { data: kendaraanData = [] } = useQuery({
    queryKey: ['sips-kendaraan'],
    queryFn: async () => {
      const url = new URL('/api/master/sips-kendaraan', window.location.origin);
      url.searchParams.append('vehiclegroupcode', 'DT,TR,MB');
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) return [];
      const json = await res.json();
      return extractArrayData<{ fccode?: string; fcname?: string; registrationno?: string }>(json);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const kendaraanOptionsAsOptions: Option[] = useMemo(
    () =>
      kendaraanData
        .filter(row => row.fccode)
        .map(row => ({
          value: String(row.fccode),
          label: `${String(row.fccode)} - ${String(row.fcname || '')}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [kendaraanData]
  );

  useEffect(() => {
    if (!form.nodokumen?.trim()) {
      setHarvestMatched(false);
      setHarvestSource(null);
      setHarvestStatus('');
      return;
    }

    if (harvestFetchTimerRef.current) {
      window.clearTimeout(harvestFetchTimerRef.current);
    }

    harvestFetchTimerRef.current = window.setTimeout(async () => {
      const dokumen = form.nodokumen.trim();
      setHarvestMatched(false);
      setHarvestSource(null);
      setHarvestStatus('Mencari data dokumen...');

      try {
        const res = await fetch(`/api/harvest?nodokumen=${encodeURIComponent(dokumen)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          setHarvestStatus('Gagal mencari dokumen harvest');
          return;
        }

        const json = await res.json();
        if (!json.ok || !Array.isArray(json.data) || json.data.length === 0) {
          setHarvestStatus('Dokumen tidak ditemukan di harvest');
          return;
        }

        const first = json.data[0];
        const harvestFcba = String(first.fcba || '');
        const harvestAfdeling = String(first.afdeling || '');
        const harvestFieldcode = String(first.fieldcode || '');
        const harvestTph = String(first.tph || '');
        const harvestTotaljanjang = String(first.totaljanjang || first.output || '0');
        const harvestOutput = String(first.output || '0');
        const harvestBrondolan = String(first.brondolan || '0');
        const harvestMentah = String(first.mentah || '0');
        setHarvestSource({
          fcba: harvestFcba,
          afdeling: harvestAfdeling,
          fieldcode: harvestFieldcode,
          tph: harvestTph,
          totaljanjang: harvestTotaljanjang,
          output: harvestOutput,
          brondolan: harvestBrondolan,
          mentah: harvestMentah,
        });

        // ⚡ Bolt Optimization: Use keraniMap for O(1) lookup
        const selectedKerani = keraniMap.get(form.kode_karyawan_kerani);

        if (selectedKerani) {
          if (selectedKerani.fcba === harvestFcba && selectedKerani.afdeling === harvestAfdeling) {
            setForm(current => ({
              ...current,
              fcba: selectedKerani.fcba || harvestFcba,
              afdeling: selectedKerani.afdeling || harvestAfdeling,
              fcba_destination: '',
              afdeling_destination: '',
              fieldcode: harvestFieldcode,
              tph: harvestTph,
              totaljanjang: harvestTotaljanjang,
              output: harvestOutput,
              brondolan: harvestBrondolan,
              mentah: harvestMentah,
            }));
          } else {
            setForm(current => ({
              ...current,
              fcba: selectedKerani.fcba || current.fcba || '',
              afdeling: selectedKerani.afdeling || current.afdeling || '',
              fcba_destination: harvestFcba,
              afdeling_destination: harvestAfdeling,
              fieldcode: harvestFieldcode,
              tph: harvestTph,
              totaljanjang: harvestTotaljanjang,
              output: harvestOutput,
              brondolan: harvestBrondolan,
              mentah: harvestMentah,
            }));
          }
        } else {
          setForm(current => ({
            ...current,
            fcba: harvestFcba,
            afdeling: harvestAfdeling,
            fcba_destination: '',
            afdeling_destination: '',
            fieldcode: harvestFieldcode,
            tph: harvestTph,
            totaljanjang: harvestTotaljanjang,
            output: harvestOutput,
            brondolan: harvestBrondolan,
            mentah: harvestMentah,
          }));
        }

        setHarvestMatched(true);
        setHarvestStatus(`Dokumen ditemukan: ${harvestFcba}/${harvestAfdeling}`);
      } catch (err) {
        console.error('Failed to fetch harvest info', err);
        setHarvestMatched(false);
        setHarvestSource(null);
        setHarvestStatus('Kesalahan saat mencari dokumen harvest');
      }
    }, 500);

    return () => {
      if (harvestFetchTimerRef.current) {
        window.clearTimeout(harvestFetchTimerRef.current);
      }
    };
  }, [form.nodokumen, form.kode_karyawan_kerani, keraniMap]);

  useEffect(() => {
    const selectedKerani = keraniMap.get(form.kode_karyawan_kerani);

    if (harvestMatched && harvestSource) {
      if (
        selectedKerani &&
        selectedKerani.fcba === harvestSource.fcba &&
        selectedKerani.afdeling === harvestSource.afdeling
      ) {
        setForm(current => ({
          ...current,
          fcba: selectedKerani.fcba || harvestSource.fcba,
          afdeling: selectedKerani.afdeling || harvestSource.afdeling,
          fcba_destination: '',
          afdeling_destination: '',
        }));
      } else if (selectedKerani) {
        setForm(current => ({
          ...current,
          fcba: selectedKerani.fcba || harvestSource.fcba,
          afdeling: selectedKerani.afdeling || harvestSource.afdeling,
          fcba_destination: harvestSource.fcba,
          afdeling_destination: harvestSource.afdeling,
        }));
      }
    } else if (selectedKerani) {
      setForm(current => ({
        ...current,
        fcba: selectedKerani.fcba || current.fcba || '',
        afdeling: selectedKerani.afdeling || current.afdeling || '',
      }));
    }
  }, [form.kode_karyawan_kerani, keraniMap, harvestMatched, harvestSource, homeFcba, homeSection]);

  useEffect(() => {
    if (isEditing || !harvestMatched || !form.type_pengangkutan || !form.tanggal) return;

    const fcba = harvestSource?.fcba || form.fcba;
    const afdeling = harvestSource?.afdeling || form.afdeling;
    if (!fcba || !afdeling) return;

    const now = new Date(form.tanggal);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const afdeling2 = afdeling.slice(-2);

    const typeDigit = form.type_pengangkutan;

    const noPengPrefix = `${fcba}${typeDigit}${afdeling2}${month}${year}`;
    const noSpbPrefix = `SPB${fcba}${afdeling2}${month}${year}`;

    const generate = async () => {
      const p = new URLSearchParams();
      const firstDay = `${now.getFullYear()}-${month}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      p.set('tanggal', firstDay);
      p.set('tanggal_end', lastDay);
      const res = await fetch(`/api/transport?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      const rows = (json.data || []) as Array<{
        nopengangkutan?: string;
        nospb?: string;
      }>;

      let maxNoPeng = 0;
      let maxNoSpb = 0;
      for (const row of rows) {
        const rp = parseInt((row.nopengangkutan || '').slice(-5), 10);
        if (!Number.isNaN(rp) && rp > maxNoPeng) maxNoPeng = rp;
        const rs = parseInt((row.nospb || '').slice(-5), 10);
        if (!Number.isNaN(rs) && rs > maxNoSpb) maxNoSpb = rs;
      }

      const nextNoPeng = maxNoPeng + 1;
      const nextNoSpb = maxNoSpb + 1;

      setForm(current => ({
        ...current,
        nopengangkutan: `${noPengPrefix}${String(nextNoPeng).padStart(5, '0')}`,
        nospb:
          typeDigit === '2' ? `${noSpbPrefix}${String(nextNoSpb).padStart(5, '0')}` : current.nospb,
      }));
    };

    generate();
  }, [
    isEditing,
    harvestMatched,
    form.type_pengangkutan,
    form.tanggal,
    form.fcba,
    form.afdeling,
    harvestSource,
  ]);

  // Initialize user defaults
  useEffect(() => {
    const { level, fcba, afdeling, gang } = getUserScope();
    setHomeFcba(fcba);
    setHomeSection(afdeling);
    setHomeGang(gang);

    const resolvedLevel =
      level === 'ADM'
        ? 'ADM'
        : ['MGR', 'KSI', 'MD1', 'AST', 'KRT', 'KRA', 'KRP', 'MDP'].includes(level)
          ? (level as 'MGR' | 'KSI' | 'MD1' | 'AST' | 'KRT' | 'KRA' | 'KRP' | 'MDP')
          : 'OTHER';
    setUserLevel(resolvedLevel);
    setScopeReady(true);
  }, []);

  useEffect(() => {
    if (!scopeReady) return;

    const filterCriteria = getFilterCriteria(
      {
        level: userLevel,
        fcba: homeFcba,
        afdeling: homeSection,
        gang: homeGang,
      },
      'transport'
    );

    const newFilters: Filters = {};
    if (filterCriteria.fcba) newFilters.fcba = filterCriteria.fcba;
    if (filterCriteria.afdeling) newFilters.afdeling = filterCriteria.afdeling;
    if (filterCriteria.kemandoran) newFilters.kemandoran = filterCriteria.kemandoran;

    const nextFilters = { ...filters, ...newFilters };
    setFilters(nextFilters);
    // Only run when the account scope changes. Filter field edits are applied by the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeReady, userLevel, homeFcba, homeSection, homeGang]);

  const resetForm = () => {
    const now = new Date();
    const etd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setForm({
      ...initialForm,
      tanggal: getTodayISO(),
      etd,
      fcba: isFcbaLocked ? homeFcba : '',
      afdeling: isAfdelingLocked ? homeSection : '',
    });
    setNoBaExcaFile(null);
    if (deleteFileRef.current) deleteFileRef.current.value = '';
  };

  const openNewRecord = () => {
    if (!canModify) return;
    resetForm();
    setIsEditing(false);
    setOpen(true);
  };

  const openEditRecord = useCallback(
    (row: Pengangkutan) => {
      if (!canModify) return;
      setForm({
        id: row.id,
        nopengangkutan: row.nopengangkutan || '',
        nospb: row.nospb || '',
        nodokumen: row.nodokumen || '',
        tanggal: row.tanggal ? row.tanggal.split(' ')[0] : getTodayISO(),
        kode_karyawan_kerani: row.kode_karyawan_kerani || '',
        kode_karyawan_driver: row.kode_karyawan_driver || '',
        tkbm1: row.tkbm1 || '',
        tkbm2: row.tkbm2 || '',
        tkbm3: row.tkbm3 || '',
        tkbm4: row.tkbm4 || '',
        tkbm5: row.tkbm5 || '',
        type_pengangkutan: row.type_pengangkutan ? String(row.type_pengangkutan) : '',
        kode_kendaraan: row.kode_kendaraan || '',
        tph: row.tph || '',
        fieldcode: row.fieldcode || '',
        fcba: row.fcba || '',
        afdeling: row.afdeling || '',
        fcba_destination: row.fcba_destination || '',
        afdeling_destination: row.afdeling_destination || '',
        pabrik_tujuan: row.pabrik_tujuan || '',
        totaljanjang: row.totaljanjang || '0',
        output: row.output || '0',
        janjangnormal: row.janjangnormal || '0',
        brondolan: row.brondolan || '0',
        mentah: row.mentah || '0',
        abnormal: row.abnormal || '0',
        etd: row.etd ? row.etd.replace(' ', 'T') : '',
        card_id: row.card_id || '',
        flag: row.flag || '',
        exception_case: row.exception_case || '',
      });
      setNoBaExcaFile(null);
      setIsEditing(true);
      setOpen(true);
    },
    [canModify]
  );

  const buildFormData = () => {
    const formData = new FormData();
    const append = (key: string, value: string) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    };
    append('nopengangkutan', form.nopengangkutan);
    append('nospb', form.nospb);
    append('nodokumen', form.nodokumen);
    append('tanggal', form.tanggal);
    append('kode_karyawan_kerani', form.kode_karyawan_kerani);
    append('kode_karyawan_driver', form.kode_karyawan_driver);
    append('tkbm1', form.tkbm1);
    append('tkbm2', form.tkbm2);
    append('tkbm3', form.tkbm3);
    append('tkbm4', form.tkbm4);
    append('tkbm5', form.tkbm5);
    append('type_pengangkutan', form.type_pengangkutan);
    append('kode_kendaraan', form.kode_kendaraan);
    append('tph', form.tph);
    append('fieldcode', form.fieldcode);
    append('fcba', form.fcba);
    append('afdeling', form.afdeling);
    append('fcba_destination', form.fcba_destination);
    append('afdeling_destination', form.afdeling_destination);
    append('pabrik_tujuan', form.pabrik_tujuan);
    append('totaljanjang', form.totaljanjang);
    append('output', form.output);
    append('janjangnormal', form.janjangnormal);
    append('brondolan', form.brondolan);
    append('mentah', form.mentah);
    append('abnormal', form.abnormal);
    append('etd', formatDateTimeForApi(form.etd));
    append('card_id', form.card_id);
    append('flag', form.flag);
    append('exception_case', form.exception_case);
    if (noBaExcaFile) {
      formData.append('no_ba_exca', noBaExcaFile, noBaExcaFile.name);
    }
    return formData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditing && !form.id) {
      toast.error(t('toastIdRequired'));
      return;
    }
    if (!form.nopengangkutan) {
      toast.error(t('toastNoPengangkutanRequired'));
      return;
    }
    if (!form.type_pengangkutan) {
      toast.error(t('toastTypeRequired'));
      return;
    }
    if (!form.kode_karyawan_kerani) {
      toast.error(t('toastKeraniRequired'));
      return;
    }
    if (!form.kode_kendaraan) {
      toast.error(t('toastKendaraanRequired'));
      return;
    }
    if (!form.kode_karyawan_driver) {
      toast.error(t('toastDriverRequired'));
      return;
    }
    if (!form.tkbm1) {
      toast.error(t('toastTkbm1Required'));
      return;
    }
    if (form.nodokumen.trim() && !harvestMatched) {
      toast.error(t('toastNoDokumenInvalid'));
      return;
    }
    if (!noBaExcaFile && !isEditing) {
      toast.error(t('toastBaRequired'));
      return;
    }
    setSubmitLoading(true);
    try {
      const formData = buildFormData();

      // Add CSRF token to FormData
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
      if (csrfToken && !formData.has('_csrf_token')) {
        formData.append('_csrf_token', csrfToken);
      }

      const url = isEditing
        ? `/api/transport/${encodeURIComponent(form.id)}`
        : '/api/transport';
      const method = isEditing ? 'PUT' : 'POST';

      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return;
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || t('toastSaveError'));
      }
      toast.success(isEditing ? t('toastSaveSuccess') : t('toastAddSuccess'));
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['pengangkutan'] });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('toastSaveError'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteFile(null);
    if (deleteFileRef.current) deleteFileRef.current.value = '';
  };

  const handleDeleteRecord = useCallback(
    (row: Pengangkutan) => {
      if (!canModify) return;
      setDeleteTarget({ id: row.id, nopengangkutan: row.nopengangkutan || row.id });
      setDeleteFile(null);
      setDeleteOpen(true);
    },
    [canModify]
  );

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

      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(`/api/transport/${encodeURIComponent(id)}`, {
        method: 'POST',
        body,
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || t('toastDeleteError'));
      }
      return id;
    },
    onSuccess: () => {
      toast.success(t('toastDeleteSuccess'));
      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteFile(null);
      if (deleteFileRef.current) deleteFileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['pengangkutan'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget || !deleteFile) return;
    deleteMutation.mutate({ id: deleteTarget.id, file: deleteFile });
  };

  const handleNoBaExcaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      toast.error(t('toastPdfFormat'));
      event.target.value = '';
      setNoBaExcaFile(null);
      return;
    }
    setNoBaExcaFile(file);
  };

  // Lock states based on user level
  const { isFcbaLocked, isAfdelingLocked, isKemandoranLocked } = useMemo(
    () => getLockedFields(userLevel, 'transport'),
    [userLevel]
  );

  const shouldDisableForm = !!form.nodokumen.trim() && !harvestMatched;
  const formDisabled = !form.type_pengangkutan || shouldDisableForm;
  const formBelowNodokumenDisabled =
    !form.type_pengangkutan || !form.nodokumen?.trim() || shouldDisableForm;

  const handleExport = () => {
    if (items.length === 0) {
      toast.error(t('toastNoExportData'));
      return;
    }

    const dataToExport = items.map((r, idx) => ({
      No: idx + 1,
      'No Pengangkutan': r.nopengangkutan || '-',
      'No SPB': r.nospb || '-',
      'No Dokumen': r.nodokumen || '-',
      Tanggal: (r.tanggal || '').split(' ')[0],
      'Kerani Kode': r.kode_karyawan_kerani || '-',
      'Kerani Nama': r.nama_karyawan_kerani || '-',
      'Driver Kode': r.kode_karyawan_driver || '-',
      'Driver Nama': r.nama_karyawan_driver || '-',
      'TKBM1 Kode': r.tkbm1 || '-',
      'TKBM1 Nama': r.nama_tkbm1 || '-',
      'TKBM2 Kode': r.tkbm2 || '-',
      'TKBM2 Nama': r.nama_tkbm2 || '-',
      'TKBM3 Kode': r.tkbm3 || '-',
      'TKBM3 Nama': r.nama_tkbm3 || '-',
      'TKBM4 Kode': r.tkbm4 || '-',
      'TKBM4 Nama': r.nama_tkbm4 || '-',
      'TKBM5 Kode': r.tkbm5 || '-',
      'TKBM5 Nama': r.nama_tkbm5 || '-',
      'Tipe Pengangkutan': r.type_pengangkutan ? String(r.type_pengangkutan) : '-',
      'Kendaraan Kode': r.kode_kendaraan || '-',
      'Kendaraan Nama': r.nama_kendaraan || '-',
      'Kendaraan Plat': r.registrationno || '-',
      FCBA: r.fcba || '-',
      Pabrik: r.pabrik_tujuan || '-',
      Afdeling: r.afdeling || '-',
      'FCBA Tujuan': r.fcba_destination || '-',
      'Afdeling Tujuan': r.afdeling_destination || '-',
      ETD: r.etd || '-',
      ETA: r.eta || '-',
      'Total Janjang': r.totaljanjang || '0',
      Output: r.output || '0',
      'Janjang Normal': r.janjangnormal || '0',
      Brondolan: r.brondolan || '0',
      Mentah: r.mentah || '0',
      Abnormal: r.abnormal || '0',
      Status: r.status_pengangkutan || '-',
      'Card ID': r.card_id || '-',
      Flag: r.flag || '-',
      'Exception Case': r.exception_case || '-',
      'No BA ExcA': r.no_ba_exca || '-',
    }));

    exportJsonToCsv(dataToExport, `Pengangkutan_${getTodayISO()}.csv`);
  };

  const {
    data: items = [],
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: ['pengangkutan', filters, userLevel, homeFcba, homeSection, homeGang],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.tanggal) p.set('tanggal', filters.tanggal);
      if (filters.tanggal_end) p.set('tanggal_end', filters.tanggal_end);
      if (filters.nopengangkutan) p.set('nopengangkutan', filters.nopengangkutan);
      if (filters.nospb) p.set('nospb', filters.nospb);
      if (filters.nodokumen) p.set('nodokumen', filters.nodokumen);
      if (filters.kode_karyawan_kerani) p.set('kode_karyawan_kerani', filters.kode_karyawan_kerani);
      if (filters.kode_karyawan_driver) p.set('kode_karyawan_driver', filters.kode_karyawan_driver);
      if (filters.type_pengangkutan) p.set('type_pengangkutan', filters.type_pengangkutan);
      if (filters.kode_kendaraan) p.set('kode_kendaraan', filters.kode_kendaraan);
      if (filters.fcba) p.set('fcba', filters.fcba);
      if (filters.pabrik_tujuan) p.set('pabrik_tujuan', filters.pabrik_tujuan);
      if (filters.afdeling) p.set('afdeling', filters.afdeling);
      if (filters.tph) p.set('tph', filters.tph);
      if (filters.fieldcode) p.set('fieldcode', filters.fieldcode);
      if (filters.status_pengangkutan) p.set('status_pengangkutan', filters.status_pengangkutan);
      if (filters.kemandoran) p.set('kemandoran', filters.kemandoran);
      if (filters.flag) p.set('flag', filters.flag);
      applyClientUserScope(p);

      const res = await fetch(`/api/transport?${p.toString()}`, {
        credentials: 'include',
      });

      if (res.status === 404) return [];
      if (res.status === 401) {
        await logoutAndRedirect();
        return [];
      }

      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }

      if (!json || !(json.success === true || json.ok === true)) {
        throw new Error(json?.message || json?.error || 'Gagal mengambil data');
      }

      return (json.data || json.rows || []) as Pengangkutan[];
    },
    enabled: scopeReady,
  });

  /**
   * ⚡ Bolt Optimization:
   * 1. Single-pass enrichment to add display labels and search content.
   * 2. Uses formatPerfDate with cached formatters (~50x faster).
   * 3. Ensures UI updates correctly on language change (depends on localeTag and t).
   * 4. Pre-calculates numeric values for correct O(N log N) sorting.
   */
  const enrichedItems = useMemo(() => {
    const seen = new Set<string>();
    return items.map((it, idx) => {
      const dateOnly = (it.tanggal || '').split(' ')[0];
      const displayDate = dateOnly ? formatPerfDate(dateOnly, localeTag) : '-';

      const typeLabel =
        String(it.type_pengangkutan) === '1'
          ? t('typeLangsir')
          : String(it.type_pengangkutan) === '2'
            ? t('typeDirect')
            : it.type_pengangkutan
              ? String(it.type_pengangkutan)
              : '-';

      const searchContent = [
        it.nopengangkutan,
        it.nospb,
        it.nodokumen,
        it.kode_karyawan_kerani,
        it.nama_karyawan_kerani,
        it.kode_karyawan_driver,
        it.nama_karyawan_driver,
        it.tkbm1,
        it.nama_tkbm1,
        it.tkbm2,
        it.nama_tkbm2,
        it.tkbm3,
        it.nama_tkbm3,
        it.tkbm4,
        it.nama_tkbm4,
        it.tkbm5,
        it.nama_tkbm5,
        it.fcba,
        it.afdeling,
        it.fcba_destination,
        it.afdeling_destination,
        it.etd,
        it.eta,
        it.status_pengangkutan,
        it.kode_kendaraan,
        it.nama_kendaraan,
        it.registrationno,
        it.card_id,
        it.exception_case,
        it.no_ba_exca,
        dateOnly,
        displayDate,
        typeLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const candidate = [it.nopengangkutan || '', dateOnly, String(idx)].join('|');
      let key = candidate;
      while (seen.has(key)) key = `${key}_`;
      seen.add(key);

      return {
        ...it,
        _rowKey: key,
        _displayDate: displayDate,
        _searchContent: searchContent,
        _typeLabel: typeLabel,
        _totaljanjangNum: toNumber(it.totaljanjang),
        _outputNum: toNumber(it.output),
        _janjangnormalNum: toNumber(it.janjangnormal),
        _brondolanNum: toNumber(it.brondolan),
        _mentahNum: toNumber(it.mentah),
        _abnormalNum: toNumber(it.abnormal),
      };
    });
  }, [items, localeTag, t]);

  const loading = isLoading || isFetching;

  // Resolve effective TKBM attendance params from selected kerani (avoid duplicate fetches during auto-fill)
  const tkbmAttendanceParams = useMemo(() => {
    // ⚡ Bolt Optimization: Use keraniMap for O(1) lookup
    const selectedKerani = keraniMap.get(form.kode_karyawan_kerani);
    return {
      tanggal: form.tanggal,
      fcba: selectedKerani?.fcba || form.fcba || homeFcba,
      afdeling: selectedKerani?.afdeling || form.afdeling || homeSection,
      gangcode: selectedKerani?.gangcode || homeGang,
    };
  }, [
    form.tanggal,
    form.kode_karyawan_kerani,
    form.fcba,
    form.afdeling,
    keraniMap,
    homeFcba,
    homeSection,
    homeGang,
  ]);

  // TKBM attendance data — fetched from /api/attendance only when kerani is selected
  const { data: tkbmAttendanceData = [], isLoading: isLoadingTkbm } = useQuery({
    queryKey: [
      'tkbm-attendance',
      tkbmAttendanceParams.tanggal,
      tkbmAttendanceParams.fcba,
      tkbmAttendanceParams.afdeling,
      tkbmAttendanceParams.gangcode,
    ],
    queryFn: async () => {
      const { tanggal, fcba, afdeling, gangcode } = tkbmAttendanceParams;
      if (!tanggal || !fcba || !afdeling || !gangcode) return [];

      const params = new URLSearchParams();
      params.append('tanggal', tanggal);
      params.append('fcba', fcba);
      params.append('afdeling', afdeling);
      params.append('kemandoran', gangcode);

      const res = await fetch(`/api/attendance?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const rowsRaw = extractArrayData<Record<string, unknown>>(json);

      const mapEmp = new Map<string, { fccode: string; fullname?: string }>();
      for (const it of rowsRaw) {
        const fccode = String(it.kode_karyawan ?? it.fccode ?? '').trim();
        if (!fccode) continue;
        if (!mapEmp.has(fccode)) {
          mapEmp.set(fccode, {
            fccode,
            fullname: typeof it.namakaryawan === 'string' ? it.namakaryawan : undefined,
          });
        }
      }
      return Array.from(mapEmp.values());
    },
    enabled: !!form.tanggal && !!form.kode_karyawan_kerani && (!!homeFcba || userLevel === 'ADM'),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const tkbmOptions: Option[] = useMemo(() => {
    if (!tkbmAttendanceData.length) return [];
    return tkbmAttendanceData
      .map(e => ({
        value: e.fccode,
        label: e.fullname ? `${e.fccode} - ${e.fullname}` : e.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tkbmAttendanceData]);

  const tkbmOptions2 = useMemo(
    () => tkbmOptions.filter(o => o.value !== form.tkbm1),
    [tkbmOptions, form.tkbm1]
  );
  const tkbmOptions3 = useMemo(
    () => tkbmOptions.filter(o => o.value !== form.tkbm1 && o.value !== form.tkbm2),
    [tkbmOptions, form.tkbm1, form.tkbm2]
  );
  const tkbmOptions4 = useMemo(
    () =>
      tkbmOptions.filter(
        o => o.value !== form.tkbm1 && o.value !== form.tkbm2 && o.value !== form.tkbm3
      ),
    [tkbmOptions, form.tkbm1, form.tkbm2, form.tkbm3]
  );
  const tkbmOptions5 = useMemo(
    () =>
      tkbmOptions.filter(
        o =>
          o.value !== form.tkbm1 &&
          o.value !== form.tkbm2 &&
          o.value !== form.tkbm3 &&
          o.value !== form.tkbm4
      ),
    [tkbmOptions, form.tkbm1, form.tkbm2, form.tkbm3, form.tkbm4]
  );

  const keraniOptionsAsOptions: Option[] = useMemo(
    () =>
      keraniOptions
        .filter(k => k.idkaryawan)
        .map(k => ({
          value: String(k.idkaryawan),
          label: k.fullname ? `${k.idkaryawan} - ${k.fullname}` : String(k.idkaryawan),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [keraniOptions]
  );

  const driverOptionsAsOptions: Option[] = useMemo(
    () =>
      driverOptions
        .filter(d => d.fccode)
        .map(d => ({
          value: d.fccode,
          label: `${d.fccode} - ${d.fullname}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [driverOptions]
  );

  // Show toast on error
  useEffect(() => {
    if (queryError) {
      const msg =
        typeof queryError === 'string'
          ? queryError
          : queryError instanceof Error
            ? queryError.message
            : t('toastFetchError');
      toast.error(msg);
    }
  }, [queryError, t]);

  /* ===== Quick search lokal & Totals ===== */
  // ⚡ Bolt Optimization: Consolidate filtering and totals calculation into a single-pass O(N) loop.
  const { filtered, totals } = useMemo(() => {
    const s = q.trim().toLowerCase();
    const result: (Pengangkutan & { _index: number })[] = [];
    const t = {
      totaljanjang: 0,
      brondolan: 0,
    };

    for (const it of enrichedItems) {
      if (!s || it._searchContent?.includes(s)) {
        result.push({ ...it, _index: result.length + 1 });

        // ⚡ Bolt Optimization: Use pre-calculated numbers to avoid thousands of O(N*M) toNumber/regex calls during search
        t.totaljanjang += it._totaljanjangNum || 0;
        t.brondolan += it._brondolanNum || 0;
      }
    }

    return { filtered: result, totals: t };
  }, [q, enrichedItems]);

  const totalCards = [
    {
      label: t('totalJanjang'),
      value: totals.totaljanjang,
      className: 'text-primary',
    },
    {
      label: t('totalBrondolan'),
      value: totals.brondolan,
      className: 'text-success',
    },
  ];

  const columns: TableColumn<Pengangkutan & { _index: number }>[] = useMemo(
    () => [
      {
        name: <span title={t('colAksiTooltip')}>{t('colAksi')}</span>,
        width: '130px',
        style: { justifyContent: 'center' },
        cell: r => (
          <div className="flex flex-wrap gap-2 justify-center">
            {canModify && (
              <>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => openEditRecord(r)}
                  title="Edit pengangkutan"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-error"
                  onClick={() => handleDeleteRecord(r)}
                  title="Hapus pengangkutan"
                >
                  Hapus
                </button>
              </>
            )}
          </div>
        ),
        ignoreRowClick: true,
      },
      {
        name: <span title={t('colStatusTooltip')}>{t('colStatus')}</span>,
        selector: r => r.status_pengangkutan ?? '-',
        sortable: true,
        width: '120px',
        cell: r => (
          <span
            className={`badge ${
              (r.status_pengangkutan || '').toLowerCase() === 'planned'
                ? 'badge-warning'
                : (r.status_pengangkutan || '').toLowerCase() === 'approved'
                  ? 'badge-success'
                  : 'badge-ghost'
            }`}
          >
            {r.status_pengangkutan ?? '-'}
          </span>
        ),
      },
      {
        name: <span title={t('colNoTooltip')}>{t('colNo')}</span>,
        selector: r => r._index,
        width: '60px',
      },
      {
        name: <span title={t('colNoPengangkutanTooltip')}>{t('colNoPengangkutan')}</span>,
        selector: r => r.nopengangkutan,
        sortable: true,
        width: '200px',
      },
      {
        name: <span title={t('colNoSpbTooltip')}>{t('colNoSpb')}</span>,
        selector: r => r.nospb || '-',
        sortable: true,
        width: '180px',
      },
      {
        name: <span title={t('colNoDokumenTooltip')}>{t('colNoDokumen')}</span>,
        selector: r => r.nodokumen || '-',
        sortable: true,
        width: '250px',
      },
      {
        name: <span title={t('colTanggalTooltip')}>{t('colTanggal')}</span>,
        selector: r => r.tanggal || '-',
        cell: r => r._displayDate || '-',
        sortable: true,
        width: '120px',
      },
      {
        name: <span title={t('colKeraniTooltip')}>{t('colKerani')}</span>,
        selector: r => r.nama_karyawan_kerani || r.kode_karyawan_kerani || '-',
        sortable: true,
        width: '220px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_karyawan_kerani}</div>
            <div className="text-xs text-gray-500">{r.kode_karyawan_kerani}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colDriverTooltip')}>{t('colDriver')}</span>,
        selector: r => r.nama_karyawan_driver || r.kode_karyawan_driver || '-',
        sortable: true,
        width: '220px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_karyawan_driver}</div>
            <div className="text-xs text-gray-500">{r.kode_karyawan_driver}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTkbm1Tooltip')}>{t('colTkbm1')}</span>,
        selector: r => r.nama_tkbm1 || r.tkbm1 || '-',
        sortable: true,
        width: '180px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_tkbm1 || '-'}</div>
            <div className="text-xs text-gray-500">{r.tkbm1 || ''}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTkbm2Tooltip')}>{t('colTkbm2')}</span>,
        selector: r => r.nama_tkbm2 || r.tkbm2 || '-',
        sortable: true,
        width: '180px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_tkbm2 || '-'}</div>
            <div className="text-xs text-gray-500">{r.tkbm2 || ''}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTkbm3Tooltip')}>{t('colTkbm3')}</span>,
        selector: r => r.nama_tkbm3 || r.tkbm3 || '-',
        sortable: true,
        width: '180px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_tkbm3 || '-'}</div>
            <div className="text-xs text-gray-500">{r.tkbm3 || ''}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTkbm4Tooltip')}>{t('colTkbm4')}</span>,
        selector: r => r.nama_tkbm4 || r.tkbm4 || '-',
        sortable: true,
        width: '180px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_tkbm4 || '-'}</div>
            <div className="text-xs text-gray-500">{r.tkbm4 || ''}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTkbm5Tooltip')}>{t('colTkbm5')}</span>,
        selector: r => r.nama_tkbm5 || r.tkbm5 || '-',
        sortable: true,
        width: '180px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_tkbm5 || '-'}</div>
            <div className="text-xs text-gray-500">{r.tkbm5 || ''}</div>
          </div>
        ),
      },
      {
        name: <span title={t('colTypeTooltip')}>{t('colType')}</span>,
        selector: r => r._typeLabel || '-',
        sortable: true,
        width: '90px',
      },
      {
        name: <span title={t('colKendaraanTooltip')}>{t('colKendaraan')}</span>,
        sortable: true,
        width: '200px',
        cell: r => (
          <div>
            <div className="font-bold">{r.nama_kendaraan || r.kode_kendaraan || '-'}</div>
            {r.registrationno && <div className="text-xs text-gray-500">{r.registrationno}</div>}
          </div>
        ),
      },
      {
        name: <span title={t('colFcbaTooltip')}>{t('colFcba')}</span>,
        selector: r => r.fcba || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colPabrikTooltip')}>{t('colPabrik')}</span>,
        selector: r => r.pabrik_tujuan || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colAfdelingTooltip')}>{t('colAfdeling')}</span>,
        selector: r => r.afdeling || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colFieldTooltip')}>{t('colField')}</span>,
        selector: r => r.fieldcode || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: <span title={t('colTphTooltip')}>{t('colTph')}</span>,
        selector: r => r.tph || '-',
        sortable: true,
        width: '80px',
      },
      {
        name: t('colTotalJanjang'),
        selector: r => r._totaljanjangNum || 0,
        sortable: true,
        width: '120px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._totaljanjangNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: t('colOutput'),
        selector: r => r._outputNum || 0,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._outputNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: <span title={t('colJanjangNormalTooltip')}>{t('colJanjangNormal')}</span>,
        selector: r => r._janjangnormalNum || 0,
        sortable: true,
        width: '120px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._janjangnormalNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: <span title={t('colBrondolanTooltip')}>{t('colBrondolan')}</span>,
        selector: r => r._brondolanNum || 0,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._brondolanNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: <span title={t('colMentahTooltip')}>{t('colMentah')}</span>,
        selector: r => r._mentahNum || 0,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._mentahNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: <span title={t('colAbnormalTooltip')}>{t('colAbnormal')}</span>,
        selector: r => r._abnormalNum || 0,
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r._abnormalNum || 0, localeTag)}
          </span>
        ),
      },
      {
        name: <span title={t('colFcbaDestTooltip')}>{t('colFcbaDest')}</span>,
        selector: r => r.fcba_destination || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colAfdelingDestTooltip')}>{t('colAfdelingDest')}</span>,
        selector: r => r.afdeling_destination || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title={t('colExceptionCaseTooltip')}>{t('colExceptionCase')}</span>,
        selector: r => r.exception_case || '-',
        sortable: true,
        width: '200px',
      },
      {
        name: <span title={t('colNoBaExcaTooltip')}>{t('colNoBaExca')}</span>,
        selector: r => r.no_ba_exca || '-',
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r =>
          r.no_ba_exca ? (
            <a
              href={r.no_ba_exca}
              target="_blank"
              rel="noopener noreferrer"
              title={`Lampiran Exception Case | No Dokumen : ${r.nodokumen || '-'} | No Pengangkutan : ${r.nopengangkutan || '-'}`}
            >
              <Icon name="document-attach" className="h-6 w-6 text-primary hover:text-primary-focus transition-colors" />
            </a>
          ) : (
            '-'
          ),
      },
      {
        name: <span title={t('colEtdTooltip')}>{t('colEtd')}</span>,
        selector: r => r.etd || '-',
        sortable: true,
        width: '160px',
      },
      {
        name: <span title={t('colEtaTooltip')}>{t('colEta')}</span>,
        selector: r => r.eta || '-',
        sortable: true,
        width: '160px',
      },
    ],
    [localeTag, canModify, handleDeleteRecord, openEditRecord, t]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start animate-slideUp">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title={t('pageTitleTooltip')}
          >
            {t('pageTitle')}
          </h1>
          <div className="flex justify-start sm:justify-end flex-wrap w-full join" data-tour="action-buttons">
            <AppTour steps={tourSteps} btnClassName="join-item" />
            <button
              className="btn btn-outline btn-sm join-item"
              onClick={() => setShowFilters(s => !s)}
              title={t('filterToggleTooltip')}
              data-tour="filter-button"
            >
              <Icon name="filter" className="h-4 w-4" />
              <span className="hidden sm:inline">{showFilters ? t('hideFilters') : t('showFilters')}</span>
            </button>
            <button
              className={`btn btn-outline btn-sm join-item ${loading ? 'btn-disabled' : ''}`}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['pengangkutan'] })}
              title={t('refreshTooltip')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span className="hidden sm:inline">{t('loading')}</span>
                </>
              ) : (
                <>
                  <Icon name="refresh" className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('refresh')}</span>
                </>
              )}
            </button>
            <button
              className="btn btn-sm btn-outline join-item"
              onClick={handleExport}
              title={t('exportTooltip')}
              disabled={items.length === 0}
            >
              <Icon name="export" className="h-4 w-4" />
              <span className="hidden sm:inline">{t('export')}</span>
            </button>
            {canModify && (
              <button
                className="btn btn-primary btn-sm join-item"
                onClick={openNewRecord}
                title={t('addTransportTooltip')}
                data-tour="add-button"
              >
                <Icon name="plus" className="h-4 w-4" />
                <span className="hidden sm:inline">{t('addTransport')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-col md:flex-row items-center gap-4 animate-slideUp [animation-delay:100ms]">
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
          <div className="ml-auto">
            <QuickSearch
              value={q}
              onChange={setQ}
              placeholder={t('searchPlaceholder')}
              totalCount={items.length}
              filteredCount={filtered.length}
              data-tour="quick-search"
            />
          </div>
        </div>

        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal || ''}
                onChange={e => setFilters(s => ({ ...s, tanggal: e.target.value }))}
                title={t('filterDateStartTooltip')}
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal_end || ''}
                onChange={e => setFilters(s => ({ ...s, tanggal_end: e.target.value }))}
                title={t('filterDateEndTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterNoPengangkutan')}
                value={filters.nopengangkutan || ''}
                onChange={e => setFilters(s => ({ ...s, nopengangkutan: e.target.value }))}
                title={t('filterNoPengangkutanTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterNoSpb')}
                value={filters.nospb || ''}
                onChange={e => setFilters(s => ({ ...s, nospb: e.target.value }))}
                title={t('filterNoSpbTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterNoDokumen')}
                value={filters.nodokumen || ''}
                onChange={e => setFilters(s => ({ ...s, nodokumen: e.target.value }))}
                title={t('filterNoDokumenTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterDriver')}
                value={filters.kode_karyawan_driver || ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_driver: e.target.value,
                  }))
                }
                title={t('filterDriverTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterKerani')}
                value={filters.kode_karyawan_kerani || ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_kerani: e.target.value,
                  }))
                }
                title={t('filterKeraniTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterFcba')}
                value={filters.fcba || ''}
                onChange={e => setFilters(s => ({ ...s, fcba: e.target.value }))}
                disabled={isFcbaLocked}
                title={t('filterFcbaTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterAfdeling')}
                value={filters.afdeling || ''}
                onChange={e => setFilters(s => ({ ...s, afdeling: e.target.value }))}
                disabled={isAfdelingLocked}
                title={t('filterAfdelingTooltip')}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t('filterKemandoran')}
                value={filters.kemandoran || ''}
                onChange={e => setFilters(s => ({ ...s, kemandoran: e.target.value }))}
                disabled={isKemandoranLocked}
                title={t('filterKemandoranTooltip')}
              />
              <select
                className="select select-bordered w-full"
                value={filters.status_pengangkutan || ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    status_pengangkutan: e.target.value,
                  }))
                }
                title={t('filterStatusTooltip')}
              >
                <option value="">{t('filterStatus')}</option>
                <option value="Approved">{t('filterStatusOptionsApproved')}</option>
                <option value="Planned">{t('filterStatusOptionsPlanned')}</option>
                <option value="Completed">{t('filterStatusOptionsCompleted')}</option>
              </select>
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['pengangkutan'] })}
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
                  const reset: Filters = {
                    tanggal: '',
                    tanggal_end: '',
                    nopengangkutan: '',
                    nospb: '',
                    nodokumen: '',
                    kode_karyawan_kerani: '',
                    kode_karyawan_driver: '',
                    fcba: '',
                    afdeling: '',
                    kemandoran: '',
                    status_pengangkutan: '',
                  };
                  // Re-apply locked filters from cookies
                  if (isFcbaLocked && homeFcba) reset.fcba = homeFcba;
                  if (isAfdelingLocked && homeSection) reset.afdeling = homeSection;
                  if (isKemandoranLocked && homeGang) reset.kemandoran = homeGang;
                  setFilters(reset);
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

        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100 animate-slideUp [animation-delay:200ms]" data-tour="data-table">
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
                    namespace="Transport"
                    onClearSearch={q ? () => setQ('') : undefined}
                  />
                }
                progressPending={loading}
              />
            )}
          </div>
        </div>

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
                    aria-label={t('modalClose')}
                    title={t('modalClose')}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <form
                id="pengangkutan-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-12 gap-3 max-h-[80vh] overflow-y-auto"
              >
                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">{t('formTanggal')}</legend>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={form.tanggal}
                      onChange={e => setForm(s => ({ ...s, tanggal: e.target.value }))}
                      disabled={formDisabled}
                      required
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">{t('formTipe')}</legend>
                    <select
                      className="select select-bordered w-full"
                      value={form.type_pengangkutan}
                      onChange={e => setForm(s => ({ ...s, type_pengangkutan: e.target.value }))}
                      disabled={shouldDisableForm}
                      required
                    >
                      <option value="">Pilih tipe</option>
                      <option value="1">Langsir</option>
                      <option value="2">Direct</option>
                    </select>
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">{t('formPabrik')}</legend>
                    <select
                      className="select select-bordered w-full"
                      value={form.pabrik_tujuan}
                      onChange={e => setForm(s => ({ ...s, pabrik_tujuan: e.target.value }))}
                      disabled={formDisabled}
                      required
                    >
                      <option value="">Pilih pabrik</option>
                      {pabrikOptions.map(option => (
                        <option key={option.fccode} value={option.fccode}>
                          {option.fccode} - {option.fcname}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">{t('formKerani')}</legend>
                    <SearchSelect
                      options={keraniOptionsAsOptions}
                      value={form.kode_karyawan_kerani}
                      onChange={v => setForm(s => ({ ...s, kode_karyawan_kerani: v }))}
                      placeholder={keraniOptions.length === 0 ? 'Tidak ada Kerani' : 'Pilih Kerani'}
                      required
                      translationNamespace="Transport"
                    />
                  </fieldset>
                </div>
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formNoDokumen')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nodokumen}
                    onChange={e => setForm(s => ({ ...s, nodokumen: e.target.value }))}
                    disabled={!form.type_pengangkutan}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formNoPengangkutan')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nopengangkutan}
                    readOnly
                    tabIndex={-1}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">{t('formNoSpb')}</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nospb}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>
                {form.nodokumen.trim() ? (
                  <div className="col-span-12">
                    <p className={`text-sm ${harvestMatched ? 'text-success' : 'text-warning'}`}>
                      {harvestStatus}
                    </p>
                  </div>
                ) : null}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">{t('formKendaraan')}</legend>
                  <SearchSelect
                    options={kendaraanOptionsAsOptions}
                    value={form.kode_kendaraan}
                    onChange={v => setForm(s => ({ ...s, kode_kendaraan: v }))}
                    placeholder={
                      kendaraanData.length === 0 ? 'Tidak ada kendaraan' : 'Pilih Kendaraan'
                    }
                    disabled={formBelowNodokumenDisabled}
                    required
                    translationNamespace="Transport"
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">{t('formDriver')}</legend>
                  <SearchSelect
                    options={driverOptionsAsOptions}
                    value={form.kode_karyawan_driver}
                    onChange={v => setForm(s => ({ ...s, kode_karyawan_driver: v }))}
                    placeholder={driverOptions.length === 0 ? 'Tidak ada Driver' : 'Pilih Driver'}
                    disabled={formBelowNodokumenDisabled}
                    required
                    translationNamespace="Transport"
                  />
                </fieldset>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">{t('formTkbm1')}</legend>
                    <SearchSelect
                      options={tkbmOptions}
                      value={form.tkbm1}
                      onChange={v => setForm(s => ({ ...s, tkbm1: v }))}
                      placeholder={
                        !form.tanggal
                          ? 'Isi Tanggal dulu'
                          : !form.kode_karyawan_kerani
                            ? 'Pilih Kerani dulu'
                            : isLoadingTkbm
                              ? 'Memuat TKBM...'
                              : tkbmOptions.length === 0
                                ? 'Tidak ada TKBM'
                                : 'Pilih TKBM'
                      }
                      disabled={
                        formBelowNodokumenDisabled ||
                        !form.tanggal ||
                        !form.kode_karyawan_kerani ||
                        isLoadingTkbm
                      }
                      required
                      translationNamespace="Transport"
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 2</legend>
                    <SearchSelect
                      options={tkbmOptions2}
                      value={form.tkbm2}
                      onChange={v => setForm(s => ({ ...s, tkbm2: v }))}
                      placeholder={
                        !form.tanggal
                          ? 'Isi Tanggal dulu'
                          : !form.kode_karyawan_kerani
                            ? 'Pilih Kerani dulu'
                            : isLoadingTkbm
                              ? 'Memuat TKBM...'
                              : tkbmOptions.length === 0
                                ? 'Tidak ada TKBM'
                                : 'Pilih TKBM'
                      }
                      disabled={
                        formBelowNodokumenDisabled ||
                        !form.tanggal ||
                        !form.kode_karyawan_kerani ||
                        isLoadingTkbm
                      }
                      translationNamespace="Transport"
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 3</legend>
                    <SearchSelect
                      options={tkbmOptions3}
                      value={form.tkbm3}
                      onChange={v => setForm(s => ({ ...s, tkbm3: v }))}
                      placeholder={
                        !form.tanggal
                          ? 'Isi Tanggal dulu'
                          : !form.kode_karyawan_kerani
                            ? 'Pilih Kerani dulu'
                            : isLoadingTkbm
                              ? 'Memuat TKBM...'
                              : tkbmOptions.length === 0
                                ? 'Tidak ada TKBM'
                                : 'Pilih TKBM'
                      }
                      disabled={
                        formBelowNodokumenDisabled ||
                        !form.tanggal ||
                        !form.kode_karyawan_kerani ||
                        isLoadingTkbm
                      }
                      translationNamespace="Transport"
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 4</legend>
                    <SearchSelect
                      options={tkbmOptions4}
                      value={form.tkbm4}
                      onChange={v => setForm(s => ({ ...s, tkbm4: v }))}
                      placeholder={
                        !form.tanggal
                          ? 'Isi Tanggal dulu'
                          : !form.kode_karyawan_kerani
                            ? 'Pilih Kerani dulu'
                            : isLoadingTkbm
                              ? 'Memuat TKBM...'
                              : tkbmOptions.length === 0
                                ? 'Tidak ada TKBM'
                                : 'Pilih TKBM'
                      }
                      disabled={
                        formBelowNodokumenDisabled ||
                        !form.tanggal ||
                        !form.kode_karyawan_kerani ||
                        isLoadingTkbm
                      }
                      translationNamespace="Transport"
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 5</legend>
                    <SearchSelect
                      options={tkbmOptions5}
                      value={form.tkbm5}
                      onChange={v => setForm(s => ({ ...s, tkbm5: v }))}
                      placeholder={
                        !form.tanggal
                          ? 'Isi Tanggal dulu'
                          : !form.kode_karyawan_kerani
                            ? 'Pilih Kerani dulu'
                            : isLoadingTkbm
                              ? 'Memuat TKBM...'
                              : tkbmOptions.length === 0
                                ? 'Tidak ada TKBM'
                                : 'Pilih TKBM'
                      }
                      disabled={
                        formBelowNodokumenDisabled ||
                        !form.tanggal ||
                        !form.kode_karyawan_kerani ||
                        isLoadingTkbm
                      }
                      translationNamespace="Transport"
                    />
                  </fieldset>
                </div>
                <details className="col-span-12" open={false}>
                  <summary className="text-sm font-semibold text-base-content/80 cursor-pointer select-none">
                    Lokasi Asal & Tujuan
                  </summary>
                  <div className="mt-2 border-t border-base-300" />
                  <div className="grid grid-cols-12 gap-3 mt-2">
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">FCBA</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.fcba}
                        readOnly
                      />
                    </fieldset>
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">Afdeling</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.afdeling}
                        readOnly
                      />
                    </fieldset>
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">Field Code</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.fieldcode}
                        readOnly
                      />
                    </fieldset>
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">TPH</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.tph}
                        readOnly
                      />
                    </fieldset>
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">FCBA Tujuan</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.fcba_destination}
                        readOnly
                      />
                    </fieldset>
                    <fieldset className="fieldset col-span-12 md:col-span-3">
                      <legend className="fieldset-legend">Afdeling Tujuan</legend>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.afdeling_destination}
                        readOnly
                      />
                    </fieldset>
                  </div>
                </details>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Total Janjang</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.totaljanjang}
                      onChange={e =>
                        setForm(s => ({ ...s, totaljanjang: normalizeNonNegative(e.target.value) }))
                      }
                      disabled={formBelowNodokumenDisabled}
                      required
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Output</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.output}
                      onChange={e =>
                        setForm(s => ({ ...s, output: normalizeNonNegative(e.target.value) }))
                      }
                      disabled={formBelowNodokumenDisabled}
                      required
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Janjang Normal</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.janjangnormal}
                      onChange={e =>
                        setForm(s => ({
                          ...s,
                          janjangnormal: normalizeNonNegative(e.target.value),
                        }))
                      }
                      disabled={formBelowNodokumenDisabled}
                      required
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Brondolan</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full pointer-events-none select-none"
                      value={form.brondolan}
                      readOnly
                      tabIndex={-1}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Mentah</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full pointer-events-none select-none"
                      value={form.mentah}
                      readOnly
                      tabIndex={-1}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-2">
                    <legend className="fieldset-legend">Abnormal</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.abnormal}
                      onChange={e =>
                        setForm(s => ({ ...s, abnormal: normalizeNonNegative(e.target.value) }))
                      }
                      disabled={formBelowNodokumenDisabled}
                      required
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">ETD</legend>
                    <input
                      type="datetime-local"
                      className="input input-bordered w-full"
                      value={form.etd}
                      readOnly
                      tabIndex={-1}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">BA PDF *</legend>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="file-input file-input-bordered w-full"
                      onChange={handleNoBaExcaChange}
                      required={!isEditing}
                      disabled={formBelowNodokumenDisabled}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">Exception Case</legend>
                    <textarea
                      className="textarea textarea-bordered w-full h-24"
                      value={form.exception_case}
                      onChange={e => setForm(s => ({ ...s, exception_case: e.target.value }))}
                      disabled={formBelowNodokumenDisabled}
                      required
                    />
                  </fieldset>
                </div>
              </form>
              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 bg-base-100 pt-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-t border-base-300">
                <div className="flex flex-wrap gap-2 justify-end">
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                    {t('modalCancel')}
                  </button>
                  <button
                    type="submit"
                    form="pengangkutan-form"
                    className="btn btn-primary"
                    disabled={submitLoading || formBelowNodokumenDisabled}
                  >
                    {submitLoading
                      ? t('modalSaving')
                      : isEditing
                        ? t('modalUpdate')
                        : t('modalSave')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-full sm:max-w-lg mx-2 sm:mx-0">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={closeDeleteModal}
                aria-label={t('modalClose')}
                title={t('modalClose')}
              >
                ✕
              </button>
              <h3 className="font-bold text-xl mb-3">{t('modalDeleteTitle')}</h3>
              <p className="mb-4">
                {t('modalDeleteDesc', { noPengangkutan: deleteTarget?.nopengangkutan ?? '' })}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">
                    <span className="label-text">{t('modalDeleteLabel')}</span>
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="file-input file-input-bordered w-full"
                    ref={deleteFileRef}
                    onChange={e => setDeleteFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn btn-outline" onClick={closeDeleteModal}>
                  {t('modalCancel')}
                </button>
                <button
                  type="button"
                  className={`btn btn-error ${deleteMutation.isPending ? 'btn-disabled' : ''}`}
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending || !deleteFile}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      {t('modalDeleting')}
                    </>
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
