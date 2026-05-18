"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "@/app/components/dynamic-data-table";
import type { TableColumn } from "react-data-table-component";
import { SkeletonTable } from "@/app/components/skeletons";
import { AccessDenied } from "@/app/components/access-denied";
import { useLocale } from "@/hooks/useLocale";
import { useUploadPage } from "@/hooks/useUploadPage";
import { useBatchSubmit } from "@/hooks/useBatchSubmit";

interface HarvestingQualityUploadData {
  empcode: string;
  fddate: string;
  fieldcode: string;
  under_ripe?: string | number;
  overripe?: string | number;
  abnormal?: string | number;
  long_stalk?: string | number;
  eaten_by_rat?: string | number;
  unharvest_ffb?: string | number;
  uncollect_lf_circle?: string | number;
  uncollect_lf_piece?: string | number;
  unarrange_ffb?: string | number;
  unprune_frond?: string | number;
  qe_1_pelepah_tidak_disusun?: string | number;
  qe_2_buah_matahari?: string | number;
  qe_3_buah_busuk?: string | number;
  qe_4_buah_mentah_diperam?: string | number;
  qe_5_over_pruning?: string | number;
  qe_6_brondolan_tidak_dialas?: string | number;
  qe_7_brondolan_kotor_sampah?: string | number;
  qe_8_buah_dibelah?: string | number;
  qe_9?: string | number;
  qe_10?: string | number;
  qe_11_buah_mentah_a1?: string | number;
  qe_12_buah_tinggal_s?: string | number;
  qe_13_b_ggng_pjg_t_dipotong?: string | number;
  qe_14?: string | number;
  qe_15?: string | number;
  qe_16_buah_mentah_kerani?: string | number;
  qe_17_buah_mentah_mandor?: string | number;
  fcentry?: string | null;
  fcedit?: string | null;
  fcip?: string | null;
  fcba: string;
  lastupdate?: string;
  lasttime?: string;
  documentno: string;
  _rowKey?: string;
  [key: string]: unknown;
}

interface HarvestingQualityUploadParams {
  empcode?: string;
  fddate?: string;
  fddate_end?: string;
  fieldcode?: string;
  fcba?: string;
}

const EMPTY_PARAMS: HarvestingQualityUploadParams = {
  empcode: "", fddate: "", fddate_end: "", fieldcode: "", fcba: "",
};

const n = (v: string | number | undefined) => (v ? Number(v) : 0);

const createPayloadItem = (record: HarvestingQualityUploadData): Record<string, unknown> => ({
  empcode: record.empcode || "",
  fddate: record.fddate || "",
  fieldcode: record.fieldcode || "",
  under_ripe: n(record.under_ripe),
  overripe: n(record.overripe),
  abnormal: n(record.abnormal),
  long_stalk: n(record.long_stalk),
  eaten_by_rat: n(record.eaten_by_rat),
  unharvest_ffb: n(record.unharvest_ffb),
  uncollect_lf_circle: n(record.uncollect_lf_circle),
  uncollect_lf_piece: n(record.uncollect_lf_piece),
  unarrange_ffb: n(record.unarrange_ffb),
  unprune_frond: n(record.unprune_frond),
  qe_1_pelepah_tidak_disusun: n(record.qe_1_pelepah_tidak_disusun),
  qe_2_buah_matahari: n(record.qe_2_buah_matahari),
  qe_3_buah_busuk: n(record.qe_3_buah_busuk),
  qe_4_buah_mentah_diperam: n(record.qe_4_buah_mentah_diperam),
  qe_5_over_pruning: n(record.qe_5_over_pruning),
  qe_6_brondolan_tidak_dialas: n(record.qe_6_brondolan_tidak_dialas),
  qe_7_brondolan_kotor_sampah: n(record.qe_7_brondolan_kotor_sampah),
  qe_8_buah_dibelah: n(record.qe_8_buah_dibelah),
  qe_9: n(record.qe_9),
  qe_10: n(record.qe_10),
  qe_11_buah_mentah_a1: n(record.qe_11_buah_mentah_a1),
  qe_12_buah_tinggal_s: n(record.qe_12_buah_tinggal_s),
  qe_13_b_ggng_pjg_t_dipotong: n(record.qe_13_b_ggng_pjg_t_dipotong),
  qe_14: n(record.qe_14),
  qe_15: n(record.qe_15),
  qe_16_buah_mentah_kerani: n(record.qe_16_buah_mentah_kerani),
  qe_17_buah_mentah_mandor: n(record.qe_17_buah_mentah_mandor),
  fcentry: record.fcentry || null,
  fcedit: record.fcedit || null,
  fcip: record.fcip || null,
  fcba: record.fcba || "",
  documentno: record.documentno ? Number(record.documentno) : 0,
});

