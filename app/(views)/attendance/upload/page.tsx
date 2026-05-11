"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "@/app/components/dynamic-data-table";
import type { TableColumn } from "react-data-table-component";
import {
  AttendanceUploadData,
  AttendanceUploadParams,
  fetchAttendanceUpload,
  insertAttendanceData,
} from "@/utils/attendanceUploadService";
import { SkeletonTable } from "@/app/components/skeletons";
import { useLocale } from "@/hooks/useLocale";

export default function AttendanceUploadPage() {
  const localeTag = useLocale();
  const [formParams, setFormParams] = useState<AttendanceUploadParams>({
    tanggal: "",
    tanggal_end: "",
    fcba: "",
    afdeling: "",
    gangcode: "",
  });

  const [userDefaults, setUserDefaults] = useState({
    fcba: "",
    afdeling: "",
  });

  const [data, setData] = useState<AttendanceUploadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMgr, setIsMgr] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initCheck, setInitCheck] = useState(false);

  const fetchData = async (overrideParams?: AttendanceUploadParams) => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const paramsToUse = overrideParams || formParams;
      const response = await fetchAttendanceUpload(paramsToUse);

      if (response.success) {
        if (response.data && response.data.length > 0) {
          // Deduplicate data berdasarkan linenokey untuk avoid React key warning
          const uniqueData = Array.from(
            new Map(
              response.data.map((item) => [item.linenokey, item]),
            ).values(),
          );

          console.log(
            `Total records: ${response.data.length}, After dedup: ${uniqueData.length}`,
          );

          setData(uniqueData);
        }
        // Jika data kosong, tidak perlu set error, biarkan saja kosong
      } else {
        // Hanya set error jika memang ada error serius (bukan data tidak ditemukan)
        if (
          !response.message ||
          !response.message.toLowerCase().includes("tidak ditemukan")
        ) {
          setError(response.message || "Gagal mengambil data");
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
    const afdeling =
      readCookie("user_Afdeling") ||
      readCookie("user_AFDELING") ||
      readCookie("user_afdeling") ||
      "";

    // Check level MGR and ADMIN
    const levelRaw =
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      "";
    const level = String(levelRaw).toUpperCase();
    console.log(
      "[DEBUG] User level from cookie:",
      levelRaw,
      "→ parsed:",
      level,
    );
    setIsMgr(level === "MGR");
    setIsAdmin(level === "ADMIN" || level === "ADM");
    setInitCheck(true);

    setUserDefaults({ fcba, afdeling });

    // Construct initial params
    const initialParams: AttendanceUploadParams = {
      tanggal: "",
      tanggal_end: "",
      fcba: fcba,
      afdeling: afdeling,
      gangcode: "",
    };

    setFormParams((prev) => ({
      ...prev,
      fcba: fcba || prev.fcba,
      afdeling: afdeling || prev.afdeling,
    }));

    // Auto execute search on mount
    // Use a separate async function to avoid circular dependencies
    (async () => {
      setLoading(true);
      setError(null);
      setData([]);

      try {
        const response = await fetchAttendanceUpload(initialParams);

        if (response.success) {
          if (response.data && response.data.length > 0) {
            const uniqueData = Array.from(
              new Map(
                response.data.map((item) => [item.linenokey, item]),
              ).values(),
            );
            setData(uniqueData);
          }
        } else {
          if (
            !response.message ||
            !response.message.toLowerCase().includes("tidak ditemukan")
          ) {
            setError(response.message || "Gagal mengambil data");
          }
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    })();
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
      // Admin: reset semua field
      setFormParams({
        tanggal: "",
        tanggal_end: "",
        fcba: "",
        afdeling: "",
        gangcode: "",
      });
    } else {
      // Non-admin: reset semua kecuali fcba dan afdeling (keep user defaults)
      setFormParams((prev) => ({
        tanggal: "",
        tanggal_end: "",
        fcba: userDefaults.fcba || prev.fcba,
        afdeling: userDefaults.afdeling || prev.afdeling,
        gangcode: "",
      }));
    }
  };

  // Add row key untuk DataTable
  const dataWithKey = useMemo(() => {
    return data.map((item, idx) => ({
      ...item,
      _rowKey: `${item.linenokey}-${item.id}-${idx}`,
    }));
  }, [data]);

  const filteredDataWithKey = useMemo(() => {
    if (!searchTerm.trim()) {
      return dataWithKey;
    }
    const search = searchTerm.toLowerCase();
    return dataWithKey.filter((record) => {
      return (
        record.employeecode?.toLowerCase().includes(search) ||
        record.gangcode?.toLowerCase().includes(search) ||
        record.jobcode?.toLowerCase().includes(search) ||
        record.afdeling?.toLowerCase().includes(search) ||
        record.attendance?.toLowerCase().includes(search) ||
        record.locationcode?.toLowerCase().includes(search) ||
        record.locationtype?.toLowerCase().includes(search) ||
        record.fcba?.toLowerCase().includes(search) ||
        record.reference?.toLowerCase().includes(search) ||
        record.remarks?.toLowerCase().includes(search) ||
        String(record.linenokey).includes(search) ||
        String(record.id).includes(search)
      );
    });
  }, [dataWithKey, searchTerm]);

  // Define columns untuk DataTable
  const columns: TableColumn<AttendanceUploadData>[] = useMemo(
    () => [
      {
        name: "#",
        width: "50px",
        cell: (_row, idx) => <span>{idx + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: "ID",
        selector: (row) => row.id,
        sortable: true,
        width: "80px",
      },
      {
        name: "Line Key",
        selector: (row) => row.linenokey,
        sortable: true,
        width: "100px",
      },
      {
        name: "Employee Code",
        selector: (row) => row.employeecode || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "Job Code",
        selector: (row) => row.jobcode || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Attendance",
        selector: (row) => row.attendance || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Date",
        selector: (row) => {
          try {
            return new Date(row.fddate).toLocaleDateString(localeTag);
          } catch {
            return row.fddate || "-";
          }
        },
        sortable: true,
        width: "120px",
      },
      {
        name: "Afdeling",
        selector: (row) => row.afdeling || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Gang Code",
        selector: (row) => row.gangcode || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Location Type",
        selector: (row) => row.locationtype || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "Location Code",
        selector: (row) => row.locationcode || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "Mandays",
        selector: (row) => row.mandays || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Othrs",
        selector: (row) => row.othrs || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Rate",
        selector: (row) => row.rate || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Unit",
        selector: (row) => row.unit || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Output",
        selector: (row) => row.output || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "OT Hours",
        selector: (row) => row.overtime_hours || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Remarks",
        selector: (row) => row.remarks || "-",
        sortable: true,
        width: "150px",
      },
      {
        name: "Reference",
        selector: (row) => row.reference || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "FCBA",
        selector: (row) => row.fcba || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: "Status",
        selector: (row) => row.rowstate || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Last Update",
        selector: (row) => row.lastupdate || "-",
        sortable: true,
        width: "150px",
      },
      {
        name: "Entry By",
        selector: (row) => row.fcentry || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "Edit By",
        selector: (row) => row.fcedit || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: "KG Brondolan",
        selector: (row) => row.kg_brondolan || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "KG Janjang",
        selector: (row) => row.kg_janjang || "-",
        sortable: true,
        width: "130px",
      },
      {
        name: "BJR",
        selector: (row) => row.bjr || "-",
        sortable: true,
        width: "100px",
      },
    ],
    [localeTag],
  );

  const handleSubmitAttendance = async () => {
    if (data.length === 0) {
      setError(
        "Tidak ada data untuk dikirim. Silakan cari data terlebih dahulu.",
      );
      return;
    }

    if (
      !window.confirm(`Yakin ingin mengirim ${data.length} record ke SIPS?`)
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

    try {
      // Helper to format payload item
      const createPayloadItem = (record: AttendanceUploadData) => {
        let formattedFddate = record.fddate;
        try {
          if (record.fddate && typeof record.fddate === "string") {
            if (record.fddate.includes("T")) {
              formattedFddate = record.fddate
                .replace("T", " ")
                .substring(0, 19);
            } else if (record.fddate.length === 10) {
              // Append time if only date is present
              formattedFddate = `${record.fddate} 00:00:00`;
            }
          }
        } catch (e) {
          console.warn("Date formatting error:", e);
        }

        return {
          // REQUIRED FIELDS
          gangcode: record.gangcode || "",
          fddate: formattedFddate || "",
          employeecode: record.employeecode || "",
          attendance: record.attendance || "",
          fcba: record.fcba || "",
          linenokey: Number(record.linenokey || 0),
          documentno: Number(record.documentno || 0),

          // OPTIONAL FIELDS
          supervision_1: record.supervision_1 || null,
          supervision_2: record.supervision_2 || null,
          supervision_3: record.supervision_3 || null,
          supervision_4: record.supervision_4 || null,
          supervision_5: record.supervision_5 || null,
          jobcode: record.jobcode || null,
          locationtype: record.locationtype || null,
          locationcode: record.locationcode || null,
          mandays: record.mandays ? Number(record.mandays) : 0,
          othrs: record.othrs ? Number(record.othrs) : 0,
          rate: record.rate ? Number(record.rate) : 0,
          unit: record.unit ? Number(record.unit) : 0,
          output: record.output ? Number(record.output) : 0,
          reference: record.reference || null,
          remarks: record.remarks || "SIPS MOBILE",
          fcentry: record.fcentry || null,
          fcedit: record.fcedit || null,
          fcip: record.fcip || null,
          lastupdate: record.lastupdate || null,
          lasttime: record.lasttime || null,
          overtime_hours: record.overtime_hours
            ? Number(record.overtime_hours)
            : 0,
          type_overtime: record.type_overtime
            ? Number(record.type_overtime)
            : 0,
          chargejob: record.chargejob || null,
          chargetype: record.chargetype || null,
          chargecode: record.chargecode || null,
          bucket: record.bucket || null,
          spbno: record.spbno || null,
          kg_janjang: record.kg_janjang ? Number(record.kg_janjang) : 0,
          kg_brondolan: record.kg_brondolan ? Number(record.kg_brondolan) : 0,
          rowstate: record.rowstate || null,
          document_classification: record.document_classification
            ? Number(record.document_classification)
            : null,
          basis_bm: record.basis_bm ? Number(record.basis_bm) : 0,
          bjr: record.bjr ? Number(record.bjr) : 0,
          sourcetime: record.sourcetime || null,
          janjang: 0,
          generate: "SIPS MOBILE GENERATE",
          generatetime: new Date()
            .toISOString()
            .replace("T", " ")
            .substring(0, 19),
          fieldcode: record.fieldcode || null,
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
          const response = await insertAttendanceData(
            recordsToSubmit as { data: Record<string, unknown>[] },
          );
          if (response.success) {
            successCount += batch.length;
          } else {
            // Batch level error logic - if backend says failure for whole batch
            throw new Error(response.message || "Batch failed");
          }
        } catch (batchErr) {
          console.error(`Batch ${currentBatchNum} failed:`, batchErr);

          // RETRY STRATEGY: Try 1 by 1 to identify problematic rows
          setSubmitProgress(
            `Batch ${currentBatchNum} failed. Retrying item 1/${batch.length}...`,
          );

          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const globalIndex = i + j + 1; // 1-based index

            try {
              const singlePayload = {
                data: [createPayloadItem(item)],
              };

              setSubmitProgress(
                `Retrying batch ${currentBatchNum} (Item ${j + 1}/${batch.length})...`,
              );
              const singleResp = await insertAttendanceData(
                singlePayload as { data: Record<string, unknown>[] },
              );

              if (singleResp.success) {
                successCount++;
              } else {
                failMessages.push(
                  `Baris ${globalIndex}: ${singleResp.message}`,
                );
              }
            } catch (singleErr) {
              const errMsg =
                singleErr instanceof Error
                  ? singleErr.message
                  : "Unknown error";
              failMessages.push(`Baris ${globalIndex} Error: ${errMsg}`);
            }
          }
        }
      }

      setSubmitProgress("");
      if (successCount === totalRecords) {
        alert(`✓ Sukses! Semua ${successCount} data berhasil dikirim ke SIPS.`);
        setData([]); // Clear list on full success
      } else {
        // Partial success or failure
        const msg = `⚠️ Selesai dengan catatan.\nBerhasil: ${successCount}\nGagal: ${totalRecords - successCount}\n\nDetail Error:\n${failMessages.slice(0, 20).join("\n")}${failMessages.length > 20 ? "\n...dan " + (failMessages.length - 20) + " lainnya" : ""}`;
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
            Halaman ini hanya dapat diakses oleh user dengan level <b>MGR</b>{" "}
            atau <b>ADM</b>.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!initCheck) {
    return <div className="min-h-screen bg-base-100 p-6"></div>; // Loading blank
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              Upload Attendance
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Tampilkan dan upload data attendance dari external API
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
                  FCBA
                  {userDefaults.fcba && (
                    <span className="text-xs text-info ml-2">
                      (Default: {userDefaults.fcba})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="fcba"
                  placeholder="e.g., MTE"
                  value={formParams.fcba}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Afdeling
                  {userDefaults.afdeling && (
                    <span className="text-xs text-info ml-2">
                      (Default: {userDefaults.afdeling})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="afdeling"
                  placeholder="e.g., AFD-01"
                  value={formParams.afdeling}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-base-content mb-1">
                  Gang Code
                </label>
                <input
                  type="text"
                  name="gangcode"
                  placeholder="e.g., PN013"
                  value={formParams.gangcode}
                  onChange={handleParamChange}
                  className="input input-bordered w-full input-sm"
                />
              </div>

              <div className="flex items-end gap-2">
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
                    "Search"
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
              <details className="mt-3 border-t border-base-content/20 pt-3">
                <summary className="text-xs cursor-pointer font-medium opacity-75 select-none">
                  📋 Debug Info (Klik untuk expand)
                </summary>
                <div className="mt-2 text-xs opacity-75 space-y-2">
                  <div className="bg-base-200 p-2 rounded">
                    <p className="font-mono text-xs">
                      External API:
                      http://dev.skj.my.id:82/api/report/upload-attendance
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Kemungkinan Penyebab:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Token authentication expired atau invalid</li>
                      <li>External API server error atau sedang maintenance</li>
                      <li>Parameter API tidak valid</li>
                      <li>Network/Koneksi timeout</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Cara Debug:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Tekan F12 → buka tab &quot;Console&quot;</li>
                      <li>
                        Cari log dengan prefix &quot;ATTENDANCE UPLOAD
                        DEBUG&quot;
                      </li>
                      <li>
                        Buka tab &quot;Network&quot; → cari request ke
                        /api/attendance/upload
                      </li>
                      <li>Cek response details dan error message</li>
                      <li>
                        Jika perlu login ulang: refresh halaman & login kembali
                      </li>
                    </ol>
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !showFilters && (
          <div className="alert alert-info mb-4 shadow-sm">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Mengambil data dari server...</span>
          </div>
        )}

        {/* Empty State - Data tidak ditemukan (tanpa error) */}
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
              <p className="font-medium">Data tidak ditemukan</p>
              <p className="text-sm opacity-75">
                Silakan gunakan filter untuk mencari data, atau coba dengan
                parameter yang berbeda.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <button
            onClick={handleSubmitAttendance}
            disabled={data.length === 0 || submitting}
            className="btn btn-success"
            title="Submit semua data attendance ke database SIPS"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {submitProgress || "Submitting..."}
              </>
            ) : (
              "📤 Submit to SIPS"
            )}
          </button>

          {data.length > 0 && (
            <span className="text-sm font-medium">
              Total Data: {data.length} records
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
                placeholder="Cari berdasarkan Employee Code, Gang, Job, Afdeling, dll..."
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
                Coba gunakan kata kunci yang berbeda atau{" "}
                <button
                  onClick={() => setSearchTerm("")}
                  className="link link-primary"
                >
                  hapus pencarian
                </button>
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
