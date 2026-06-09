'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { cookieStore } from '@/utils/cookieStore';
import { getFilterCriteria, getLockedFields } from '@/utils/filterHelper';
import { formatPerfNumber, formatPerfDate } from '@/utils/perf-formatter';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { fetchBusinessUnits } from '@/utils/businessUnitService';
import { fetchAttendanceUpload } from '@/utils/attendanceUploadService';
import { exportJsonToCsv } from '@/utils/exportCsv';
import { useLocale } from '@/hooks/useLocale';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonTable } from '@/app/components/skeletons';

/* =========================
   T Y P E S
========================= */
type Pengangkutan = {
  _rowKey?: string;
  // ⚡ Bolt Optimization: cached display and search values
  _displayDate?: string;
  _searchContent?: string;
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
  fullname?: string;
  fcba?: string;
  afdeling?: string;
  gangcode?: string;
  [key: string]: unknown;
};

const normalizeNonNegative = (value: string) => (value.startsWith('-') ? '0' : value);

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

const formatDateTimeForApi = (value: string) => (value ? value.replace('T', ' ') : '');

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
  const [tkbmOptions, setTkbmOptions] = useState<Array<{ fccode: string; fullname: string }>>([]);
  const [driverOptions, setDriverOptions] = useState<Array<{ fccode: string; fullname: string }>>(
    []
  );
  const [keraniOptions, setKeraniOptions] = useState<Array<MasterUser>>([]);
  const [harvestMatched, setHarvestMatched] = useState(false);
  const [harvestSource, setHarvestSource] = useState<{ fcba: string; afdeling: string } | null>(
    null
  );
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
          fetchMasterUsers({ fcba: 'CNT' }),
        ]);

        setPabrikOptions(
          pabrikRows.map(row => ({
            fccode: String(row.fccode || ''),
            fcname: String(row.fcname || ''),
          }))
        );
        setDriverOptions(
          driverRows.map(row => ({
            fccode: String(row.fccode || ''),
            fullname: String(row.fullname || ''),
          }))
        );
      } catch (err) {
        console.warn('Error initializing master data', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const loadKeraniOptions = async () => {
      try {
        const params: Record<string, string> = {
          level: 'KRT',
          fcba: form.fcba || homeFcba,
          afdeling: form.afdeling || homeSection,
        };
        const hasFilter = params.fcba || params.afdeling;
        if (!hasFilter) {
          setKeraniOptions([]);
          return;
        }
        const rows = await fetchMasterUsers(params);
        setKeraniOptions(
          rows.map(row => ({
            fccode: String(row.fccode || ''),
            fullname: String(row.fullname || ''),
            fcba: String(row.fcba || ''),
            afdeling: String(row.afdeling || ''),
            gangcode: String(row.gangcode || ''),
          }))
        );
      } catch (err) {
        console.error('Failed fetching kerani options', err);
      }
    };

    loadKeraniOptions();
  }, [form.fcba, form.afdeling, homeFcba, homeSection]);

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
        setHarvestSource({ fcba: harvestFcba, afdeling: harvestAfdeling });

        const selectedKerani = keraniOptions.find(
          option => option.fccode === form.kode_karyawan_kerani
        );

        if (selectedKerani) {
          if (selectedKerani.fcba === harvestFcba && selectedKerani.afdeling === harvestAfdeling) {
            setForm(current => ({
              ...current,
              fcba: harvestFcba,
              afdeling: harvestAfdeling,
              fcba_destination: '',
              afdeling_destination: '',
            }));
          } else {
            setForm(current => ({
              ...current,
              fcba: selectedKerani.fcba || current.fcba || '',
              afdeling: selectedKerani.afdeling || current.afdeling || '',
              fcba_destination: harvestFcba,
              afdeling_destination: harvestAfdeling,
            }));
          }
        } else {
          setForm(current => ({
            ...current,
            fcba: harvestFcba,
            afdeling: harvestAfdeling,
            fcba_destination: '',
            afdeling_destination: '',
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
  }, [form.nodokumen, form.kode_karyawan_kerani, keraniOptions]);

  useEffect(() => {
    let ignore = false;
    const selectedKerani = keraniOptions.find(
      option => option.fccode === form.kode_karyawan_kerani
    );

    if (harvestMatched && harvestSource) {
      if (
        selectedKerani &&
        selectedKerani.fcba === harvestSource.fcba &&
        selectedKerani.afdeling === harvestSource.afdeling
      ) {
        setForm(current => ({
          ...current,
          fcba: harvestSource.fcba,
          afdeling: harvestSource.afdeling,
          fcba_destination: '',
          afdeling_destination: '',
        }));
      } else if (selectedKerani) {
        setForm(current => ({
          ...current,
          fcba: selectedKerani.fcba || current.fcba || '',
          afdeling: selectedKerani.afdeling || current.afdeling || '',
          fcba_destination: harvestSource.fcba,
          afdeling_destination: harvestSource.afdeling,
        }));
      }
    } else if (selectedKerani) {
      setForm(current => ({
        ...current,
        fcba: current.fcba || selectedKerani.fcba || '',
        afdeling: current.afdeling || selectedKerani.afdeling || '',
      }));
    }

    const loadTkbmOptions = async () => {
      const params = {
        tanggal: form.tanggal,
        fcba: selectedKerani?.fcba || form.fcba || homeFcba,
        afdeling: selectedKerani?.afdeling || form.afdeling || homeSection,
        gangcode: selectedKerani?.gangcode || homeGang,
      };

      if (!params.tanggal || !params.fcba || !params.afdeling || !params.gangcode) {
        setTkbmOptions([]);
        return;
      }

      try {
        const response = await fetchAttendanceUpload(params);
        if (ignore) return;
        if (response.success && Array.isArray(response.data)) {
          const uniqueData = Array.from(
            new Map(response.data.map(item => [item.employeecode, item])).values()
          );
          setTkbmOptions(
            uniqueData.map(item => ({
              fccode: String(item.employeecode || ''),
              fullname: String(item.remarks || item.jobcode || ''),
            }))
          );
        } else {
          setTkbmOptions([]);
        }
      } catch (err) {
        console.error('Failed to load TKBM options', err);
        if (!ignore) setTkbmOptions([]);
      }
    };

    loadTkbmOptions();
    return () => {
      ignore = true;
    };
  }, [
    form.kode_karyawan_kerani,
    form.tanggal,
    form.fcba,
    form.afdeling,
    keraniOptions,
    harvestMatched,
    harvestSource,
    homeFcba,
    homeSection,
    homeGang,
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
    setForm({
      ...initialForm,
      tanggal: getTodayISO(),
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
      toast.error('ID pengangkutan tidak tersedia untuk update');
      return;
    }
    if (!form.nopengangkutan) {
      toast.error('No Pengangkutan wajib diisi');
      return;
    }
    if (!form.type_pengangkutan) {
      toast.error('Tipe Pengangkutan wajib dipilih');
      return;
    }
    if (form.nodokumen.trim() && !harvestMatched) {
      toast.error('No Dokumen belum valid atau belum ditemukan di harvest');
      return;
    }
    if (!noBaExcaFile && !isEditing) {
      toast.error('File BA wajib dilampirkan dalam format PDF');
      return;
    }
    setSubmitLoading(true);
    try {
      const formData = buildFormData();
      const url = isEditing
        ? `/api/pengangkutans/${encodeURIComponent(form.id)}`
        : '/api/pengangkutans';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'include',
      });
      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return;
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || 'Gagal menyimpan data');
      }
      toast.success(isEditing ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['pengangkutan'] });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan data');
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
      body.append('ba_deleted', file, file.name);
      const res = await fetch(`/api/pengangkutans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body,
        credentials: 'include',
      });
      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error('Unauthorized');
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || 'Gagal menghapus data');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Data berhasil dihapus');
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
      toast.error('File BA harus berformat PDF');
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

  const handleExport = () => {
    if (items.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
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
      TKBM1: r.tkbm1 || '-',
      TKBM2: r.tkbm2 || '-',
      TKBM3: r.tkbm3 || '-',
      TKBM4: r.tkbm4 || '-',
      TKBM5: r.tkbm5 || '-',
      'Tipe Pengangkutan': r.type_pengangkutan ? String(r.type_pengangkutan) : '-',
      Kendaraan: r.nama_kendaraan || r.kode_kendaraan || '-',
      FCBA: r.fcba || '-',
      Pabrik: r.pabrik_tujuan || '-',
      Afdeling: r.afdeling || '-',
      TPH: r.tph || '-',
      Field: r.fieldcode || '-',
      'FCBA Tujuan': r.fcba_destination || '-',
      'Afdeling Tujuan': r.afdeling_destination || '-',
      ETD: r.etd || '-',
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
    }));

    exportJsonToCsv(dataToExport, `Pengangkutan_${getTodayISO()}.csv`);
  };

  const {
    data: items = [],
    isLoading: loading,
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

      const res = await fetch(`/api/pengangkutans?${p.toString()}`, {
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

      const raw = (json.data || json.rows || []) as Pengangkutan[];
      const seen = new Set<string>();
      return raw.map((it, idx) => {
        const dateOnly = (it.tanggal || '').split(' ')[0];
        // ⚡ Bolt Optimization: pre-calculate display date using cached formatter
        const displayDate = dateOnly ? formatPerfDate(dateOnly, localeTag) : '-';

        // ⚡ Bolt Optimization: pre-calculate search content string
        const searchContent = [
          it.nopengangkutan,
          it.nospb,
          it.nodokumen,
          it.kode_karyawan_kerani,
          it.nama_karyawan_kerani,
          it.kode_karyawan_driver,
          it.nama_karyawan_driver,
          it.fcba,
          it.afdeling,
          it.status_pengangkutan,
          it.kode_kendaraan,
          it.card_id,
          dateOnly,
          displayDate,
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
        };
      });
    },
    enabled: scopeReady,
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

  /* ===== Quick search lokal ===== */
  const filtered = useMemo(() => {
    if (!q.trim()) return items.map((it, idx) => ({ ...it, _index: idx + 1 }));
    const s = q.toLowerCase();
    // ⚡ Bolt Optimization: Use pre-calculated search content for O(1) string check per row
    return items
      .filter(it => it._searchContent?.includes(s))
      .map((it, idx) => ({ ...it, _index: idx + 1 }));
  }, [q, items]);

  const columns: TableColumn<Pengangkutan & { _index: number }>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data pengangkutan">Aksi</span>,
        width: '130px',
        style: { justifyContent: 'center' },
        cell: r => (
          <div className="flex flex-wrap gap-2 justify-center">
            {canModify && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
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
        name: <span title="Status persetujuan pengangkutan (Planned/Approved/dll)">Status</span>,
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
        name: <span title="Nomor urut baris">#</span>,
        selector: r => r._index,
        width: '60px',
      },
      {
        name: <span title="Nomor pengangkutan">No Pengangkutan</span>,
        selector: r => r.nopengangkutan,
        sortable: true,
        width: '200px',
      },
      {
        name: <span title="Nomor SPB">No SPB</span>,
        selector: r => r.nospb || '-',
        sortable: true,
        width: '180px',
      },
      {
        name: <span title="Nomor dokumen">No Dokumen</span>,
        selector: r => r.nodokumen || '-',
        sortable: true,
        width: '250px',
      },
      {
        name: <span title="Tanggal pengangkutan (DD-MM-YYYY)">Tanggal</span>,
        selector: r => r.tanggal || '-',
        cell: r => r._displayDate || '-',
        sortable: true,
        width: '120px',
      },
      {
        name: <span title="Kerani (nama dan kode)">Kerani</span>,
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
        name: <span title="Driver (nama dan kode)">Driver</span>,
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
        name: <span title="Tipe pengangkutan">Type</span>,
        selector: r => String(r.type_pengangkutan || ''),
        sortable: true,
        width: '90px',
        cell: r => {
          if (String(r.type_pengangkutan) === '1') return 'Langsir';
          if (String(r.type_pengangkutan) === '2') return 'Direct';
          return r.type_pengangkutan ? String(r.type_pengangkutan) : '-';
        },
      },
      {
        name: <span title="Kode / Nama kendaraan">Kendaraan</span>,
        selector: r => r.nama_kendaraan || r.kode_kendaraan || '-',
        sortable: true,
        width: '160px',
      },
      {
        name: <span title="FCBA asal (kebun/estate)">FCBA</span>,
        selector: r => r.fcba || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title="Pabrik tujuan">Pabrik</span>,
        selector: r => r.pabrik_tujuan || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title="Afdeling / Section">Afdeling</span>,
        selector: r => r.afdeling || '-',
        sortable: true,
        width: '100px',
      },
      {
        name: <span title="TPH (Tempat Penampungan Hasil)">TPH</span>,
        selector: r => r.tph || '-',
        sortable: true,
        width: '80px',
      },
      {
        name: <span title="Field code">Field</span>,
        selector: r => r.fieldcode || '-',
        sortable: true,
        width: '110px',
      },
      {
        name: 'Total Janjang',
        selector: r => r.totaljanjang || '-',
        sortable: true,
        width: '120px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r.totaljanjang || '0', localeTag)}
          </span>
        ),
      },
      {
        name: 'Output',
        selector: r => r.output || '-',
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">{formatPerfNumber(r.output || '0', localeTag)}</span>
        ),
      },
      {
        name: <span title="Janjang Normal">Janjang Normal</span>,
        selector: r => r.janjangnormal || '-',
        sortable: true,
        width: '120px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r.janjangnormal || '0', localeTag)}
          </span>
        ),
      },
      {
        name: <span title="Brondolan">Brondolan</span>,
        selector: r => r.brondolan || '-',
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r.brondolan || '0', localeTag)}
          </span>
        ),
      },
      {
        name: <span title="Mentah">Mentah</span>,
        selector: r => r.mentah || '-',
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">{formatPerfNumber(r.mentah || '0', localeTag)}</span>
        ),
      },
      {
        name: <span title="Abnormal">Abnormal</span>,
        selector: r => r.abnormal || '-',
        sortable: true,
        width: '100px',
        style: { justifyContent: 'center' },
        cell: r => (
          <span className="text-center w-full">
            {formatPerfNumber(r.abnormal || '0', localeTag)}
          </span>
        ),
      },
      {
        name: 'Card ID',
        selector: r => r.card_id || '-',
        sortable: true,
        width: '150px',
      },
      {
        name: <span title="Foto pendukung pengangkutan (bila ada)">Foto</span>,
        width: '90px',
        cell: r =>
          r.images ? (
            <a
              href={getProxiedImageUrl(r.images)}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka foto"
            >
              <Image
                src={getProxiedImageUrl(r.images) || PLACEHOLDER_IMAGE}
                alt="foto"
                width={40}
                height={40}
                className="rounded-lg ring-1 ring-base-300 object-cover w-10 h-10 bg-base-200"
                unoptimized
              />
            </a>
          ) : (
            '-'
          ),
        ignoreRowClick: true,
      },
    ],
    [localeTag, canModify, handleDeleteRecord, openEditRecord]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start animate-slideUp">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Pengangkutan"
          >
            Transport (Pengangkutan)
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['pengangkutan'] })}
              title="Refresh data pengangkutan"
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
              className="btn btn-sm btn-outline"
              onClick={handleExport}
              title="Ekspor semua data pengangkutan ke CSV"
              disabled={items.length === 0}
            >
              Export
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={openNewRecord}
              title="Tambah pengangkutan baru"
              disabled={!canModify}
            >
              + Tambah Pengangkutan
            </button>
          </div>
        </div>

        <div className="mb-3 flex justify-end animate-slideUp [animation-delay:100ms]">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-50 group-focus-within:text-primary group-focus-within:opacity-100 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
              placeholder={t('searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label={t('quickSearch')}
              title={t('quickSearch')}
            />
            {q && (
              <button
                type="button"
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
                  aria-hidden="true"
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

        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal || ''}
                onChange={e => setFilters(s => ({ ...s, tanggal: e.target.value }))}
                title="Filter tanggal awal pengangkutan"
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal_end || ''}
                onChange={e => setFilters(s => ({ ...s, tanggal_end: e.target.value }))}
                title="Filter tanggal akhir pengangkutan"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Pengangkutan"
                value={filters.nopengangkutan || ''}
                onChange={e => setFilters(s => ({ ...s, nopengangkutan: e.target.value }))}
                title="Filter berdasarkan nomor pengangkutan"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No SPB"
                value={filters.nospb || ''}
                onChange={e => setFilters(s => ({ ...s, nospb: e.target.value }))}
                title="Filter berdasarkan nomor SPB"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Dokumen"
                value={filters.nodokumen || ''}
                onChange={e => setFilters(s => ({ ...s, nodokumen: e.target.value }))}
                title="Filter berdasarkan nomor dokumen harvest"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Driver"
                value={filters.kode_karyawan_driver || ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_driver: e.target.value,
                  }))
                }
                title="Filter berdasarkan kode driver"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kerani"
                value={filters.kode_karyawan_kerani || ''}
                onChange={e =>
                  setFilters(s => ({
                    ...s,
                    kode_karyawan_kerani: e.target.value,
                  }))
                }
                title="Filter berdasarkan kode kerani"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba || ''}
                onChange={e => setFilters(s => ({ ...s, fcba: e.target.value }))}
                disabled={isFcbaLocked}
                title="Filter berdasarkan FCBA"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling || ''}
                onChange={e => setFilters(s => ({ ...s, afdeling: e.target.value }))}
                disabled={isAfdelingLocked}
                title="Filter berdasarkan Afdeling"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kemandoran"
                value={filters.kemandoran || ''}
                onChange={e => setFilters(s => ({ ...s, kemandoran: e.target.value }))}
                disabled={isKemandoranLocked}
                title="Filter berdasarkan Kemandoran"
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
                title="Filter berdasarkan status pengangkutan"
              >
                <option value="">Status</option>
                <option value="Approved">Approved</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? 'btn-disabled' : ''}`}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['pengangkutan'] })}
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
                noDataComponent={<div className="py-8 text-base-content/70">{t('noData')}</div>}
                progressPending={loading}
              />
            )}
          </div>
        </div>

        {open && (
          <div className="modal modal-open">
            <div className="modal-box max-w-5xl relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
              <h3 className="font-bold text-xl mb-3">
                {isEditing ? 'Edit Pengangkutan' : 'Tambah Pengangkutan'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-3">
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">No Pengangkutan *</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nopengangkutan}
                    onChange={e => setForm(s => ({ ...s, nopengangkutan: e.target.value }))}
                    disabled={shouldDisableForm}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">No SPB</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nospb}
                    onChange={e => setForm(s => ({ ...s, nospb: e.target.value }))}
                    disabled={shouldDisableForm}
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">No Dokumen</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.nodokumen}
                    onChange={e => setForm(s => ({ ...s, nodokumen: e.target.value }))}
                  />
                </fieldset>
                {form.nodokumen.trim() ? (
                  <div className="col-span-12">
                    <p className={`text-sm ${harvestMatched ? 'text-success' : 'text-warning'}`}>
                      {harvestStatus}
                    </p>
                  </div>
                ) : null}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Tanggal *</legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.tanggal}
                    onChange={e => setForm(s => ({ ...s, tanggal: e.target.value }))}
                    disabled={shouldDisableForm}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Tipe Pengangkutan *</legend>
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
                  <legend className="fieldset-legend">Kode Kendaraan</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.kode_kendaraan}
                    onChange={e => setForm(s => ({ ...s, kode_kendaraan: e.target.value }))}
                    disabled={shouldDisableForm}
                  />
                </fieldset>
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">TPH</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.tph}
                    onChange={e => setForm(s => ({ ...s, tph: e.target.value }))}
                    disabled={shouldDisableForm}
                  />
                </fieldset>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">Kerani</legend>
                    <input
                      type="text"
                      list="kerani-options"
                      className="input input-bordered w-full"
                      value={form.kode_karyawan_kerani}
                      onChange={e => setForm(s => ({ ...s, kode_karyawan_kerani: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                    <datalist id="kerani-options">
                      {keraniOptions.map(option => (
                        <option key={option.fccode} value={option.fccode}>
                          {option.fccode} - {option.fullname}
                        </option>
                      ))}
                    </datalist>
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">Driver</legend>
                    <input
                      type="text"
                      list="driver-options"
                      className="input input-bordered w-full"
                      value={form.kode_karyawan_driver}
                      onChange={e => setForm(s => ({ ...s, kode_karyawan_driver: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                    <datalist id="driver-options">
                      {driverOptions.map(option => (
                        <option key={option.fccode} value={option.fccode}>
                          {option.fccode} - {option.fullname}
                        </option>
                      ))}
                    </datalist>
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">Card ID</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.card_id}
                      onChange={e => setForm(s => ({ ...s, card_id: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 1</legend>
                    <input
                      type="text"
                      list="tkbm-options"
                      className="input input-bordered w-full"
                      value={form.tkbm1}
                      onChange={e => setForm(s => ({ ...s, tkbm1: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 2</legend>
                    <input
                      type="text"
                      list="tkbm-options"
                      className="input input-bordered w-full"
                      value={form.tkbm2}
                      onChange={e => setForm(s => ({ ...s, tkbm2: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 3</legend>
                    <input
                      type="text"
                      list="tkbm-options"
                      className="input input-bordered w-full"
                      value={form.tkbm3}
                      onChange={e => setForm(s => ({ ...s, tkbm3: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>
                <datalist id="tkbm-options">
                  {tkbmOptions.map(option => (
                    <option key={option.fccode} value={option.fccode}>
                      {option.fccode} - {option.fullname}
                    </option>
                  ))}
                </datalist>
                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 4</legend>
                    <input
                      type="text"
                      list="tkbm-options"
                      className="input input-bordered w-full"
                      value={form.tkbm4}
                      onChange={e => setForm(s => ({ ...s, tkbm4: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">TKBM 5</legend>
                    <input
                      type="text"
                      list="tkbm-options"
                      className="input input-bordered w-full"
                      value={form.tkbm5}
                      onChange={e => setForm(s => ({ ...s, tkbm5: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-4">
                    <legend className="fieldset-legend">Field Code</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.fieldcode}
                      onChange={e => setForm(s => ({ ...s, fieldcode: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">FCBA</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.fcba}
                      onChange={e => setForm(s => ({ ...s, fcba: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Afdeling</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.afdeling}
                      onChange={e => setForm(s => ({ ...s, afdeling: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">FCBA Tujuan</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.fcba_destination}
                      onChange={e => setForm(s => ({ ...s, fcba_destination: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Afdeling Tujuan</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.afdeling_destination}
                      onChange={e => setForm(s => ({ ...s, afdeling_destination: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Pabrik Tujuan</legend>
                    <select
                      className="select select-bordered w-full"
                      value={form.pabrik_tujuan}
                      onChange={e => setForm(s => ({ ...s, pabrik_tujuan: e.target.value }))}
                      disabled={shouldDisableForm}
                    >
                      <option value="">Pilih pabrik</option>
                      {pabrikOptions.map(option => (
                        <option key={option.fccode} value={option.fccode}>
                          {option.fccode} - {option.fcname}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
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
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
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
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
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
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Brondolan</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.brondolan}
                      onChange={e =>
                        setForm(s => ({ ...s, brondolan: normalizeNonNegative(e.target.value) }))
                      }
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">Mentah</legend>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered w-full"
                      value={form.mentah}
                      onChange={e =>
                        setForm(s => ({ ...s, mentah: normalizeNonNegative(e.target.value) }))
                      }
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-3">
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
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-6">
                    <legend className="fieldset-legend">ETD</legend>
                    <input
                      type="datetime-local"
                      className="input input-bordered w-full"
                      value={form.etd}
                      onChange={e => setForm(s => ({ ...s, etd: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 grid grid-cols-12 gap-3">
                  <fieldset className="fieldset col-span-12 md:col-span-6">
                    <legend className="fieldset-legend">BA PDF *</legend>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="file-input file-input-bordered w-full"
                      onChange={handleNoBaExcaChange}
                      required={!isEditing}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                  <fieldset className="fieldset col-span-12 md:col-span-6">
                    <legend className="fieldset-legend">Exception Case</legend>
                    <textarea
                      className="textarea textarea-bordered w-full h-24"
                      value={form.exception_case}
                      onChange={e => setForm(s => ({ ...s, exception_case: e.target.value }))}
                      disabled={shouldDisableForm}
                    />
                  </fieldset>
                </div>

                <div className="col-span-12 flex flex-wrap gap-2 justify-end pt-3 border-t border-base-300">
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitLoading || shouldDisableForm}
                  >
                    {submitLoading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-lg relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={closeDeleteModal}
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
              <h3 className="font-bold text-xl mb-3">Hapus Pengangkutan</h3>
              <p className="mb-4">
                Hapus data pengangkutan <strong>{deleteTarget?.nopengangkutan}</strong>? File BA
                delete wajib dilampirkan.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">
                    <span className="label-text">File BA Delete</span>
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
                  Batal
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
                      Menghapus...
                    </>
                  ) : (
                    'Hapus'
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
