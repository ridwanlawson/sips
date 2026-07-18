'use client';

import { useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { TableColumn } from 'react-data-table-component';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AppDataTable } from '@/app/components/data/app-data-table';
import { SkeletonTable } from '@/app/components/ui/skeletons';
import { SearchSelect, type Option } from '@/app/components/ui/search-select';
import { EmptyState } from '@/app/components/feedback/empty-state';
import { Icon } from '@/app/components/ui/icons';
import { PhotoCell } from '@/app/components/ui/photo-cell';
import { ExportButton } from '@/app/components/ui/export-button';
import AppTour from '@/app/components/feedback/app-tour';
import type { TourStep } from '@/app/components/feedback/app-tour';
import { useUsersData } from '@/hooks/useUsersData';
import { QueryKeys } from '@/utils/queryKeys';
import type { SipsUser, UserFormState } from '@/types/domain';
import { initialUserForm } from '@/types/domain';
import { StatusBadge } from '@/app/components/ui/status-badge';
import { QuickSearch } from '@/app/components/ui/quick-search';
import { FilterBar } from '@/app/components/ui/filter-bar';
import { FormModal } from '@/app/components/ui/form-modal';

const LEVEL_OPTIONS: Option[] = [
  { value: 'MGR', label: 'MGR - Manager' },
  { value: 'KSI', label: 'KSI - Kepala Administrasi' },
  { value: 'AST', label: 'AST - Asisten' },
  { value: 'MD1', label: 'MD1 - Mandor 1' },
  { value: 'MDP', label: 'MDP - Mandor Panen' },
  { value: 'KRP', label: 'KRP - Kerani Panen' },
  { value: 'KRT', label: 'KRT - Kerani Transport' },
  { value: 'KRA', label: 'KRA - Kerani Afdeling' },
  { value: 'ADM', label: 'ADM - Administrator' },
];

const POSITION_OPTIONS: Option[] = [
  { value: 'EM', label: 'EM - Manager' },
  { value: 'KASIE', label: 'KASIE - Kepala Administrasi' },
  { value: 'ASISTEN', label: 'ASISTEN - Asisten' },
  { value: 'MANDOR1', label: 'MANDOR1 - Mandor 1' },
  { value: 'MD.PANEN', label: 'MD.PANEN - Mandor Panen' },
  { value: 'KR.PANEN', label: 'KR.PANEN - Kerani Panen' },
  { value: 'KR.TRANS', label: 'KR.TRANS - Kerani Transport' },
  { value: 'KR.AFDELING', label: 'KR.AFDELING - Kerani Afdeling' },
  { value: 'ADMIN', label: 'ADMIN - Administrator' },
];

const POSITION_TO_LEVEL: Record<string, string> = {
  EM: 'MGR',
  KASIE: 'KSI',
  ASISTEN: 'AST',
  MANDOR1: 'MD1',
  'MD.PANEN': 'MDP',
  'KR.PANEN': 'KRP',
  'KR.TRANS': 'KRT',
  'KR.AFDELING': 'KRA',
  'ADMIN': 'ADM',
};

const initialBulkRow: UserFormState = { ...initialUserForm, password: '12345678' };