export default function HarvestingQualityUploadPage() {
  const localeTag = useLocale();
  const { isMgr, isAdmin, initCheck, userFcba } = useUploadPage();
  const { submit, submitting, submitProgress } = useBatchSubmit<HarvestingQualityUploadData>();

  const [formParams, setFormParams] = useState<HarvestingQualityUploadParams>(EMPTY_PARAMS);
  const [data, setData] = useState<HarvestingQualityUploadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async (overrideParams?: HarvestingQualityUploadParams) => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const params = overrideParams ?? formParams;
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) queryParams.append(key, value);
      }

      const url = `/api/harvesting-quality/upload${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setData(result.data);
      } else if (!result.success && result.message && !result.message.toLowerCase().includes("tidak ditemukan")) {
        setError(result.message || "Gagal mengambil data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initCheck) return;
    const initialParams = { ...EMPTY_PARAMS, fcba: userFcba };
    setFormParams((prev) => ({ ...prev, fcba: userFcba || prev.fcba }));
    fetchData(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCheck]);

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchData();
  };

  const handleResetFilter = () => {
    setFormParams(isAdmin ? EMPTY_PARAMS : { ...EMPTY_PARAMS, fcba: userFcba });
  };

  const dataWithKey = useMemo(
    () => data.map((item, idx) => ({ ...item, _rowKey: `${item.empcode}-${item.fddate}-${item.fieldcode}-${item.documentno}-${idx}` })),
    [data],
  );

  const filteredDataWithKey = useMemo(() => {
    if (!searchTerm.trim()) return dataWithKey;
    const search = searchTerm.toLowerCase();
    return dataWithKey.filter((r) =>
      r.empcode?.toLowerCase().includes(search) ||
      r.fddate?.toLowerCase().includes(search) ||
      r.fieldcode?.toLowerCase().includes(search) ||
      r.fcba?.toLowerCase().includes(search) ||
      r.documentno?.toLowerCase().includes(search),
    );
  }, [dataWithKey, searchTerm]);

  const summary = useMemo(() => ({
    count: filteredDataWithKey.length,
    totalUnderripe: filteredDataWithKey.reduce((s, r) => s + (Number(r.under_ripe) || 0), 0),
    totalOverripe: filteredDataWithKey.reduce((s, r) => s + (Number(r.overripe) || 0), 0),
    totalAbnormal: filteredDataWithKey.reduce((s, r) => s + (Number(r.abnormal) || 0), 0),
  }), [filteredDataWithKey]);

  const columns: TableColumn<HarvestingQualityUploadData>[] = useMemo(() => [
    { name: "#", width: "50px", cell: (_row, idx) => <span>{idx + 1}</span>, ignoreRowClick: true },
    { name: "Employee Code", selector: (r) => r.empcode || "-", sortable: true, width: "140px" },
    {
      name: "FD Date", sortable: true, width: "120px",
      selector: (r) => { try { return r.fddate ? new Date(r.fddate).toLocaleDateString(localeTag) : "-"; } catch { return r.fddate || "-"; } },
    },
    { name: "Field Code", selector: (r) => r.fieldcode || "-", sortable: true, width: "110px" },
    { name: "Document No", selector: (r) => r.documentno || "-", sortable: true, width: "120px" },
    { name: "Under Ripe", selector: (r) => (Number(r.under_ripe) || 0).toLocaleString(localeTag), sortable: true, width: "110px" },
    { name: "Overripe", selector: (r) => (Number(r.overripe) || 0).toLocaleString(localeTag), sortable: true, width: "110px" },
    { name: "Abnormal", selector: (r) => (Number(r.abnormal) || 0).toLocaleString(localeTag), sortable: true, width: "110px" },
    { name: "Long Stalk", selector: (r) => (Number(r.long_stalk) || 0).toLocaleString(localeTag), sortable: true, width: "110px" },
    { name: "Eaten by Rat", selector: (r) => (Number(r.eaten_by_rat) || 0).toLocaleString(localeTag), sortable: true, width: "120px" },
    { name: "Unharvest FFB", selector: (r) => (Number(r.unharvest_ffb) || 0).toLocaleString(localeTag), sortable: true, width: "120px" },
    { name: "Uncollect LF Circle", selector: (r) => (Number(r.uncollect_lf_circle) || 0).toLocaleString(localeTag), sortable: true, width: "140px" },
    { name: "Uncollect LF Piece", selector: (r) => (Number(r.uncollect_lf_piece) || 0).toLocaleString(localeTag), sortable: true, width: "135px" },
    { name: "Unarrange FFB", selector: (r) => (Number(r.unarrange_ffb) || 0).toLocaleString(localeTag), sortable: true, width: "125px" },
    { name: "Unprune Frond", selector: (r) => (Number(r.unprune_frond) || 0).toLocaleString(localeTag), sortable: true, width: "125px" },
    { name: "QE 1 - Pelepah", selector: (r) => (Number(r.qe_1_pelepah_tidak_disusun) || 0).toLocaleString(localeTag), sortable: true, width: "125px" },
    { name: "QE 2 - Buah Matahari", selector: (r) => (Number(r.qe_2_buah_matahari) || 0).toLocaleString(localeTag), sortable: true, width: "140px" },
    { name: "QE 3 - Buah Busuk", selector: (r) => (Number(r.qe_3_buah_busuk) || 0).toLocaleString(localeTag), sortable: true, width: "125px" },
    { name: "QE 4 - Mentah Diperam", selector: (r) => (Number(r.qe_4_buah_mentah_diperam) || 0).toLocaleString(localeTag), sortable: true, width: "145px" },
    { name: "QE 5 - Over Pruning", selector: (r) => (Number(r.qe_5_over_pruning) || 0).toLocaleString(localeTag), sortable: true, width: "135px" },
    { name: "FCBA", selector: (r) => r.fcba || "-", sortable: true, width: "100px" },
    { name: "Last Update", selector: (r) => r.lastupdate || "-", sortable: true, width: "150px" },
  ], [localeTag]);

  const handleSubmitHarvestingQuality = async () => {
    if (data.length === 0) { setError("Tidak ada data untuk dikirim."); return; }
    if (!window.confirm(`Yakin ingin mengirim ${data.length} record harvesting quality ke SIPS?\n\nTotal Under Ripe: ${summary.totalUnderripe}\nTotal Overripe: ${summary.totalOverripe}\nTotal Abnormal: ${summary.totalAbnormal}`)) return;

    setError(null);
    const { successCount, failMessages, successList } = await submit(data, {
      createPayloadItem,
      endpoint: "/api/harvesting-quality/submit",
      itemLabel: (item) => `Doc ${item.documentno} (${item.fieldcode})`,
    });

    const totalRecords = data.length;
    if (successCount === totalRecords) {
      alert(`✓ Sukses! Semua ${successCount} data harvesting quality berhasil dikirim ke SIPS.\n\nTotal Under Ripe: ${summary.totalUnderripe}\nTotal Overripe: ${summary.totalOverripe}\nTotal Abnormal: ${summary.totalAbnormal}`);
      setData([]);
    } else {
      let msg = `⚠️ Selesai dengan catatan.\nBerhasil: ${successCount}\nGagal: ${totalRecords - successCount}`;
      if (successList.length > 0) msg += `\n\nSuccessful Documents:\n${successList.join(", ")}`;
      if (failMessages.length > 0) {
        msg += `\n\nFailed:\n${failMessages.slice(0, 10).join("\n")}`;
        if (failMessages.length > 10) msg += `\n...dan ${failMessages.length - 10} lainnya`;
      }
      alert(msg);
      if (successCount > 0) await fetchData();
    }
  };

  if (initCheck && !isMgr && !isAdmin) return <AccessDenied />;
  if (!initCheck) return <div className="min-h-screen bg-base-100 p-6" />;

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Upload Harvesting Quality</h1>
            <p className="text-sm text-base-content/60 mt-1">Tampilkan dan upload data kualitas panenan TBS dari external API</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowFilters((s) => !s)}>
            {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
          </button>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Kode Karyawan", name: "empcode", placeholder: "06-000223-230221-0323" },
                { label: "Tanggal Mulai", name: "fddate", type: "date" },
                { label: "Tanggal Akhir", name: "fddate_end", type: "date" },
                { label: "Kode Blok", name: "fieldcode", placeholder: "I43, I45, dll" },
              ].map(({ label, name, placeholder, type = "text" }) => (
                <div key={name} className="form-group">
                  <label className="block text-sm font-medium text-base-content mb-1">{label}</label>
                  <input
                    type={type} name={name} placeholder={placeholder}
                    value={formParams[name as keyof HarvestingQualityUploadParams] ?? ""}
                    onChange={handleParamChange}
                    className="input input-bordered w-full input-sm"
                  />
                </div>
              ))}
              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  FCBA {userFcba && <span className="text-xs text-info ml-2">Default: {userFcba}</span>}
                </label>
                <input type="text" name="fcba" placeholder="MTE, PTE, dll" value={formParams.fcba ?? ""} onChange={handleParamChange} className="input input-bordered w-full input-sm" />
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-end gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm flex-1">
                  {loading ? <><span className="loading loading-spinner loading-xs" />Loading...</> : "🔍 Search"}
                </button>
                <button type="button" onClick={handleResetFilter} disabled={loading} className="btn btn-outline btn-sm flex-1">Reset</button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="alert alert-error mb-4 shadow-sm"><p className="font-semibold">❌ Error: {error}</p></div>}
        {loading && !showFilters && <div className="alert alert-info mb-4 shadow-sm"><span className="loading loading-spinner loading-sm" /><span>Mengambil data harvesting quality dari server...</span></div>}
        {!loading && data.length === 0 && !error && (
          <div className="alert mb-4 shadow-sm bg-base-200 border border-base-300">
            <div><p className="font-medium">Tidak ada data harvesting quality</p><p className="text-sm opacity-75">Silakan gunakan filter untuk mencari data kualitas panen.</p></div>
          </div>
        )}

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20"><div className="text-sm text-base-content/60">Total Records</div><div className="text-2xl font-bold text-primary">{summary.count}</div></div>
            <div className="bg-success/10 rounded-lg p-4 border border-success/20"><div className="text-sm text-base-content/60">Total Underripe</div><div className="text-2xl font-bold text-success">{summary.totalUnderripe.toLocaleString("id-ID")}</div></div>
            <div className="bg-info/10 rounded-lg p-4 border border-info/20"><div className="text-sm text-base-content/60">Total Overripe</div><div className="text-2xl font-bold text-info">{summary.totalOverripe.toLocaleString("id-ID")}</div></div>
            <div className="bg-warning/10 rounded-lg p-4 border border-warning/20"><div className="text-sm text-base-content/60">Total Abnormal</div><div className="text-2xl font-bold text-warning">{summary.totalAbnormal.toLocaleString("id-ID")}</div></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <button onClick={handleSubmitHarvestingQuality} disabled={data.length === 0 || submitting} className="btn btn-success">
            {submitting ? <><span className="loading loading-spinner loading-sm" />{submitProgress || "Submitting..."}</> : "📤 Submit ke SIPS"}
          </button>
          {data.length > 0 && <span className="text-sm font-medium">{filteredDataWithKey.length} dari {data.length} records</span>}
        </div>

        {/* Search Box */}
        {data.length > 0 && (
          <div className="mb-4 max-w-md relative">
            <input
              type="text" placeholder="Cari Employee Code, Field Code, Document No..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm w-full pl-10"
            />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content">✕</button>}
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
            {loading ? <div className="p-8"><SkeletonTable rows={10} /></div> : (
              <DataTable
                keyField="_rowKey" columns={columns} data={filteredDataWithKey}
                progressPending={loading} pagination paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 30, 100, 500]}
                dense highlightOnHover fixedHeader fixedHeaderScrollHeight="520px"
                persistTableHead responsive
                noDataComponent={<div className="py-8 text-base-content/70">Tidak ada data.</div>}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
