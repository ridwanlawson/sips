"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { SkeletonTable } from "@/app/components/skeletons";

interface HarvestingUploadData {
  spbno?: string;
  nospb: string;
  fieldcode?: string;
  receptiondate?: string;
  harvestdate?: string;
  cropcode?: string;
  productcode?: string;
  own?: string;
  vehicle?: string;
  driver?: string;
  mill?: string;
  agreementcode?: string | null;
  transporttype?: string;
  spb_type?: number;
  bunch?: number | string;
  bucket?: number | null;
  pressemester_abw?: number | string;
  bunch_estateweight?: number | string;
  fcentry?: string | null;
  fcedit?: string | null;
  fcip?: string | null;
  fcba?: string;
  chitno?: string;
  mill_weight_bruto?: number | string;
  mill_weight_gross?: number | string;
  mill_weight_tarra?: number | string;
  mill_weight_potongan?: number | string;
  mill_weight_netto?: number | string;
  mentah?: string | null;
  tankos?: string | null;
  hilang?: string | null;
  keterangan?: string;
  mill_weight_dtl?: number | string;
  bjr_chit?: number | string;
  lasttime?: string;
  lastupdate?: string;
  _rowKey?: string;
  [key: string]: unknown;
}

interface HarvestingUploadParams {
  nospb?: string;
  tanggal?: string;
  tanggal_end?: string;
  kode_kendaraan?: string;
  kode_karyawan_driver?: string;
  mill?: string;
  fcba?: string;
  chitno?: string;
}