export default function UsersClient() {
  const t = useTranslations('Users');
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get('q') || '';
  const initialFilters = useMemo(() => {
    const f: Record<string, string> = {};
    const qp = ['fcba', 'afdeling', 'gangcode', 'level', 'position'];
    for (const key of qp) {
      const v = searchParams.get(key);
      if (v) f[key] = v;
    }
    return f;
  }, [searchParams]);

  const {
    q, setQ,
    showFilters, setShowFilters,
    filters, setFilters, clearFilters,
    afdelingFilterOptions, gangcodeFilterOptions,
    scopedFcbaOptions,
    sectionOptions, gangOptions,
    bulkSectionOptions, bulkGangOptions,
    isFcbaRestricted, userFcba, userLevel,
    isLoading, isFetching, filteredUsers,
    setSelFcba, setSelAfdeling,
    form, setForm,
    registerMutation,
    addOpen, setAddOpen,
    bulkOpen, setBulkOpen,
    bulkFcba, setBulkFcba,
    bulkAfdeling, setBulkAfdeling,
    bulkGang, setBulkGang,
    setBulkRows, bulkRows, bulkLoading,
    detailOpen, setDetailOpen,
    detailUser, detailLoading,
    onChangeFcba, onChangeAfdeling, onChangeGang,
    applyBulkDefaults,
    addBulkRow, removeBulkRow, updateBulkRow,
    handleBulkSubmit,
    handleDetail, handleToggleStatus,
    handleAddUser, handleExport,
    resolveSection,
  } = useUsersData(initialQ, initialFilters);

  const visibleLevelOptions = useMemo(
    () => (userLevel === 'ADM' ? LEVEL_OPTIONS : LEVEL_OPTIONS.filter(o => o.value !== 'ADM')),
    [userLevel]
  );

  const visiblePositionOptions = useMemo(
    () => (userLevel === 'ADM' ? POSITION_OPTIONS : POSITION_OPTIONS.filter(o => o.value !== 'ADMIN')),
    [userLevel]
  );

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    Object.entries(filters).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const qs = sp.toString();
    const current = window.location.search;
    const next = qs ? `?${qs}` : '';
    if (current !== next) {
      router.replace(next || window.location.pathname, { scroll: false });
    }
  }, [q, filters, router]);

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
              <Icon name="eye-view" className="h-4 w-4" />
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
        cell: row => <StatusBadge status={row.status} label={row.status === 'Y' ? t('active') : t('inactive')} />,
      },
    ],
    [t, handleDetail, handleToggleStatus]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden space-y-4">
        {/* ── Header ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1 className="text-2xl sm:text-3xl font-bold min-w-0 truncate">{t('userManagement')}</h1>
          <div className="flex justify-start sm:justify-end flex-wrap w-full join" data-tour="action-buttons">
            <AppTour steps={tourSteps} storageKey="tour-users" onStepChange={stepIndex => { if (stepIndex === 3) { setShowFilters(true); } }} btnClassName="join-item flex-1 sm:flex-none" />
            <button className="btn btn-outline btn-sm flex-1 sm:flex-none join-item" data-tour="filter-button" onClick={() => setShowFilters(s => !s)}>
              <Icon name="filter" className="h-4 w-4" />
              <span className="hidden sm:inline">{showFilters ? t('hideFilters') : t('showFilters')}</span>
            </button>
            <button
              className={`btn btn-outline btn-sm flex-1 sm:flex-none join-item ${isFetching ? 'btn-disabled' : ''}`}
              onClick={() => queryClient.invalidateQueries({ queryKey: QueryKeys.USERS() })}
              disabled={isFetching}
              title={t('refresh')}
            >
              {isFetching ? (
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
            <ExportButton onClick={handleExport} label={t('export')} />
            <button
              className="btn btn-primary btn-sm flex-1 sm:flex-none join-item"
              data-tour="add-button"
              onClick={() => {
                const defaultFcba = isFcbaRestricted ? userFcba : '';
                setForm({ ...initialUserForm, fcba: defaultFcba });
                setForm({ ...initialUserForm, fcba: defaultFcba });
                setSelFcba(defaultFcba);
                setSelAfdeling('');
                setAddOpen(true);
              }}
            >
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">{t('addUser')}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm flex-1 sm:flex-none join-item"
              onClick={() => {
                const defaultFcba = isFcbaRestricted ? userFcba : '';
                setBulkRows([{ ...initialBulkRow, fcba: defaultFcba }]);
                setBulkFcba(defaultFcba);
                setBulkAfdeling('');
                setBulkGang('');
                setBulkOpen(true);
              }}
            >
              <Icon name="people" className="h-4 w-4" />
              <span className="hidden sm:inline">{t('bulkAdd')}</span>
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex justify-end">
          <QuickSearch value={q} onChange={setQ} placeholder={t('searchPlaceholder')} className="w-full sm:w-72" />
        </div>

        {/* ── Filters ── */}
        {showFilters && (
          <FilterBar
            fields={[
              { key: 'fcba', label: 'FCBA', type: 'search-select', options: scopedFcbaOptions, disabled: isFcbaRestricted, placeholder: 'FCBA' },
              { key: 'afdeling', label: t('afdeling'), type: 'search-select', options: afdelingFilterOptions, placeholder: t('afdeling') },
              { key: 'gangcode', label: t('gangcode'), type: 'search-select', options: gangcodeFilterOptions, placeholder: t('gangcode') },
              { key: 'level', label: t('level'), type: 'search-select', options: visibleLevelOptions, placeholder: t('level') },
              { key: 'position', label: t('position'), type: 'search-select', options: visiblePositionOptions, placeholder: t('position') },
            ]}
            values={filters}
            onChange={(key, value) => {
              if (key.startsWith('__q_')) return;
              setFilters(prev => ({ ...prev, [key]: value || undefined }));
            }}
            onApply={() => {}}
            onReset={clearFilters}
            showApply={false}
            showReset={true}
          />
        )}

        {/* ── Table ── */}
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
          <AppDataTable
            columns={columns}
            data={filteredUsers}
            paginationPerPage={25}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            striped
            noDataComponent={<EmptyState namespace="Users" />}
          />
        )}
      </div>

      {/* ═══════════════════════ ADD USER MODAL ═══════════════════════ */}
      <FormModal
        open={addOpen}
        title={t('addUser')}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddUser}
        loading={registerMutation.isPending}
        cancelText={t('cancel')}
        confirmText={t('save')}
      >
        {/* Account Information */}
        <div className="col-span-12 mt-1">
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
        <fieldset className="fieldset col-span-12">
          <legend className="fieldset-legend">{t('password')} *</legend>
          <input
            type="password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
            required
            minLength={8}
          />
          <span className="text-[0.6rem] text-base-content/40 mt-0.5 block leading-tight">
            {'Minimal 8 karakter'}
          </span>
        </fieldset>

        {/* Penempatan */}
        <div className="col-span-12 mt-2">
          <h4 className="text-sm font-semibold text-base-content/80">{t('assignment')}</h4>
          <div className="mt-1 border-t border-base-300" />
        </div>
        <fieldset className="fieldset col-span-12 md:col-span-4">
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
        <fieldset className="fieldset col-span-12 md:col-span-4">
          <legend className="fieldset-legend">{t('afdeling')}</legend>
          <SearchSelect
            options={sectionOptions}
            value={form.afdeling}
            onChange={onChangeAfdeling}
            placeholder={!form.fcba ? t('selectFcbaFirst') : t('select')}
            translationNamespace="Users"
            disabled={!form.fcba}
          />
          {!form.fcba && (
            <span className="text-[0.6rem] text-base-content/40 mt-0.5 block leading-tight">
              {'Isi FCBA terlebih dahulu'}
            </span>
          )}
        </fieldset>
        <fieldset className="fieldset col-span-12 md:col-span-4">
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

        {/* Jabatan & Identitas */}
        <div className="col-span-12 mt-2">
          <h4 className="text-sm font-semibold text-base-content/80">{t('position')}</h4>
          <div className="mt-1 border-t border-base-300" />
        </div>
        <fieldset className="fieldset col-span-12 md:col-span-6">
          <legend className="fieldset-legend">{t('position')}</legend>
          <select
            className="select select-bordered w-full"
            value={form.position}
            onChange={e => {
              const pos = e.target.value;
              const lvl = POSITION_TO_LEVEL[pos] || '';
              setForm(s => ({ ...s, position: pos, level: lvl }));
            }}
          >
            <option value="">{t('select')}</option>
            {visiblePositionOptions.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset className="fieldset col-span-12 md:col-span-6">
          <legend className="fieldset-legend">{t('idkaryawan')}</legend>
          <input
            type="text"
            className="input input-bordered w-full"
            value={form.idkaryawan}
            onChange={e => setForm(s => ({ ...s, idkaryawan: e.target.value }))}
          />
        </fieldset>
      </FormModal>

      {/* ═══════════════════════ BULK ADD MODAL ═══════════════════════ */}
      <FormModal
        open={bulkOpen}
        title={t('bulkAdd')}
        onClose={() => setBulkOpen(false)}
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleBulkSubmit(); }}
        loading={bulkLoading}
        size="full"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBulkOpen(false)}
              disabled={bulkLoading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={bulkLoading}
            >
              {bulkLoading ? <span className="loading loading-spinner loading-sm" /> : null}
              {t('submitAll', {
                count: bulkRows.filter(r => r.username && r.fullname && r.password).length,
              })}
            </button>
          </div>
        }
      >
        {/* Cascading selectors */}
        <div className="col-span-12 bg-base-200/50 -mx-2 sm:-mx-6 px-2 sm:px-6 py-3 border-b border-base-200 mb-3">
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
                {bulkFcba && !scopedFcbaOptions.some(o => o.value === bulkFcba) && (
                  <option value={bulkFcba} disabled>
                    {bulkFcba}
                  </option>
                )}
                {scopedFcbaOptions.map(o => (
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
              <Icon name="refresh" className="h-4 w-4" />
              {t('applyDefaults')}
            </button>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="col-span-12">
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
                      {row.fcba && !scopedFcbaOptions.some(o => o.value === row.fcba) && (
                        <option value={row.fcba} disabled>
                          {row.fcba}
                        </option>
                      )}
                      {scopedFcbaOptions.map(o => (
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
                      className="select select-bordered select-xs w-28"
                      value={row.position}
                      onChange={e => {
                        const pos = e.target.value;
                        const lvl = POSITION_TO_LEVEL[pos] || '';
                        updateBulkRow(idx, 'position', pos);
                        updateBulkRow(idx, 'level', lvl);
                      }}
                    >
                      <option value="">-</option>
                      {visiblePositionOptions.map(o => (
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
                      <Icon name="close" className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={addBulkRow}>
            <Icon name="plus" className="h-4 w-4" />
            {t('addRow')}
          </button>
        </div>
      </FormModal>

      {/* ═══════════════════════ DETAIL MODAL ═══════════════════════ */}
      <FormModal
        open={detailOpen}
        title={t('userDetail')}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        cancelText={t('close')}
        size="md"
      >
        {detailUser ? (
          <div className="flex flex-col gap-4 py-4 col-span-12">
            <div className="flex justify-center mb-1">
              <PhotoCell imageUrl={detailUser.photo} alt="foto" href={detailUser.photo ?? ''} size={40} />
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
                <StatusBadge status={detailUser.status} label={detailUser.status === 'Y' ? t('active') : t('inactive')} />
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
          <p className="col-span-12 text-base-content/60 text-center py-8">{t('noData')}</p>
        )}
      </FormModal>
    </div>
  );
}
