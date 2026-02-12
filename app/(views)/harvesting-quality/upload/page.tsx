"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { SkeletonTable } from "@/app/components/skeletons";

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

export default function HarvestingQualityUploadPage() {
  const [formParams, setFormParams] = useState<HarvestingQualityUploadParams>({
    empcode: "",
    fddate: "",
    fddate_end: "",
    fieldcode: "",
    fcba: "",
  });

  const [userDefaults, setUserDefaults] = useState({
    fcba: "",
  });

  const [data, setData] = useState<HarvestingQualityUploadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMgr, setIsMgr] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initCheck, setInitCheck] = useState(false);

  const fetchData = async (overrideParams?: HarvestingQualityUploadParams) => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const paramsToUse = overrideParams || formParams;

      // Build query string
      const queryParams = new URLSearchParams();
      if (paramsToUse.empcode)
        queryParams.append("empcode", paramsToUse.empcode);
      if (paramsToUse.fddate) queryParams.append("fddate", paramsToUse.fddate);
      if (paramsToUse.fddate_end)
        queryParams.append("fddate_end", paramsToUse.fddate_end);
      if (paramsToUse.fieldcode)
        queryParams.append("fieldcode", paramsToUse.fieldcode);
      if (paramsToUse.fcba) queryParams.append("fcba", paramsToUse.fcba);

      const queryString = queryParams.toString();
      const url = `/api/harvesting-quality/upload${queryString ? "?" + queryString : ""}`;

      console.log("Fetching harvesting quality data from:", url);

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

    const initialParams: HarvestingQualityUploadParams = {
      empcode: "",
      fddate: "",
      fddate_end: "",
      fieldcode: "",
      fcba: fcba,
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
        empcode: "",
        fddate: "",
        fddate_end: "",
        fieldcode: "",
        fcba: "",
      });
    } else {
      setFormParams((prev) => ({
        empcode: "",
        fddate: "",
        fddate_end: "",
        fieldcode: "",
        fcba: userDefaults.fcba || prev.fcba,
      }));
    }
  };

  // Add row key untuk DataTable
  const dataWithKey = useMemo(() => {
    return data.map((item, idx) => ({
      ...item,
      _rowKey: `${item.empcode}-${item.fddate}-${item.fieldcode}-${item.documentno}-${idx}`,
    }));
  }, [data]);

  const filteredDataWithKey = useMemo(() => {
    if (!searchTerm.trim()) {
      return dataWithKey;
    }
    const search = searchTerm.toLowerCase();
    return dataWithKey.filter((record) => {
      return (
        record.empcode?.toLowerCase().includes(search) ||
        record.fddate?.toLowerCase().includes(search) ||
        record.fieldcode?.toLowerCase().includes(search) ||
        record.fcba?.toLowerCase().includes(search) ||
        record.documentno?.toLowerCase().includes(search)
      );
    });
  }, [dataWithKey, searchTerm]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalRecords = filteredDataWithKey.length;
    const totalUnderripe = filteredDataWithKey.reduce(
      (sum, row) => sum + (Number(row.under_ripe) || 0),
      0,
    );
    const totalOverripe = filteredDataWithKey.reduce(
      (sum, row) => sum + (Number(row.overripe) || 0),
      0,
    );
    const totalAbnormal = filteredDataWithKey.reduce(
      (sum, row) => sum + (Number(row.abnormal) || 0),
      0,
    );

    return {
      count: totalRecords,
      totalUnderripe,
      totalOverripe,
      totalAbnormal,
    };
  }, [filteredDataWithKey]);

  // Cell dengan Tooltip component
  const CellWithTooltip = ({
    value,
    maxLength = 30,
  }: {
    value: string | number | undefined | null;
    maxLength?: number;
  }) => {
    const displayValue = value ? String(value) : "-";
    const needsTooltip = displayValue.length > maxLength;

    return (
      <div
        title={needsTooltip ? displayValue : ""}
        style={{ cursor: needsTooltip ? "help" : "default" }}
      >
        {needsTooltip
          ? `${displayValue.substring(0, maxLength)}...`
          : displayValue}
      </div>
    );
  };

  // Define columns untuk DataTable - SEMUA FIELD dari API
  const columns: TableColumn<HarvestingQualityUploadData>[] = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    // Get all unique keys from data
    const allKeys = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "_rowKey") allKeys.add(key);
      });
    });

    // Priority fields to show first
    const priorityFields = [
      "#",
      "empcode",
      "fddate",
      "fieldcode",
      "documentno",
      "under_ripe",
      "overripe",
      "abnormal",
      "long_stalk",
      "eaten_by_rat",
      "unharvest_ffb",
      "uncollect_lf_circle",
      "uncollect_lf_piece",
      "unarrange_ffb",
      "unprune_frond",
      "qe_1_pelepah_tidak_disusun",
      "qe_2_buah_matahari",
      "qe_3_buah_busuk",
      "qe_4_buah_mentah_diperam",
      "qe_5_over_pruning",
      "qe_6_brondolan_tidak_dialas",
      "qe_7_brondolan_kotor_sampah",
      "qe_8_buah_dibelah",
      "qe_9",
      "qe_10",
      "qe_11_buah_mentah_a1",
      "qe_12_buah_tinggal_s",
      "qe_13_b_ggng_pjg_t_dipotong",
      "qe_14",
      "qe_15",
      "qe_16_buah_mentah_kerani",
      "qe_17_buah_mentah_mandor",
      "fcba",
      "lasttime",
    ];

    // Sorted unique keys
    const sortedKeys = [
      "#",
      ...priorityFields.filter((k) => k !== "#" && allKeys.has(k)),
      ...Array.from(allKeys).filter(
        (k) => !priorityFields.includes(k) && k !== "_rowKey",
      ),
    ];

    // Generate columns
    const generatedColumns: TableColumn<HarvestingQualityUploadData>[] =
      sortedKeys.map((key) => {
        if (key === "#") {
          return {
            name: "#",
            width: "50px",
            cell: (_row, idx) => <span>{idx + 1}</span>,
            ignoreRowClick: true,
          };
        }

        // Check if numeric field
        const isNumeric =
          allKeys.has(key) &&
          (key.toLowerCase().includes("ripe") ||
            key.toLowerCase().includes("stalk") ||
            key.toLowerCase().includes("rat") ||
            key.toLowerCase().includes("ffb") ||
            key.toLowerCase().includes("uncollect") ||
            key.toLowerCase().includes("unarrange") ||
            key.toLowerCase().includes("unprune") ||
            key.startsWith("qe_"));

        // Check if date field
        const isDate = key.toLowerCase().includes("date");

        return {
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          selector: (row): string | number => {
            const val = (row as unknown as Record<string, unknown>)[key];
            if (isDate && val) {
              try {
                return new Date(val as string).toLocaleDateString("id-ID");
              } catch {
                return String(val);
              }
            }
            return String(val || "-");
          },
          sortable: true,
          width: "140px",
          wrap: true,
          cell: (row) => {
            const val = (row as unknown as Record<string, unknown>)[key];

            if (isDate && val) {
              try {
                const dateStr = new Date(val as string).toLocaleDateString(
                  "id-ID",
                );
                return <CellWithTooltip value={dateStr} maxLength={20} />;
              } catch {
                return <CellWithTooltip value={String(val)} maxLength={20} />;
              }
            }

            if (isNumeric && val !== undefined && val !== null) {
              return (
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {Number(val).toLocaleString("id-ID")}
                </div>
              );
            }

            return (
              <CellWithTooltip value={String(val) || "-"} maxLength={25} />
            );
          },
        };
      });

    return generatedColumns;
  }, [data]);

  const handleSubmitHarvestingQuality = async () => {
    if (data.length === 0) {
      setError(
        "Tidak ada data untuk dikirim. Silakan cari data terlebih dahulu.",
      );
      return;
    }

    if (
      !window.confirm(
        `Yakin ingin mengirim ${data.length} record harvesting quality ke SIPS?\n\nTotal Under Ripe: ${summary.totalUnderripe}\nTotal Overripe: ${summary.totalOverripe}\nTotal Abnormal: ${summary.totalAbnormal}`,
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
      const createPayloadItem = (record: HarvestingQualityUploadData) => {
        return {
          empcode: record.empcode || "",
          fddate: record.fddate || "",
          fieldcode: record.fieldcode || "",
          under_ripe: record.under_ripe ? Number(record.under_ripe) : 0,
          overripe: record.overripe ? Number(record.overripe) : 0,
          abnormal: record.abnormal ? Number(record.abnormal) : 0,
          long_stalk: record.long_stalk ? Number(record.long_stalk) : 0,
          eaten_by_rat: record.eaten_by_rat ? Number(record.eaten_by_rat) : 0,
          unharvest_ffb: record.unharvest_ffb
            ? Number(record.unharvest_ffb)
            : 0,
          uncollect_lf_circle: record.uncollect_lf_circle
            ? Number(record.uncollect_lf_circle)
            : 0,
          uncollect_lf_piece: record.uncollect_lf_piece
            ? Number(record.uncollect_lf_piece)
            : 0,
          unarrange_ffb: record.unarrange_ffb
            ? Number(record.unarrange_ffb)
            : 0,
          unprune_frond: record.unprune_frond
            ? Number(record.unprune_frond)
            : 0,
          qe_1_pelepah_tidak_disusun: record.qe_1_pelepah_tidak_disusun
            ? Number(record.qe_1_pelepah_tidak_disusun)
            : 0,
          qe_2_buah_matahari: record.qe_2_buah_matahari
            ? Number(record.qe_2_buah_matahari)
            : 0,
          qe_3_buah_busuk: record.qe_3_buah_busuk
            ? Number(record.qe_3_buah_busuk)
            : 0,
          qe_4_buah_mentah_diperam: record.qe_4_buah_mentah_diperam
            ? Number(record.qe_4_buah_mentah_diperam)
            : 0,
          qe_5_over_pruning: record.qe_5_over_pruning
            ? Number(record.qe_5_over_pruning)
            : 0,
          qe_6_brondolan_tidak_dialas: record.qe_6_brondolan_tidak_dialas
            ? Number(record.qe_6_brondolan_tidak_dialas)
            : 0,
          qe_7_brondolan_kotor_sampah: record.qe_7_brondolan_kotor_sampah
            ? Number(record.qe_7_brondolan_kotor_sampah)
            : 0,
          qe_8_buah_dibelah: record.qe_8_buah_dibelah
            ? Number(record.qe_8_buah_dibelah)
            : 0,
          qe_9: record.qe_9 ? Number(record.qe_9) : 0,
          qe_10: record.qe_10 ? Number(record.qe_10) : 0,
          qe_11_buah_mentah_a1: record.qe_11_buah_mentah_a1
            ? Number(record.qe_11_buah_mentah_a1)
            : 0,
          qe_12_buah_tinggal_s: record.qe_12_buah_tinggal_s
            ? Number(record.qe_12_buah_tinggal_s)
            : 0,
          qe_13_b_ggng_pjg_t_dipotong: record.qe_13_b_ggng_pjg_t_dipotong
            ? Number(record.qe_13_b_ggng_pjg_t_dipotong)
            : 0,
          qe_14: record.qe_14 ? Number(record.qe_14) : 0,
          qe_15: record.qe_15 ? Number(record.qe_15) : 0,
          qe_16_buah_mentah_kerani: record.qe_16_buah_mentah_kerani
            ? Number(record.qe_16_buah_mentah_kerani)
            : 0,
          qe_17_buah_mentah_mandor: record.qe_17_buah_mentah_mandor
            ? Number(record.qe_17_buah_mentah_mandor)
            : 0,
          fcentry: record.fcentry || null,
          fcedit: record.fcedit || null,
          fcip: record.fcip || null,
          fcba: record.fcba || "",
          documentno: record.documentno ? Number(record.documentno) : 0,
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
          const response = await fetch("/api/harvesting-quality/submit", {
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

              const singleResponse = await fetch(
                "/api/harvesting-quality/submit",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify(singlePayload),
                },
              );

              const singleResp = await singleResponse.json();

              if (singleResp.success) {
                successCount++;
                if (singleResp.data) {
                  successList.push(...singleResp.data);
                }
              } else {
                failMessages.push(
                  `Doc ${item.documentno} (${item.fieldcode}): ${singleResp.message}`,
                );
              }
            } catch (singleErr) {
              const errMsg =
                singleErr instanceof Error
                  ? singleErr.message
                  : "Unknown error";
              failMessages.push(
                `Doc ${item.documentno} (${item.fieldcode}): ${errMsg}`,
              );
            }
          }
        }
      }

      setSubmitProgress("");
      if (successCount === totalRecords) {
        alert(
          `✓ Sukses! Semua ${successCount} data harvesting quality berhasil dikirim ke SIPS.\n\nTotal Under Ripe: ${summary.totalUnderripe}\nTotal Overripe: ${summary.totalOverripe}\nTotal Abnormal: ${summary.totalAbnormal}`,
        );
        setData([]);
      } else {
        let msg = `⚠️ Selesai dengan catatan.\nBerhasil: ${successCount}\nGagal: ${totalRecords - successCount}`;

        if (successList.length > 0) {
          msg += `\n\nSuccessful Documents:\n${successList.join(", ")}`;
        }

        if (failMessages.length > 0) {
          msg += `\n\nFailed:\n${failMessages.slice(0, 10).join("\n")}`;
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

  if (initCheck && !isMgr) {
    return (
      <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-bold text-error mb-4">Akses Ditolak</h1>
          <p className="text-base-content/70 mb-6">
            Halaman ini hanya dapat diakses oleh user dengan level <b>MGR</b>.
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
              Upload Harvesting Quality
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Tampilkan dan upload data kualitas panenan TBS dari external API
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Kode Karyawan
                </label>
                <input
                  type="text"
                  name="empcode"
                  placeholder="06-000223-230221-0323"
                  value={formParams.empcode}
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
                  name="fddate"
                  value={formParams.fddate}
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
                  name="fddate_end"
                  value={formParams.fddate_end}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Kode Blok
                </label>
                <input
                  type="text"
                  name="fieldcode"
                  placeholder="I43, I45, dll"
                  value={formParams.fieldcode}
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
                  placeholder="MTE, PTE, dll"
                  value={formParams.fcba}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-end gap-2">
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
            <span>Mengambil data harvesting quality dari server...</span>
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
              <p className="font-medium">Tidak ada data harvesting quality</p>
              <p className="text-sm opacity-75">
                Silakan gunakan filter untuk mencari data kualitas panen.
              </p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="text-sm text-base-content/60">Total Records</div>
              <div className="text-2xl font-bold text-primary">
                {summary.count}
              </div>
            </div>
            <div className="bg-success/10 rounded-lg p-4 border border-success/20">
              <div className="text-sm text-base-content/60">
                Total Underripe
              </div>
              <div className="text-2xl font-bold text-success">
                {summary.totalUnderripe.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-info/10 rounded-lg p-4 border border-info/20">
              <div className="text-sm text-base-content/60">Total Overripe</div>
              <div className="text-2xl font-bold text-info">
                {summary.totalOverripe.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
              <div className="text-sm text-base-content/60">Total Abnormal</div>
              <div className="text-2xl font-bold text-warning">
                {summary.totalAbnormal.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <button
            onClick={handleSubmitHarvestingQuality}
            disabled={data.length === 0 || submitting}
            className="btn btn-success"
            title="Submit semua data harvesting quality ke database SIPS"
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
                placeholder="Cari Employee Code, Field Code, Document No..."
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
          <div className="rounded-lg border border-base-200 shadow-sm bg-base-100 w-full">
            {loading ? (
              <div className="p-8">
                <SkeletonTable rows={10} />
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                  responsive={false}
                  customStyles={{
                    table: {
                      style: {
                        width: "100%",
                        minWidth: "max-content",
                      },
                    },
                    headRow: {
                      style: {
                        backgroundColor: "#1F2937",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        padding: "8px 0",
                        minHeight: "40px",
                      },
                    },
                    rows: {
                      style: {
                        fontSize: "0.875rem",
                        minHeight: "40px",
                        padding: "0",
                        verticalAlign: "middle",
                      },
                    },
                    cells: {
                      style: {
                        padding: "8px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    },
                    pagination: {
                      style: {
                        backgroundColor: "transparent",
                        minHeight: "48px",
                      },
                    },
                  }}
                  noDataComponent={
                    <div className="py-8 text-base-content/70">
                      Tidak ada data.
                    </div>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