export default function HarvestingUploadPage() {
  const [formParams, setFormParams] = useState<HarvestingUploadParams>({
    nospb: "",
    tanggal: "",
    tanggal_end: "",
    kode_kendaraan: "",
    kode_karyawan_driver: "",
    mill: "",
    fcba: "",
    chitno: "",
  });

  const [userDefaults, setUserDefaults] = useState({
    fcba: "",
  });

  const [data, setData] = useState<HarvestingUploadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMgr, setIsMgr] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initCheck, setInitCheck] = useState(false);

  const fetchData = async (overrideParams?: HarvestingUploadParams) => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const paramsToUse = overrideParams || formParams;

      // Build query string
      const queryParams = new URLSearchParams();
      if (paramsToUse.nospb) queryParams.append("nospb", paramsToUse.nospb);
      if (paramsToUse.tanggal)
        queryParams.append("tanggal", paramsToUse.tanggal);
      if (paramsToUse.tanggal_end)
        queryParams.append("tanggal_end", paramsToUse.tanggal_end);
      if (paramsToUse.kode_kendaraan)
        queryParams.append("kode_kendaraan", paramsToUse.kode_kendaraan);
      if (paramsToUse.kode_karyawan_driver)
        queryParams.append(
          "kode_karyawan_driver",
          paramsToUse.kode_karyawan_driver,
        );
      if (paramsToUse.mill) queryParams.append("mill", paramsToUse.mill);
      if (paramsToUse.fcba) queryParams.append("fcba", paramsToUse.fcba);
      if (paramsToUse.chitno) queryParams.append("chitno", paramsToUse.chitno);

      const queryString = queryParams.toString();
      const url = `/api/harvest/upload${queryString ? "?" + queryString : ""}`;

      console.log("Fetching harvesting data from:", url);

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        if (result.data && result.data.length > 0) {
          // TANPA DEDUPLICATION - Tampilkan SEMUA data dari API
          console.log(`✓ Total records from API: ${result.data.length}`);
          console.log("Sample data fields:", result.data[0]);

          setData(result.data);
        }
      } else {
        if (
          !result.message ||
          !result.message.toLowerCase().includes("tidak ditemukan")
        ) {
          setError(result.message || "Gagal mengambil data");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Baca default values dari cookie saat mount & check user level
  useEffect(() => {
    const readCookie = (name: string) => {
      if (typeof document === "undefined") return "";
      const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
      return m ? decodeURIComponent(m.pop() as string) : "";
    };

    const fcba =
      readCookie("user_Fcba") ||
      readCookie("user_FCBA") ||
      readCookie("user_fcba") ||
      "";

    const levelRaw =
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      "";
    const level = String(levelRaw).toUpperCase();
    setIsMgr(level === "MGR");
    setIsAdmin(level === "ADMIN" || level === "ADM");
    setInitCheck(true);

    setUserDefaults({ fcba });

    const initialParams: HarvestingUploadParams = {
      nospb: "",
      tanggal: "",
      tanggal_end: "",
      kode_kendaraan: "",
      kode_karyawan_driver: "",
      mill: "",
      fcba: fcba,
      chitno: "",
    };

    setFormParams((prev) => ({
      ...prev,
      fcba: fcba || prev.fcba,
    }));

    fetchData(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchData();
  };

  const handleResetFilter = () => {
    if (isAdmin) {
      setFormParams({
        nospb: "",
        tanggal: "",
        tanggal_end: "",
        kode_kendaraan: "",
        kode_karyawan_driver: "",
        mill: "",
        fcba: "",
        chitno: "",
      });
    } else {
      setFormParams((prev) => ({
        nospb: "",
        tanggal: "",
        tanggal_end: "",
        kode_kendaraan: "",
        kode_karyawan_driver: "",
        mill: "",
        fcba: userDefaults.fcba || prev.fcba,
        chitno: "",
      }));
    }
  };

  // Add row key untuk DataTable
  const dataWithKey = useMemo(() => {
    return data.map((item, idx) => ({
      ...item,
      _rowKey: `${item.nospb}-${item.chitno}-${idx}`,
    }));
  }, [data]);

  const filteredDataWithKey = useMemo(() => {
    if (!searchTerm.trim()) {
      return dataWithKey;
    }
    const search = searchTerm.toLowerCase();
    return dataWithKey.filter((record) => {
      return (
        record.nospb?.toLowerCase().includes(search) ||
        record.vehicle?.toLowerCase().includes(search) ||
        record.driver?.toLowerCase().includes(search) ||
        record.mill?.toLowerCase().includes(search) ||
        record.fcba?.toLowerCase().includes(search) ||
        record.chitno?.toLowerCase().includes(search) ||
        record.fieldcode?.toLowerCase().includes(search)
      );
    });
  }, [dataWithKey, searchTerm]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalBunch = filteredDataWithKey.reduce(
      (sum, row) => sum + (Number(row.bunch) || 0),
      0,
    );
    const totalEstateWeight = filteredDataWithKey.reduce(
      (sum, row) => sum + (Number(row.bunch_estateweight) || 0),
      0,
    );

    return {
      count: filteredDataWithKey.length,
      totalBunch,
      avgBunch:
        filteredDataWithKey.length > 0
          ? (totalBunch / filteredDataWithKey.length).toFixed(2)
          : 0,
      totalEstateWeight,
    };
  }, [filteredDataWithKey]);

  // Define columns untuk DataTable
  const columns: TableColumn<HarvestingUploadData>[] = useMemo(
    () => [
      {
        name: "#",
        width: "50px",
        cell: (_row, idx) => <span>{idx + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: "No SPB",
        selector: (row) => row.nospb || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Chit No",
        selector: (row) => row.chitno || "-",
        sortable: true,
        width: "120px",
      },
      {
        name: "Field Code",
        selector: (row) => row.fieldcode || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Reception Date",
        selector: (row) => {
          try {
            return row.receptiondate
              ? new Date(row.receptiondate).toLocaleDateString("id-ID")
              : "-";
          } catch {
            return row.receptiondate || "-";
          }
        },
        sortable: true,
        width: "130px",
      },
      {
        name: "Harvest Date",
        selector: (row) => {
          try {
            return row.harvestdate
              ? new Date(row.harvestdate).toLocaleDateString("id-ID")
              : "-";
          } catch {
            return row.harvestdate || "-";
          }
        },
        sortable: true,
        width: "130px",
      },
      {
        name: "Vehicle",
        selector: (row) => row.vehicle || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Driver",
        selector: (row) => row.driver || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Mill",
        selector: (row) => row.mill || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Crop Code",
        selector: (row) => row.cropcode || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Product Code",
        selector: (row) => row.productcode || "-",
        sortable: true,
        width: "120px",
      },
      {
        name: "Bunch",
        selector: (row) => {
          const val = Number(row.bunch) || 0;
          return val.toLocaleString("id-ID");
        },
        sortable: true,
        width: "100px",
      },
      {
        name: "Estate Weight (kg)",
        selector: (row) => {
          const val = Number(row.bunch_estateweight) || 0;
          return val.toLocaleString("id-ID");
        },
        sortable: true,
        width: "140px",
      },
      {
        name: "Mill Weight Bruto",
        selector: (row) => {
          const val = Number(row.mill_weight_bruto) || 0;
          return val.toLocaleString("id-ID");
        },
        sortable: true,
        width: "140px",
      },
      {
        name: "Mill Weight Netto",
        selector: (row) => {
          const val = Number(row.mill_weight_netto) || 0;
          return val.toLocaleString("id-ID");
        },
        sortable: true,
        width: "140px",
      },
      {
        name: "FCBA",
        selector: (row) => row.fcba || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Keterangan",
        selector: (row) => row.keterangan || "-",
        sortable: true,
        width: "150px",
      },
      {
        name: "Last Update",
        selector: (row) => row.lastupdate || "-",
        sortable: true,
        width: "150px",
      },
    ],
    [],
  );

  const handleSubmitHarvesting = async () => {
    if (data.length === 0) {
      setError(
        "Tidak ada data untuk dikirim. Silakan cari data terlebih dahulu.",
      );
      return;
    }

    if (
      !window.confirm(
        `Yakin ingin mengirim ${data.length} record harvesting ke SIPS?\n\nTotal Bunch: ${summary.totalBunch}\nTotal Estate Weight: ${summary.totalEstateWeight.toLocaleString("id-ID")} kg`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitProgress("Preparing data...");

    const BATCH_SIZE = 100;
    const totalRecords = data.length;
    let successCount = 0;
    const failMessages: string[] = [];
    const successList: string[] = [];

    try {
      const createPayloadItem = (record: HarvestingUploadData) => {
        const spbno = record.nospb || "";
        return {
          spbno: spbno,
          fieldcode: record.fieldcode || "",
          receptiondate: record.receptiondate || "",
          harvestdate: record.harvestdate || "",
          cropcode: record.cropcode || "",
          productcode: record.productcode || "",
          own: record.own || "",
          vehicle: record.vehicle || "",
          driver: record.driver || "",
          mill: record.mill || "",
          agreementcode: record.agreementcode || null,
          transporttype: record.transporttype || "",
          spb_type: record.spb_type || 0,
          bunch: record.bunch ? Number(record.bunch) : 0,
          bucket: record.bucket ? Number(record.bucket) : null,
          pressemester_abw: record.pressemester_abw
            ? Number(record.pressemester_abw)
            : 0,
          bunch_estateweight: record.bunch_estateweight
            ? Number(record.bunch_estateweight)
            : 0,
          fcentry: record.fcentry || null,
          fcedit: record.fcedit || null,
          fcip: record.fcip || null,
          fcba: record.fcba || "",
          chitno: record.chitno || "",
          mill_weight_bruto: record.mill_weight_bruto
            ? Number(record.mill_weight_bruto)
            : 0,
          mill_weight_gross: record.mill_weight_gross
            ? Number(record.mill_weight_gross)
            : 0,
          mill_weight_tarra: record.mill_weight_tarra
            ? Number(record.mill_weight_tarra)
            : 0,
          mill_weight_potongan: record.mill_weight_potongan
            ? Number(record.mill_weight_potongan)
            : 0,
          mill_weight_netto: record.mill_weight_netto
            ? Number(record.mill_weight_netto)
            : 0,
          mentah: record.mentah || null,
          tankos: record.tankos || null,
          hilang: record.hilang || null,
          keterangan: record.keterangan || "",
          mill_weight_dtl: record.mill_weight_dtl
            ? Number(record.mill_weight_dtl)
            : 0,
          bjr_chit: record.bjr_chit ? Number(record.bjr_chit) : 0,
        };
      };

      // Process in batches
      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);

        setSubmitProgress(
          `Submitting batch ${currentBatchNum}/${totalBatches} (${Math.min(i + BATCH_SIZE, totalRecords)}/${totalRecords})...`,
        );

        const recordsToSubmit = {
          data: batch.map(createPayloadItem),
        };

        try {
          const response = await fetch("/api/harvest/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(recordsToSubmit),
          });

          const result = await response.json();

          if (result.success) {
            successCount += batch.length;
            if (result.data) {
              successList.push(...result.data);
            }
          } else {
            throw new Error(result.message || "Batch failed");
          }
        } catch (batchErr) {
          console.error(`Batch ${currentBatchNum} failed:`, batchErr);

          setSubmitProgress(
            `Batch ${currentBatchNum} failed. Retrying item 1/${batch.length}...`,
          );

          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];

            try {
              const singlePayload = {
                data: [createPayloadItem(item)],
              };

              setSubmitProgress(
                `Retrying batch ${currentBatchNum} (Item ${j + 1}/${batch.length})...`,
              );

              const singleResponse = await fetch("/api/harvest/submit", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify(singlePayload),
              });

              const singleResp = await singleResponse.json();

              if (singleResp.success) {
                successCount++;
                if (singleResp.data) {
                  successList.push(...singleResp.data);
                }
              } else {
                failMessages.push(
                  `SPB ${item.nospb} (${item.chitno}): ${singleResp.message}`,
                );
              }
            } catch (singleErr) {
              const errMsg =
                singleErr instanceof Error
                  ? singleErr.message
                  : "Unknown error";
              failMessages.push(
                `SPB ${item.nospb} (${item.chitno}): ${errMsg}`,
              );
            }
          }
        }
      }

      setSubmitProgress("");
      if (successCount === totalRecords) {
        alert(
          `✓ Sukses! Semua ${successCount} data harvesting berhasil dikirim ke SIPS.\n\nTotal Bunch Submitted: ${summary.totalBunch}\nTotal Estate Weight: ${summary.totalEstateWeight.toLocaleString("id-ID")} kg`,
        );
        setData([]);
      } else {
        let msg = `⚠️ Selesai dengan catatan.\nBerhasil: ${successCount}\nGagal: ${totalRecords - successCount}`;

        if (successList.length > 0) {
          msg += `\n\nSuccessful SPBs:\n${successList.join(", ")}`;
        }

        if (failMessages.length > 0) {
          msg += `

Failed:\n${failMessages.slice(0, 10).join("\n")}`;
          if (failMessages.length > 10) {
            msg += `\n...dan ${failMessages.length - 10} lainnya`;
          }
        }

        alert(msg);

        if (successCount > 0) {
          await fetchData();
        }
      }
    } catch (err) {
      console.error("Submit critical error:", err);
      setError(
        `Critical Error: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    } finally {
      setSubmitting(false);
      setSubmitProgress("");
    }
  };

  if (initCheck && !isMgr && !isAdmin) {
    return (
      <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-bold text-error mb-4">Akses Ditolak</h1>
          <p className="text-base-content/70 mb-6">
            Halaman ini hanya dapat diakses oleh user dengan level <b>MGR</b> atau <b>ADM</b>.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!initCheck) {
    return <div className="min-h-screen bg-base-100 p-6"></div>;
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              Upload Harvesting SPB
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Tampilkan dan upload data panenan TBS dari external API
            </p>
          </div>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters((s) => !s)}
              title="Tampilkan / sembunyikan filter"
            >
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  No SPB
                </label>
                <input
                  type="text"
                  name="nospb"
                  placeholder="SPB2026004804"
                  value={formParams.nospb}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formParams.tanggal}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  name="tanggal_end"
                  value={formParams.tanggal_end}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Mill
                </label>
                <input
                  type="text"
                  name="mill"
                  placeholder="DOM, PPI, dll"
                  value={formParams.mill}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Kode Kendaraan
                </label>
                <input
                  type="text"
                  name="kode_kendaraan"
                  placeholder="L9770CL"
                  value={formParams.kode_kendaraan}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Driver
                </label>
                <input
                  type="text"
                  name="kode_karyawan_driver"
                  placeholder="Nama driver"
                  value={formParams.kode_karyawan_driver}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  FCBA
                  {userDefaults.fcba && (
                    <span className="text-xs text-info ml-2">
                      Default: {userDefaults.fcba}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="fcba"
                  placeholder="PTE, MTE, dll"
                  value={formParams.fcba}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Chit Number
                </label>
                <input
                  type="text"
                  name="chitno"
                  placeholder="TBS2026004804"
                  value={formParams.chitno}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-end gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Loading...
                    </>
                  ) : (
                    "🔍 Search"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  disabled={loading}
                  className="btn btn-outline btn-sm flex-1"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4 shadow-sm">
            <div className="w-full">
              <p className="font-semibold">❌ Error: {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !showFilters && (
          <div className="alert alert-info mb-4 shadow-sm">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Mengambil data harvesting dari server...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && !error && (
          <div className="alert mb-4 shadow-sm bg-base-200 border border-base-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-base-content shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <p className="font-medium">Tidak ada data harvesting</p>
              <p className="text-sm opacity-75">
                Silakan gunakan filter untuk mencari data SPB panenan.
              </p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="text-sm text-base-content/60">Total SPB</div>
              <div className="text-2xl font-bold text-primary">
                {summary.count}
              </div>
            </div>
            <div className="bg-success/10 rounded-lg p-4 border border-success/20">
              <div className="text-sm text-base-content/60">Total Bunch</div>
              <div className="text-2xl font-bold text-success">
                {summary.totalBunch.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-info/10 rounded-lg p-4 border border-info/20">
              <div className="text-sm text-base-content/60">Avg Bunch/SPB</div>
              <div className="text-2xl font-bold text-info">
                {Number(summary.avgBunch).toFixed(1)}
              </div>
            </div>
            <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
              <div className="text-sm text-base-content/60">
                Total Estate Wt
              </div>
              <div className="text-2xl font-bold text-warning">
                {(summary.totalEstateWeight / 1000).toFixed(1)}T
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <button
            onClick={handleSubmitHarvesting}
            disabled={data.length === 0 || submitting}
            className="btn btn-success"
            title="Submit semua data harvesting ke database SIPS"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {submitProgress || "Submitting..."}
              </>
            ) : (
              "📤 Submit ke SIPS"
            )}
          </button>

          {data.length > 0 && (
            <span className="text-sm font-medium">
              {filteredDataWithKey.length} dari {data.length} records
            </span>
          )}
        </div>

        {/* Search Box */}
        {data.length > 0 && (
          <div className="mb-4">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-base-content/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                type="text"
                placeholder="Cari No SPB, Vehicle, Driver, Mill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm w-full pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  title="Clear search"
                >
                  <svg
                    className="h-4 w-4 text-base-content/40 hover:text-base-content"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
            {searchTerm && (
              <p className="text-xs text-base-content/60 mt-2">
                Menampilkan {filteredDataWithKey.length} dari{" "}
                {dataWithKey.length} records
              </p>
            )}
          </div>
        )}

        {/* Empty search result */}
        {data.length > 0 && searchTerm && filteredDataWithKey.length === 0 && (
          <div className="alert mb-4 shadow-sm bg-base-200 border border-base-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-base-content shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <div>
              <p className="font-medium">
                Tidak ada hasil untuk &quot;{searchTerm}&quot;
              </p>
              <p className="text-sm opacity-75">
                Coba gunakan kata kunci yang berbeda.
              </p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
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
                  data={filteredDataWithKey}
                  progressPending={loading}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[10, 30, 100, 500]}
                  dense
                  highlightOnHover
                  fixedHeader
                  fixedHeaderScrollHeight="520px"
                  persistTableHead
                  responsive
                  noDataComponent={
                    <div className="py-8 text-base-content/70">
                      Tidak ada data.
                    </div>
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
