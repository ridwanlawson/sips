'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SkeletonCard, SkeletonTable, SkeletonChart } from '@/app/components/ui/skeletons';

const SimpleBarChart = dynamic(() => import('@/app/components/features/dashboard-chart').then(mod => mod.SimpleBarChart), { ssr: false });
const SimplePieChart = dynamic(() => import('@/app/components/features/dashboard-chart').then(mod => mod.SimplePieChart), { ssr: false });
const SimpleLineChart = dynamic(() => import('@/app/components/features/dashboard-chart').then(mod => mod.SimpleLineChart), { ssr: false });
import { Icon } from '@/app/components/ui/icons';
import { SearchSelect } from '@/app/components/ui/search-select';
import { EmptyState } from '@/app/components/feedback/empty-state';
import { useLocale } from '@/hooks/useLocale';
import { useDashboardData, isNonZeroTime } from '@/hooks/useDashboardData';
import { formatPerfNumber } from '@/utils/helpers/perf-formatter';
import { StatusBadge } from '@/app/components/ui/status-badge';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

const timeframeLabel = (tf: Timeframe): string => {
  switch (tf) {
    case 'daily':
      return 'Hari ini';
    case 'weekly':
      return '7 Hari Terakhir';
    case 'monthly':
      return 'Bulan ini';
    case 'yearly':
      return 'Tahun ini';
    default:
      return '';
  }
};

