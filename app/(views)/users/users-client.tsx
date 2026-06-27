'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import DataTable from '@/app/components/dynamic-data-table';
import type { TableColumn } from 'react-data-table-component';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkeletonTable } from '@/app/components/skeletons';
import { centerHeaderStyle } from '@/utils/tableHelper';
import { useTranslations } from 'next-intl';
import { SearchSelect, type Option } from '@/app/components/search-select';
import { EmptyState } from '@/app/components/empty-state';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { isUnauthenticatedJson, logoutAndRedirect } from '@/utils/authHelper';
import { extractArrayData, extractSingleData } from '@/utils/apiHelpers';
import { fetchBusinessUnits } from '@/utils/businessUnitService';
import { fetchGangs, fetchSections } from '@/utils/masterDataService';
import type { BusinessUnit } from '@/utils/businessUnitService';
import { cookieStore } from '@/utils/cookieStore';
import { exportJsonToCsv } from '@/utils/exportCsv';

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

type UserStatus = 'Y' | 'N';

type SipsUser = {
  id: number;
  username?: string;
  fullname?: string;
  email?: string;
  phone?: string;
  fcba?: string;
  afdeling?: string;
  gangcode?: string;
  level?: string;
  position?: string;
  idkaryawan?: string;
  photo?: string;
  status?: UserStatus;
};

const LEVEL_OPTIONS: Option[] = [
  { value: 'MGR', label: 'MGR - Manager' },
  { value: 'KSI', label: 'KSI - Kepala Administrator' },
  { value: 'AST', label: 'AST - Asisten' },
  { value: 'MD1', label: 'MD1 - Mandor 1' },
  { value: 'MDP', label: 'MDP - Mandor Panen' },
  { value: 'KRP', label: 'KRP - Kerani Panen' },
  { value: 'KRT', label: 'KRT - Kerani Transport' },
  { value: 'KRA', label: 'KRA - Kerani Afdeling' },
];

const POSITION_OPTIONS: Option[] = [
  { value: 'EM', label: 'EM - Manager' },
  { value: 'KASIE', label: 'KASIE - Kepala Administrator' },
  { value: 'ASISTEN', label: 'ASISTEN - Asisten' },
  { value: 'MANDOR1', label: 'MANDOR1 - Mandor 1' },
  { value: 'MD.PANEN', label: 'MD.PANEN - Mandor Panen' },
  { value: 'KR.PANEN', label: 'KR.PANEN - Kerani Panen' },
  { value: 'KR.TRANS', label: 'KR.TRANS - Kerani Transport' },
  { value: 'KR.AFDELING', label: 'KR.AFDELING - Kerani Afdeling' },
];

function isSipsUser(v: unknown): v is SipsUser {
  if (!v || typeof v !== 'object') return false;
  const u = v as Record<string, unknown>;
  return typeof u.id === 'number' || typeof u.id === 'string';
}

type FormState = {
  username: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
  fcba: string;
  afdeling: string;
  gangcode: string;
  level: string;
  position: string;
  idkaryawan: string;
};

const initialForm: FormState = {
  username: '',
  fullname: '',
  email: '',
  phone: '',
  password: '',
  fcba: '',
  afdeling: '',
  gangcode: '',
  level: '',
  position: '',
  idkaryawan: '',
};

const initialBulkRow: FormState = { ...initialForm, password: '12345678' };

type Filters = Partial<{
  fcba: string;
  afdeling: string;
  gangcode: string;
  level: string;
  position: string;
}>;

export default function UsersClient() {
  const t = useTranslations('Users');
  const queryClient = useQueryClient();
  const searchInputRef = useSearchShortcut();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userLevel, setUserLevel] = useState('');
  const [userFcba, setUserFcba] = useState('');

  const effectiveFilters = useMemo<Filters>(() => {
    if (!userLevel || userLevel === 'ADM' || !userFcba) return filters;
    return { ...filters, fcba: userFcba };
  }, [filters, userLevel, userFcba]);

  const formatFilterParams = useCallback((f: Filters): string => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.append(k, v as string);
    });
    return params.toString();
  }, []);

  const {
    data: users = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['sips-users', effectiveFilters],
    queryFn: async () => {
      const params = formatFilterParams(effectiveFilters);
      const res = await fetch(`/api/master/sips-users${params ? `?${params}` : ''}`, {
        credentials: 'include',
      });
      if (!res.ok) {
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
      return extractArrayData<SipsUser>(json).filter(isSipsUser);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['businessUnits'],
    queryFn: async () => {
      try {
        const bu = await fetchBusinessUnits();
        localStorage.setItem('business_units', JSON.stringify(bu));
        return bu;
      } catch {
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
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const buLookups = useMemo(() => getBusinessUnitLookups(businessUnits), [businessUnits]);

  const fcbaOptions: Option[] = useMemo(() => {
    if (businessUnits.length) {
      return businessUnits
        .map(b => ({ value: b.fccode, label: b.fcname ? `${b.fccode} - ${b.fcname}` : b.fccode }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return Array.from(new Set(users.map(u => u.fcba).filter(Boolean) as string[]))
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [businessUnits, users]);

  const isFcbaRestricted = userLevel !== '' && userLevel !== 'ADM' && !!userFcba;
  const scopedFcbaOptions = useMemo<Option[]>(() => {
    if (!isFcbaRestricted) return fcbaOptions;
    return fcbaOptions.filter(o => o.value === userFcba);
  }, [fcbaOptions, isFcbaRestricted, userFcba]);

  const afdelingFilterOptions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.afdeling).filter(Boolean) as string[]))
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [users]);

  const gangcodeFilterOptions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.gangcode).filter(Boolean) as string[]))
      .sort()
      .map(v => ({ value: v, label: v }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter(u =>
      `${u.username ?? ''} ${u.fullname ?? ''} ${u.email ?? ''} ${u.phone ?? ''} ${u.fcba ?? ''} ${u.afdeling ?? ''} ${u.gangcode ?? ''} ${u.level ?? ''} ${u.position ?? ''} ${u.idkaryawan ?? ''}`
        .toLowerCase()
        .includes(s)
    );
  }, [users, q]);

  // Single add form cascading state
  const [selFcba, setSelFcba] = useState('');
  const [selAfdeling, setSelAfdeling] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);

  const onChangeFcba = (v: string) => {
    setSelFcba(v);
    setSelAfdeling('');
    setForm(s => ({ ...s, fcba: v, afdeling: '', gangcode: '' }));
  };
  const onChangeAfdeling = (v: string) => {
    setSelAfdeling(v);
    setForm(s => ({ ...s, afdeling: v, gangcode: '' }));
  };
  const onChangeGang = (v: string) => {
    setForm(s => ({ ...s, gangcode: v }));
  };

  const selectedFcbaCode = useMemo(
    () => resolveBusinessUnitCode(selFcba, buLookups),
    [selFcba, buLookups]
  );

  const { data: sectionOptions = [] } = useQuery({
    queryKey: ['masterSections', selectedFcbaCode],
    queryFn: async () => {
      if (!selectedFcbaCode) return [];
      const rows = await fetchSections({ fcba: selectedFcbaCode });
      return rows
        .map(s => ({
          value: s.fccode,
          label: s.fcname && s.fcname !== s.fccode ? `${s.fccode} - ${s.fcname}` : s.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!selectedFcbaCode,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: gangOptions = [] } = useQuery({
    queryKey: ['masterGangs', selectedFcbaCode, selAfdeling],
    queryFn: async () => {
      if (!selectedFcbaCode || !selAfdeling) return [];
      const rows = await fetchGangs({ fcba: selectedFcbaCode, afdeling: selAfdeling });
      return rows
        .map(g => ({
          value: g.fccode,
          label: g.fcname && g.fcname !== g.fccode ? `${g.fccode} - ${g.fcname}` : g.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!selectedFcbaCode && !!selAfdeling,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UserStatus }) => {
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
      const res = await fetch(`/api/user/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ status }),
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
      if (!res.ok || !json.ok)
        throw new Error(String(json.message ?? json.error ?? 'Failed to update status'));
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sips-users'] });
      toast.success(t('statusUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        body: formData,
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
      if (!res.ok || !json.ok)
        throw new Error(String(json.message ?? json.error ?? 'Registration failed'));
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sips-users'] });
    },
  });

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<SipsUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Bulk add
  const [bulkRows, setBulkRows] = useState<FormState[]>([{ ...initialBulkRow }]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFcba, setBulkFcba] = useState('');
  const [bulkAfdeling, setBulkAfdeling] = useState('');
  const [bulkGang, setBulkGang] = useState('');

  const selectedBulkFcbaCode = useMemo(
    () => resolveBusinessUnitCode(bulkFcba, buLookups),
    [bulkFcba, buLookups]
  );

  const { data: bulkSectionOptions = [] } = useQuery({
    queryKey: ['masterSections', 'bulk', selectedBulkFcbaCode],
    queryFn: async () => {
      if (!selectedBulkFcbaCode) return [];
      const rows = await fetchSections({ fcba: selectedBulkFcbaCode });
      return rows
        .map(s => ({
          value: s.fccode,
          label: s.fcname && s.fcname !== s.fccode ? `${s.fccode} - ${s.fcname}` : s.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!selectedBulkFcbaCode,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: bulkGangOptions = [] } = useQuery({
    queryKey: ['masterGangs', 'bulk', selectedBulkFcbaCode, bulkAfdeling],
    queryFn: async () => {
      if (!selectedBulkFcbaCode || !bulkAfdeling) return [];
      const rows = await fetchGangs({ fcba: selectedBulkFcbaCode, afdeling: bulkAfdeling });
      return rows
        .map(g => ({
          value: g.fccode,
          label: g.fcname && g.fcname !== g.fccode ? `${g.fccode} - ${g.fcname}` : g.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!selectedBulkFcbaCode && !!bulkAfdeling,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const applyBulkDefaults = () => {
    setBulkRows(prev =>
      prev.map(row => ({
        ...row,
        fcba: bulkFcba || row.fcba,
        afdeling: bulkAfdeling || row.afdeling,
        gangcode: bulkGang || row.gangcode,
      }))
    );
  };

  const handleDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true);
      setDetailOpen(true);
      try {
        const res = await fetch(`/api/user/${id}`, { credentials: 'include' });
        const json: unknown = await res.json();
        const d = extractSingleData<SipsUser>(json) || users.find(u => u.id === id) || null;
        if (!res.ok || !d) throw new Error('Failed to load user details');
        setDetailUser(d);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load user details');
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [users]
  );

  const handleToggleStatus = useCallback(
    (user: SipsUser) => {
      statusMutation.mutate({ id: user.id, status: user.status === 'Y' ? 'N' : 'Y' });
    },
    [statusMutation]
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerMutation.isPending) return;
    if (!form.username || !form.fullname || !form.password) {
      toast.error(t('requiredFields'));
      return;
    }
    if (form.password.length < 8) {
      toast.error(t('passwordLength'));
      return;
    }
    const fd = new FormData();
    fd.append('username', form.username);
    fd.append('fullname', form.fullname);
    if (form.email) fd.append('email', form.email);
    if (form.phone) fd.append('phone', form.phone);
    fd.append('password', form.password);
    const submitFcba = isFcbaRestricted ? userFcba : form.fcba;
    if (submitFcba) fd.append('fcba', submitFcba);
    if (form.afdeling) fd.append('afdeling', form.afdeling);
    if (form.gangcode) fd.append('gangcode', form.gangcode);
    if (form.level) fd.append('level', form.level);
    if (form.position) fd.append('position', form.position);
    if (form.idkaryawan) fd.append('idkaryawan', form.idkaryawan);
    registerMutation.mutate(fd, {
      onSuccess: () => {
        toast.success(t('userAdded'));
        setAddOpen(false);
        setForm(initialForm);
        setSelFcba('');
        setSelAfdeling('');
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const addBulkRow = () => setBulkRows(prev => [...prev, { ...initialBulkRow }]);
  const removeBulkRow = (idx: number) => setBulkRows(prev => prev.filter((_, i) => i !== idx));
  const updateBulkRow = (idx: number, field: keyof FormState, value: string) =>
    setBulkRows(prev => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));

  const handleBulkSubmit = async () => {
    if (bulkLoading) return;
    const validRows = bulkRows.filter(r => r.username && r.fullname && r.password);
    if (validRows.length === 0) {
      toast.error(t('noValidRows'));
      return;
    }
    setBulkLoading(true);
    let success = 0,
      failed = 0;
    for (const row of validRows) {
      const fd = new FormData();
      fd.append('username', row.username);
      fd.append('fullname', row.fullname);
      if (row.email) fd.append('email', row.email);
      if (row.phone) fd.append('phone', row.phone);
      fd.append('password', row.password);
      const rowFcba = isFcbaRestricted ? userFcba : row.fcba;
      if (rowFcba) fd.append('fcba', rowFcba);
      if (row.afdeling) fd.append('afdeling', row.afdeling);
      if (row.gangcode) fd.append('gangcode', row.gangcode);
      if (row.level) fd.append('level', row.level);
      if (row.position) fd.append('position', row.position);
      if (row.idkaryawan) fd.append('idkaryawan', row.idkaryawan);
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const json: Record<string, unknown> = await res.json();
        if (res.ok && json.ok) success++;
        else {
          failed++;
          console.error(`Failed ${row.username}:`, json.message || json.error);
        }
      } catch {
        failed++;
      }
    }
    setBulkLoading(false);
    queryClient.invalidateQueries({ queryKey: ['sips-users'] });
    toast.success(t('bulkResult', { success, failed }));
    if (failed === 0) {
      setBulkOpen(false);
      setBulkRows([{ ...initialBulkRow }]);
      setBulkFcba('');
      setBulkAfdeling('');
      setBulkGang('');
    }
  };

  const resolveSection = useCallback(
    (fcbaCode: string) => buLookups.codeMap.get(fcbaCode)?.fcname || fcbaCode,
    [buLookups]
  );

  const loading = isLoading || isFetching;

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error(t('noData'));
      return;
    }
    const dataToExport = filteredUsers.map((r, idx) => ({
      No: idx + 1,
      [t('username')]: r.username ?? '-',
      [t('fullname')]: r.fullname ?? '-',
      Email: r.email ?? '-',
      [t('phone')]: r.phone ?? '-',
      FCBA: r.fcba ?? '-',
      [t('afdeling')]: r.afdeling ?? '-',
      [t('gangcode')]: r.gangcode ?? '-',
      [t('level')]: r.level ?? '-',
      [t('position')]: r.position ?? '-',
      [t('idkaryawan')]: r.idkaryawan ?? '-',
      [t('status')]: r.status === 'Y' ? t('active') : t('inactive'),
    }));
    exportJsonToCsv(dataToExport, `Users_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns: TableColumn<SipsUser>[] = useMemo(
    () => [
      {
        name: <span className="block text-center w-full">No</span>,
        width: '50px',
        style: { textAlign: 'center' },
        cell: (_row, idx) => <span className="text-base-content/60">{idx + 1}</span>,
      },
      {
        name: <span className="block text-center w-full">{t('actions')}</span>,
        style: { minWidth: '120px', textAlign: 'center' },
        cell: row => (
          <div className="flex gap-0.5">
            <button
              className={`btn btn-xs px-1.5 ${row.status === 'Y' ? 'btn-warning' : 'btn-success'}`}
              onClick={() => handleToggleStatus(row)}
            >
              {row.status === 'Y' ? t('deactivate') : t('activate')}
            </button>
            <button
              className="btn btn-ghost btn-xs px-1"
              onClick={() => handleDetail(row.id)}
              title={t('viewDetail')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        ),
      },
      {
        name: t('username'),
        selector: row => row.username ?? '-',
        sortable: true,
        wrap: true,
        style: { minWidth: '100px' },
      },
      {
        name: t('fullname'),
        selector: row => row.fullname ?? '-',
        sortable: true,
        wrap: true,
        style: { minWidth: '200px' },
      },
      {
        name: t('email'),
        selector: row => row.email ?? '-',
        sortable: true,
        wrap: true,
        style: { minWidth: '130px' },
      },
      {
        name: t('phone'),
        selector: row => row.phone ?? '-',
        sortable: true,
        style: { minWidth: '90px' },
      },
      {
        name: <span className="block text-center w-full">FCBA</span>,
        selector: row => row.fcba ?? '-',
        sortable: true,
        style: { minWidth: '70px', textAlign: 'center' },
      },
      {
        name: t('afdeling'),
        selector: row => row.afdeling ?? '-',
        sortable: true,
        style: { minWidth: '80px' },
      },
      {
        name: t('gangcode'),
        selector: row => row.gangcode ?? '-',
        sortable: true,
        style: { minWidth: '70px' },
      },
      {
        name: <span className="block text-center w-full">{t('level')}</span>,
        selector: row => row.level ?? '-',
        sortable: true,
        style: { minWidth: '70px', textAlign: 'center' },
      },
      {
        name: t('position'),
        selector: row => row.position ?? '-',
        sortable: true,
        wrap: true,
        style: { minWidth: '80px' },
      },
      {
        name: <span className="block text-center w-full">{t('status')}</span>,
        sortable: true,
        style: { minWidth: '70px', textAlign: 'center' },
        cell: row => (
          <span
            className={`badge ${row.status === 'Y' ? 'badge-success' : 'badge-error'} badge-sm`}
          >
            {row.status === 'Y' ? t('active') : t('inactive')}
          </span>
        ),
      },
    ],
    [t, handleDetail, handleToggleStatus]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddOpen(false);
        setBulkOpen(false);
        setDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const level = cookieStore.getLevel();
    const fcba = cookieStore.getFcba();
    setUserLevel(level);
    setUserFcba(fcba);
    if (level && level !== 'ADM' && fcba) {
      setFilters(prev => ({ ...prev, fcba }));
    }
  }, []);

  const clearFilters = () => setFilters({});

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        {/* ── Header ── */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1 className="text-2xl sm:text-3xl font-bold min-w-0 truncate">{t('userManagement')}</h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(s => !s)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {showFilters ? t('hideFilters') : t('showFilters')}
            </button>
            <button
              className={`btn btn-sm ${loading ? 'btn-disabled' : ''}`}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['sips-users'] })}
              disabled={loading}
              title={t('refresh')}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              {loading ? t('loading') : t('refresh')}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleExport} title={t('export')}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t('export')}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                const defaultFcba = isFcbaRestricted ? userFcba : '';
                setForm({ ...initialForm, fcba: defaultFcba });
                setSelFcba(defaultFcba);
                setSelAfdeling('');
                setAddOpen(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('addUser')}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const defaultFcba = isFcbaRestricted ? userFcba : '';
                setBulkRows([{ ...initialBulkRow, fcba: defaultFcba }]);
                setBulkFcba(defaultFcba);
                setBulkAfdeling('');
                setBulkGang('');
                setBulkOpen(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t('bulkAdd')}
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="mb-3 flex justify-end">
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
              type="text"
              className="input input-bordered w-full pl-9 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder={t('searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label={t('quickSearch')}
              title={t('quickSearch')}
            />
            {!isSearchFocused && !q && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <kbd className="kbd kbd-sm bg-base-200/50 opacity-50">/</kbd>
              </div>
            )}
            {q && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error transition-colors"
                onClick={() => setQ('')}
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

        {/* ── Filters ── */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div>
                <SearchSelect
                  options={scopedFcbaOptions}
                  value={filters.fcba ?? ''}
                  onChange={v => setFilters(prev => ({ ...prev, fcba: v || undefined }))}
                  placeholder="FCBA"
                  translationNamespace="Users"
                  small
                  disabled={isFcbaRestricted}
                />
              </div>
              <div>
                <SearchSelect
                  options={afdelingFilterOptions}
                  value={filters.afdeling ?? ''}
                  onChange={v => setFilters(prev => ({ ...prev, afdeling: v || undefined }))}
                  placeholder={t('afdeling')}
                  translationNamespace="Users"
                  small
                />
              </div>
              <div>
                <SearchSelect
                  options={gangcodeFilterOptions}
                  value={filters.gangcode ?? ''}
                  onChange={v => setFilters(prev => ({ ...prev, gangcode: v || undefined }))}
                  placeholder={t('gangcode')}
                  translationNamespace="Users"
                  small
                />
              </div>
              <div>
                <SearchSelect
                  options={LEVEL_OPTIONS}
                  value={filters.level ?? ''}
                  onChange={v => setFilters(prev => ({ ...prev, level: v || undefined }))}
                  placeholder={t('level')}
                  translationNamespace="Users"
                  small
                />
              </div>
              <div>
                <SearchSelect
                  options={POSITION_OPTIONS}
                  value={filters.position ?? ''}
                  onChange={v => setFilters(prev => ({ ...prev, position: v || undefined }))}
                  placeholder={t('position')}
                  translationNamespace="Users"
                  small
                />
              </div>
            </div>
            <div className="flex justify-start gap-2 pt-3 border-t border-base-200 mt-3">
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                {t('resetFilters')}
              </button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="rounded-lg border border-base-200 shadow-sm bg-base-100 p-4">
          {isLoading ? (
            <SkeletonTable rows={10} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              namespace="Users"
              onClearSearch={() => {
                setQ('');
                clearFilters();
              }}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              pagination
              paginationPerPage={25}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              customStyles={centerHeaderStyle}
              dense
              highlightOnHover
              striped
              responsive
              noDataComponent={<EmptyState namespace="Users" />}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════ ADD USER MODAL ═══════════════════════ */}
      {addOpen && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-[calc(100vw-1rem)] sm:max-w-5xl mx-2 sm:mx-0 p-2 sm:p-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-base-100 pb-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-b border-base-300">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xl">{t('addUser')}</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => setAddOpen(false)}
                  aria-label={t('close')}
                  title={t('close')}
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              id="user-form"
              onSubmit={handleAddUser}
              className="grid grid-cols-12 gap-2 max-h-[80vh] overflow-y-auto"
            >
              {/* Account Information */}
              <div className="col-span-12">
                <h4 className="text-sm font-semibold text-base-content/80">{t('accountInfo')}</h4>
                <div className="mt-1 border-t border-base-300" />
              </div>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('username')} *</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.username}
                  onChange={e => setForm(s => ({ ...s, username: e.target.value }))}
                  required
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('fullname')} *</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.fullname}
                  onChange={e => setForm(s => ({ ...s, fullname: e.target.value }))}
                  required
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">Email</legend>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('phone')}</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.phone}
                  onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-6">
                <legend className="fieldset-legend">{t('password')} *</legend>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </fieldset>

              {/* Assignment */}
              <div className="col-span-12 mt-1">
                <h4 className="text-sm font-semibold text-base-content/80">{t('assignment')}</h4>
                <div className="mt-1 border-t border-base-300" />
              </div>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">FCBA</legend>
                <SearchSelect
                  options={scopedFcbaOptions}
                  value={form.fcba}
                  onChange={onChangeFcba}
                  placeholder={t('select')}
                  translationNamespace="Users"
                  disabled={isFcbaRestricted}
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('afdeling')}</legend>
                <SearchSelect
                  options={sectionOptions}
                  value={form.afdeling}
                  onChange={onChangeAfdeling}
                  placeholder={!form.fcba ? t('selectFcbaFirst') : t('select')}
                  translationNamespace="Users"
                  disabled={!form.fcba}
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('gangcode')}</legend>
                <SearchSelect
                  options={gangOptions}
                  value={form.gangcode}
                  onChange={onChangeGang}
                  placeholder={!form.afdeling ? t('selectAfdelingFirst') : t('select')}
                  translationNamespace="Users"
                  disabled={!form.afdeling}
                />
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('level')}</legend>
                <select
                  className="select select-bordered w-full"
                  value={form.level}
                  onChange={e => setForm(s => ({ ...s, level: e.target.value }))}
                >
                  <option value="">{t('select')}</option>
                  {LEVEL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('position')}</legend>
                <select
                  className="select select-bordered w-full"
                  value={form.position}
                  onChange={e => setForm(s => ({ ...s, position: e.target.value }))}
                >
                  <option value="">{t('select')}</option>
                  {POSITION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </fieldset>
              <fieldset className="fieldset col-span-12 md:col-span-3">
                <legend className="fieldset-legend">{t('idkaryawan')}</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.idkaryawan}
                  onChange={e => setForm(s => ({ ...s, idkaryawan: e.target.value }))}
                />
              </fieldset>
            </form>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-base-100 pt-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-t border-base-300">
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAddOpen(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  form="user-form"
                  className="btn btn-primary btn-sm"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAddOpen(false)} />
        </div>
      )}

      {/* ═══════════════════════ BULK ADD MODAL ═══════════════════════ */}
      {bulkOpen && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-secondary/5 px-6 py-4 border-b border-base-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('bulkAdd')}</h3>
                  <p className="text-xs text-base-content/60">{t('bulkSubtitle')}</p>
                </div>
              </div>
            </div>

            {/* Default cascading selectors - outside scroll area */}
            <div className="px-6 py-3 bg-base-200/50 border-b border-base-200">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="form-control min-w-[160px] flex-1">
                  <label className="label py-0">
                    <span className="label-text text-xs font-medium">FCBA</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={bulkFcba}
                    onChange={v => {
                      setBulkFcba(v.target.value);
                      setBulkAfdeling('');
                      setBulkGang('');
                    }}
                    disabled={isFcbaRestricted}
                  >
                    <option value="">{t('select')}</option>
                    {fcbaOptions.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control min-w-[160px] flex-1">
                  <label className="label py-0">
                    <span className="label-text text-xs font-medium">{t('afdeling')}</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={bulkAfdeling}
                    onChange={v => {
                      setBulkAfdeling(v.target.value);
                      setBulkGang('');
                    }}
                    disabled={!bulkFcba}
                  >
                    <option value="">{!bulkFcba ? t('selectFcbaFirst') : t('select')}</option>
                    {bulkSectionOptions.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control min-w-[160px] flex-1">
                  <label className="label py-0">
                    <span className="label-text text-xs font-medium">{t('gangcode')}</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={bulkGang}
                    onChange={v => setBulkGang(v.target.value)}
                    disabled={!bulkAfdeling}
                  >
                    <option value="">
                      {!bulkAfdeling ? t('selectAfdelingFirst') : t('select')}
                    </option>
                    {bulkGangOptions.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs mb-0.5"
                  onClick={applyBulkDefaults}
                  disabled={!bulkFcba && !bulkAfdeling && !bulkGang}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t('applyDefaults')}
                </button>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <p className="text-sm text-base-content/60 mb-3">{t('bulkHint')}</p>
              <table className="table table-zebra table-xs">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('username')} *</th>
                    <th>{t('fullname')} *</th>
                    <th>Email</th>
                    <th>{t('phone')}</th>
                    <th>{t('password')} *</th>
                    <th>FCBA</th>
                    <th>{t('afdeling')}</th>
                    <th>{t('gangcode')}</th>
                    <th>{t('level')}</th>
                    <th>{t('position')}</th>
                    <th>{t('idkaryawan')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-center text-base-content/60">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-24"
                          value={row.username}
                          onChange={e => updateBulkRow(idx, 'username', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-28"
                          value={row.fullname}
                          onChange={e => updateBulkRow(idx, 'fullname', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          className="input input-bordered input-xs w-28"
                          value={row.email}
                          onChange={e => updateBulkRow(idx, 'email', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-24"
                          value={row.phone}
                          onChange={e => updateBulkRow(idx, 'phone', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="password"
                          className="input input-bordered input-xs w-24"
                          value={row.password}
                          onChange={e => updateBulkRow(idx, 'password', e.target.value)}
                          required
                          minLength={8}
                        />
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-xs w-20"
                          value={row.fcba}
                          onChange={e => updateBulkRow(idx, 'fcba', e.target.value)}
                          disabled={isFcbaRestricted}
                        >
                          <option value="">-</option>
                          {fcbaOptions.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-20"
                          value={row.afdeling}
                          onChange={e => updateBulkRow(idx, 'afdeling', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-20"
                          value={row.gangcode}
                          onChange={e => updateBulkRow(idx, 'gangcode', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-xs w-22"
                          value={row.level}
                          onChange={e => updateBulkRow(idx, 'level', e.target.value)}
                        >
                          <option value="">-</option>
                          {LEVEL_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-xs w-22"
                          value={row.position}
                          onChange={e => updateBulkRow(idx, 'position', e.target.value)}
                        >
                          <option value="">-</option>
                          {POSITION_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-xs w-28"
                          value={row.idkaryawan}
                          onChange={e => updateBulkRow(idx, 'idkaryawan', e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => removeBulkRow(idx)}
                          disabled={bulkRows.length <= 1}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-ghost btn-sm mt-2" onClick={addBulkRow}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t('addRow')}
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-base-200 bg-base-100 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setBulkOpen(false)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleBulkSubmit}
                disabled={bulkLoading}
              >
                {bulkLoading ? <span className="loading loading-spinner loading-sm" /> : null}
                {t('submitAll', {
                  count: bulkRows.filter(r => r.username && r.fullname && r.password).length,
                })}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setBulkOpen(false)} />
        </div>
      )}

      {/* ═══════════════════════ DETAIL MODAL ═══════════════════════ */}
      {detailOpen && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-[calc(100vw-1rem)] sm:max-w-2xl mx-2 sm:mx-0 p-2 sm:p-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-base-100 pb-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-b border-base-300">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xl">{t('userDetail')}</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => setDetailOpen(false)}
                  aria-label={t('close')}
                  title={t('close')}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="py-4">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              ) : detailUser ? (
                <div className="flex flex-col gap-4">
                  <div className="avatar flex justify-center mb-1">
                    <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {detailUser.photo ? (
                        <Image
                          src={`/api/image-proxy?url=${encodeURIComponent(detailUser.photo)}`}
                          alt={detailUser.fullname ?? ''}
                          className="object-cover"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-20 bg-base-300 flex items-center justify-center text-2xl font-bold">
                          {(detailUser.fullname ?? '?')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-base-content/60">{t('username')}</dt>
                    <dd className="font-medium">{detailUser.username ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('fullname')}</dt>
                    <dd className="font-medium">{detailUser.fullname ?? '-'}</dd>
                    <dt className="text-base-content/60">Email</dt>
                    <dd className="font-medium break-all">{detailUser.email ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('phone')}</dt>
                    <dd className="font-medium">{detailUser.phone ?? '-'}</dd>
                    <dt className="text-base-content/60">FCBA</dt>
                    <dd className="font-medium">{resolveSection(detailUser.fcba ?? '')}</dd>
                    <dt className="text-base-content/60">{t('afdeling')}</dt>
                    <dd className="font-medium">{detailUser.afdeling ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('gangcode')}</dt>
                    <dd className="font-medium">{detailUser.gangcode ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('level')}</dt>
                    <dd className="font-medium">{detailUser.level ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('position')}</dt>
                    <dd className="font-medium">{detailUser.position ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('idkaryawan')}</dt>
                    <dd className="font-medium">{detailUser.idkaryawan ?? '-'}</dd>
                    <dt className="text-base-content/60">{t('status')}</dt>
                    <dd>
                      <span
                        className={`badge ${detailUser.status === 'Y' ? 'badge-success' : 'badge-error'} badge-sm`}
                      >
                        {detailUser.status === 'Y' ? t('active') : t('inactive')}
                      </span>
                    </dd>
                  </dl>
                  <div className="flex gap-2 mt-1">
                    <button
                      className={`btn btn-sm ${detailUser.status === 'Y' ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => {
                        handleToggleStatus(detailUser);
                        setDetailOpen(false);
                      }}
                    >
                      {detailUser.status === 'Y' ? t('deactivate') : t('activate')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base-content/60 text-center py-8">{t('noData')}</p>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-base-100 pt-2 -mx-2 sm:-mx-6 px-2 sm:px-6 border-t border-base-300">
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDetailOpen(false)}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDetailOpen(false)} />
        </div>
      )}
    </div>
  );
}