const getTrendLabel = (tf: Timeframe): string => {
  switch (tf) {
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

export default function UserDashboard() {
  const t = useTranslations('Dashboard');
  const localeTag = useLocale();

  const {
    isClient,
    loading, error,
    userLevel, userProfile,
    displayName, displayLevel, displayFcba, displayAfdeling, displayGang,
    timeframe, setTimeframe,
    filterFcba, setFilterFcba,
    filterAfdeling, setFilterAfdeling,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    showFilters, setShowFilters,
    fcbaOptions, afdelingOptions, monthOptions, yearOptions,
    detailMode, setDetailMode,
    stats,
    harvestingStats, loadingHarvesting,
    transportStats, loadingTransport,
    dailySummaries,
    rowDetails, filteredAttendance,
    barChartData, pieChartData, lineChartData,
    pctHadir, pctTepatWaktu, pctTelat, pctPulangAwal, pctAlpa,
    handleClearFilters,
    linkParams,
  } = useDashboardData();

  const detailModeLabel = detailMode === 'perHari' ? 'Per Hari (Rekap)' : 'Per Baris (Detail)';

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
      <div className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6 overflow-x-hidden">
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
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <span className="text-xs uppercase tracking-wide text-base-content/60">
              Periode Data:
            </span>
            <div className="join w-full sm:w-auto">
              {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  type="button"
                  className={`join-item btn btn-xs md:btn-sm flex-1 sm:flex-none ${
                    timeframe === tf ? 'btn-primary' : 'btn-ghost border border-base-300'
                  }`}
                  onClick={() => {
                    setTimeframe(tf);
                    if (tf !== 'monthly') setSelectedMonth('ALL');
                  }}
                >
                  {timeframeLabel(tf)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error animate-slideUp">
            <span>{error}</span>
          </div>
        )}

        {/* FILTER BAR */}
        <div data-tour="filter-section" className="card bg-base-100 shadow-sm border border-base-300 animate-slideUp">
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
                title={t('filterToggleTooltip')}
              >
                <Icon name="filter" className="h-4 w-4" />
                {showFilters ? t('hideFilters') : t('showFilters')}
              </button>
            </div>

            {showFilters && (
              <>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Bulan */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold">Bulan</label>
                  <SearchSelect
                    options={monthOptions}
                    value={selectedMonth}
                    onChange={v => {
                      setSelectedMonth(v);
                      if (v !== 'ALL') setTimeframe('monthly');
                    }}
                      placeholder="Pilih Bulan"
                      small
                      useFixedPositioning
                    />
                  </div>

                  {/* Tahun */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold">Tahun</label>
                    <SearchSelect
                      options={yearOptions}
                      value={selectedYear}
                      onChange={v => setSelectedYear(v)}
                      placeholder="Pilih Tahun"
                      small
                      useFixedPositioning
                    />
                  </div>

                  {/* FCBA */}
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
                        placeholder={t('filterFcbaPlaceholder')}
                        small
                        useFixedPositioning
                      />
                    </div>
                  )}
                  {['MGR', 'KSI'].includes(userLevel) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">FCBA</label>
                      <div className="px-2 py-1.5 text-sm font-medium bg-base-200 rounded-lg border border-base-300">
                        {displayFcba}
                      </div>
                    </div>
                  )}
                  {['AST', 'KRA', 'MD1', 'KRT', 'KRP', 'MDP'].includes(userLevel) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">FCBA</label>
                      <div className="px-2 py-1.5 text-sm font-medium bg-base-200 rounded-lg border border-base-300">
                        {displayFcba}
                      </div>
                    </div>
                  )}

                  {/* Afdeling */}
                  {(userLevel === 'ADM' || ['MGR', 'KSI'].includes(userLevel)) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Afdeling</label>
                      <SearchSelect
                        options={afdelingOptions}
                        value={filterAfdeling}
                        onChange={v => setFilterAfdeling(v)}
                        placeholder={t('filterAfdelingPlaceholder')}
                        small
                        disabled={afdelingOptions.length === 0}
                        useFixedPositioning
                      />
                    </div>
                  )}
                  {['AST', 'KRA', 'MD1', 'KRT'].includes(userLevel) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Afdeling</label>
                      <div className="px-2 py-1.5 text-sm font-medium bg-base-200 rounded-lg border border-base-300">
                        {displayAfdeling}
                      </div>
                    </div>
                  )}

                  {/* Kemandoran (only for KRP/MDP) */}
                  {['KRP', 'MDP'].includes(userLevel) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Kemandoran</label>
                      <div className="px-2 py-1.5 text-sm font-medium bg-base-200 rounded-lg border border-base-300">
                        {displayGang}
                      </div>
                    </div>
                  )}
                </div>

                {/* Keterangan */}
                <div className="mt-3 border border-base-200 rounded-lg p-3 bg-base-100">
                  <details className="group">
                    <summary className="text-xs font-semibold cursor-pointer text-base-content/60 hover:text-base-content transition-colors select-none">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="info" className="h-3.5 w-3.5" />
                        Keterangan Status
                        <Icon name="chevron-down" className="h-3 w-3 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="mt-2 text-xs text-base-content/60 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="HADIR" defaultStyle="ghost" size="xs" />
                        <span>Semua kode kecuali MK dan P1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="TEPAT WAKTU" defaultStyle="success" size="xs" />
                        <span>Hadir tanpa telat & tanpa pulang awal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="TELAT" defaultStyle="warning" size="xs" />
                        <span><code>total_late_time</code> lebih dari 0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="PULANG AWAL" defaultStyle="error" size="xs" />
                        <span><code>go_home_early</code> lebih dari 0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="ALPHA" defaultStyle="neutral" size="xs" />
                        <span>P1 (izin) atau MK (mangkir)</span>
                      </div>
                    </div>
                  </details>
                </div>
              </>
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
                <Link href={`/harvest?${linkParams}`} className="btn btn-sm btn-outline">
                  Lihat Detail
                </Link>
              </div>
            </div>
          </div>

          {/* Pengangkutan Card */}
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm md:text-lg gap-2">
                🚛 Transport ({timeframeLabel(timeframe)})
              </h2>
              {loadingTransport ? (
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">Total</div>
                    <div className="stat-value text-2xl font-bold">{transportStats.total}</div>
                  </div>
                  <div className="stat place-items-center p-3 bg-base-200 rounded">
                    <div className="stat-title text-xs">JJG</div>
                    <div className="stat-value text-2xl font-bold text-primary">
                      {transportStats.totalOutput && transportStats.totalOutput > 0
                        ? formatPerfNumber(transportStats.totalOutput, localeTag)
                        : transportStats.total}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-success/20 rounded">
                    <div className="stat-title text-xs">Approved</div>
                    <div className="stat-value text-xl font-bold text-success">
                      {transportStats.approved}
                    </div>
                  </div>
                  <div className="stat place-items-center p-3 bg-info/20 rounded">
                    <div className="stat-title text-xs">Planned</div>
                    <div className="stat-value text-xl font-bold text-info">
                      {transportStats.planned}
                    </div>
                  </div>
                </div>
              )}
              <div className="card-actions justify-end mt-2">
                <Link href={`/transport?${linkParams}`} className="btn btn-sm btn-outline">
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
                <Link href={`/attendance?${linkParams}`} className="btn btn-sm btn-outline">
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
              <h2 className="card-title text-sm md:text-lg">📈 Tren Absensi ({getTrendLabel(timeframe)})</h2>
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
                        const status = r._status;

                        const keyBase =
                          r.id !== undefined && r.id !== null ? String(r.id) : `${r.tanggal}`;
                        const rowKey = `${keyBase}-${idx}`;

                        return (
                          <tr key={rowKey} className="hover:bg-base-200">
                            <td className="whitespace-nowrap">{r._displayDate || '-'}</td>

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
