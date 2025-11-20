"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
} from "react";
import Image from "next/image";
import DataTable, { TableColumn } from "react-data-table-component";
import { logoutAndRedirect } from "@/utils/authHelper";

/* =========================
   T Y P E S
========================= */
type Absensi = {
  _rowKey?: string;
  id: string;
  tanggal: string;
  kode_karyawan_mandor?: string | null;
  kode_karyawan: string;
  time_in?: string | null; // "YYYY-MM-DD HH:mm:ss"
  time_out?: string | null; // "YYYY-MM-DD HH:mm:ss"
  location_in?: string | null;
  location_out?: string | null;
  pengancakan?: string | null;
  total_late_time?: string | null; // "HH:MM"
  go_home_early?: string | null; // "HH:MM"
  attendance_type: "REGULAR" | "ASSISTENSI";
  attendance: "KJ" | "WH" | "WS" | "MK" | "ML" | "P1" | "KB" | "OT";
  exception_case?: string | null;
  no_ba_exca?: string | null; // URL/filename PDF
  fcba?: string | null;
  section?: string | null;
  gang?: string | null;
  fcba_destination?: string | null;
  id_device?: string | null;
  mac_address?: string | null;
  images?: string | null;
  status_attendance?: string | null;
  mandays?: number | string | null;
  namakaryawan?: string | null;
};

type UserLevel = "ADM" | "MGR" | "AST" | "OTHER";

type RowSelectedState<T> = {
  allSelected: boolean;
  selectedCount: number;
  selectedRows: T[];
};

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
};

/* =========================
   D A I S Y  C H E C K B O X
========================= */
const DaisyCheckbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <input
      type="checkbox"
      ref={ref}
      {...rest}
      className={`checkbox checkbox-lg ${className ?? ""}`}
    />
  );
});
DaisyCheckbox.displayName = "DaisyCheckbox";

/* =========================
   U T I L S
========================= */
const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? decodeURIComponent(m.pop() as string) : null;
};

const buildMapUrl = (loc: string) => {
  const s = (loc || "").trim();
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (m) {
    const lat = m[1];
    const lng = m[3];
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    s
  )}`;
};

const formatDateDMY = (raw: string | null | undefined): string => {
  if (!raw) return "-";
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  const onlyDate = trimmed.split(" ")[0];
  const parts = onlyDate.split("-");
  if (parts.length !== 3) return trimmed;
  const [y, m, d] = parts;
  if (!y || !m || !d) return trimmed;
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

const LocationButton: React.FC<{ loc?: string | null; label?: string }> = ({
  loc,
  label,
}) => {
  if (!loc) return <>-</>;
  const href = buildMapUrl(loc);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-ghost btn-xs gap-1"
      title={loc}
    >
      <span aria-hidden>📍</span> {label ?? "Maps"}
    </a>
  );
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const extractArrayData = <T,>(payload: unknown): T[] => {
  if (!isObject(payload)) return [];
  if ("ok" in payload && payload.ok === true && "data" in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
    if (
      isObject(d) &&
      "data" in d &&
      Array.isArray((d as { data: unknown }).data)
    ) {
      return (d as { data: T[] }).data;
    }
  }
  return [];
};

/* =========================
   M A I N   C O M P
========================= */
export default function AttendanceApproval() {
  const [items, setItems] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showAlert = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setAlert({ msg, type });
      setTimeout(() => setAlert(null), 4000);
    },
    []
  );

  const [userLevel, setUserLevel] = useState<UserLevel>("OTHER");
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");
  const [scopeReady, setScopeReady] = useState(false);

  const [selectedRows, setSelectedRows] = useState<Absensi[]>([]);
  const [clearSelectedToggle, setClearSelectedToggle] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<"Approved" | "Reject" | null>(
    null
  );

  // map kode mandor -> "kode - nama"
  const [mandorLabelMap, setMandorLabelMap] = useState<Record<string, string>>(
    {}
  );

  /* ===== Bootstrap dari cookies (FCBA, Section, Level user) ===== */
  useEffect(() => {
    const ckHome =
      readCookie("user_Fcba") ||
      readCookie("user_FCBA") ||
      readCookie("user_fcba") ||
      "";
    setHomeFcba(ckHome);

    const ckSection =
      readCookie("user_Section") ||
      readCookie("user_SECTION") ||
      readCookie("user_section") ||
      readCookie("user_Afdeling") ||
      readCookie("user_afdeling") ||
      "";
    setHomeSection(ckSection);

    const levelRaw =
      (
        readCookie("user_Level") ||
        readCookie("user_LEVEL") ||
        readCookie("user_level") ||
        ""
      ).toUpperCase() || "OTHER";

    if (levelRaw === "ADM" || levelRaw === "MGR" || levelRaw === "AST") {
      setUserLevel(levelRaw);
    } else {
      setUserLevel("OTHER");
    }

    setScopeReady(true);
  }, []);

  /* ===== Ambil data karyawan untuk mapping Mandor ===== */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/karyawans", { credentials: "include" });
        const j: unknown = await r.json();
        const rows = extractArrayData<EmployeesApiRow>(j);

        const map: Record<string, string> = {};
        for (const it of rows) {
          const code = String(it.fccode ?? "").trim();
          if (!code) continue;
          const name = typeof it.fcname === "string" ? it.fcname.trim() : "";
          const label = name ? `${code} - ${name}` : code;
          if (!map[code]) map[code] = label;
        }
        setMandorLabelMap(map);
      } catch (e) {
        console.warn("Gagal fetch /api/karyawans untuk Mandor:", e);
      }
    })();
  }, []);

  /* ===== Load list pending approval ===== */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // scope berdasarkan level user
      if ((userLevel === "MGR" || userLevel === "AST") && homeFcba) {
        params.append("fcba", homeFcba);
      }
      if (userLevel === "AST" && homeSection) {
        params.append("afdeling", homeSection);
      }

      const qs = params.toString();
      const res = await fetch(`/api/attendance${qs ? `?${qs}` : ""}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          setItems([]);
          setLoading(false);
          return;
        }
        if (res.status === 401) {
          await logoutAndRedirect();
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const json: unknown = await res.json();
      const raw = extractArrayData<Absensi>(json);

      // hanya data yang belum Approved dan belum Reject
      const pending = raw.filter((row) => {
        const st = (row.status_attendance || "").toLowerCase();
        return st !== "approved" && st !== "reject";
      });

      // hilangkan duplikat by ID + tambah _rowKey
      const byId = new Map<string, Absensi>();
      for (const row of pending) {
        if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
      }
      const unique = Array.from(byId.values());

      const seen = new Set<string>();
      const withKey = unique.map((it, idx) => {
        const candidate = [
          it.id || "",
          it.kode_karyawan || "",
          (it.tanggal || "").split(" ")[0],
          String(idx),
        ].join("|");
        let key = candidate;
        while (seen.has(key)) key = `${key}_`;
        seen.add(key);
        return { ...it, _rowKey: key };
      });

      setItems(withKey);
    } catch (e) {
      console.error(e);
      showAlert("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, userLevel, homeFcba, homeSection]);

  useEffect(() => {
    if (!scopeReady) return;
    void fetchList();
  }, [scopeReady, fetchList]);

  /* ===== Seleksi baris (checkbox) ===== */
  const handleRowSelectedChange = (state: RowSelectedState<Absensi>) => {
    setSelectedRows(state.selectedRows);
  };

  const hasSelection = selectedRows.length > 0;

  /* ===== Bulk Approve / Reject ===== */
  const handleBulkUpdate = async (newStatus: "Approved" | "Reject") => {
    if (!hasSelection) return;

    const confirmMsg =
      newStatus === "Approved"
        ? `Yakin ingin meng-Approve ${selectedRows.length} data terpilih?`
        : `Yakin ingin me-Reject ${selectedRows.length} data terpilih?`;

    if (!window.confirm(confirmMsg)) return;

    setBulkStatus(newStatus);
    try {
      const ids = selectedRows.map((r) => r.id).filter(Boolean);

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/attendance/${id}/status`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ status_attendance: newStatus }),
            });

            if (res.status === 401) {
              await logoutAndRedirect();
              return { ok: false, error: "Unauthorized" };
            }

            const j: unknown = await res.json().catch(() => ({}));
            if (!res.ok) {
              return { ok: false, error: `HTTP ${res.status}`, detail: j };
            }
            if (!isObject(j) || !("ok" in j) || j.ok !== true) {
              return { ok: false, error: "Response tidak valid", detail: j };
            }
            return { ok: true };
          } catch (err) {
            console.error(err);
            return { ok: false, error: "Fetch gagal", detail: err };
          }
        })
      );

      const total = results.length;
      const gagal = results.filter((r) => !r.ok).length;
      const sukses = total - gagal;

      if (sukses > 0) {
        showAlert(
          `Berhasil mengubah status ${sukses} data menjadi ${newStatus}.`,
          "success"
        );
      }
      if (gagal > 0) {
        showAlert(
          `Beberapa data gagal diubah (${gagal} dari ${total}).`,
          "error"
        );
      }

      await fetchList();
      setSelectedRows([]);
      setClearSelectedToggle((prev) => !prev);
    } catch (e) {
      console.error(e);
      showAlert("Terjadi kesalahan saat update status", "error");
    } finally {
      setBulkStatus(null);
    }
  };

  /* ===== Quick search lokal ===== */
  const filteredItems = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((it) =>
      [
        it.namakaryawan,
        it.kode_karyawan,
        it.kode_karyawan_mandor,
        it.fcba,
        it.fcba_destination,
        it.section,
        it.gang,
        it.attendance_type,
        it.attendance,
        it.no_ba_exca,
        it.id_device,
        it.mac_address,
        it.location_in,
        it.location_out,
        it.pengancakan,
        it.mandays,
        it.status_attendance,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [q, items]);

  /* ===== Kolom tabel ===== */
  const columns: TableColumn<Absensi>[] = useMemo(
    () => [
      {
        name: (
          <span title="Status persetujuan absensi (Planned/Approved/Reject)">
            Status
          </span>
        ),
        selector: (r) => r.status_attendance ?? "-",
        sortable: true,
        width: "120px",
        cell: (r) => {
          const st = (r.status_attendance || "").toLowerCase();
          const badgeClass =
            st === "planned"
              ? "badge-warning"
              : st === "approved"
              ? "badge-success"
              : st === "reject"
              ? "badge-error"
              : "badge-ghost";
          return (
            <span className={`badge ${badgeClass}`}>
              {r.status_attendance ?? "-"}
            </span>
          );
        },
      },
      {
        name: <span title="Nomor urut baris">#</span>,
        width: "56px",
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: <span title="Tanggal absensi (DD-MM-YYYY)">Tanggal</span>,
        selector: (r) => (r.tanggal || "").split(" ")[0],
        sortable: true,
        width: "110px",
        cell: (r) => {
          const raw = (r.tanggal || "").split(" ")[0];
          return <span title={raw}>{formatDateDMY(raw)}</span>;
        },
      },
      {
        name: <span title="Nama dan kode karyawan">Karyawan</span>,
        style: { flexGrow: 2 as number, minWidth: "220px" },
        width: "220px",
        sortable: true,
        selector: (r) => r.namakaryawan ?? "",
        cell: (r) => (
          <div className="min-w-0">
            <div
              className="font-semibold truncate"
              title={r.namakaryawan || "-"}
            >
              {r.namakaryawan || "-"}
            </div>
            <div
              className="text-xs opacity-70 truncate"
              title={r.kode_karyawan || ""}
            >
              {r.kode_karyawan}
            </div>
          </div>
        ),
      },
      {
        name: <span title="Mandor (atasan langsung)">Mandor</span>,
        sortable: true,
        width: "200px",
        selector: (r) => r.kode_karyawan_mandor || "",
        cell: (r) => {
          const code = r.kode_karyawan_mandor || "";
          if (!code) return <>-</>;
          const label = mandorLabelMap[code] || code;
          const [fccode, fullname] = label.includes(" - ")
            ? label.split(" - ", 2)
            : [label, ""];
          return (
            <div className="min-w-0">
              <div className="font-medium truncate" title={fullname || "-"}>
                {fullname || "-"}
              </div>
              <div className="text-xs opacity-70 truncate" title={fccode}>
                {fccode}
              </div>
            </div>
          );
        },
      },
      {
        name: <span title="FCBA asal (kebun/estate)">FCBA</span>,
        selector: (r) => r.fcba ?? "-",
        sortable: true,
        width: "100px",
      },
      {
        name: <span title="Afdeling / Section">Section</span>,
        selector: (r) => r.section || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: <span title="Kode gang kerja">Gang</span>,
        selector: (r) => r.gang || "-",
        sortable: true,
        width: "90px",
      },
      {
        name: <span title="Jenis absensi (REGULAR / ASSISTENSI)">Type</span>,
        selector: (r) => r.attendance_type,
        sortable: true,
        width: "130px",
        cell: (r) => (
          <span className="badge badge-outline">{r.attendance_type}</span>
        ),
      },
      {
        name: <span title="Kode kehadiran (KJ, WH, WS, dll)">Attd</span>,
        selector: (r) => r.attendance,
        sortable: true,
        width: "80px",
      },
      {
        name: <span title="Jam masuk (HH:MM)">Masuk</span>,
        selector: (r) =>
          r.time_in ? r.time_in.split(" ")[1]?.slice(0, 5) || r.time_in : "-",
        sortable: true,
        width: "110px",
      },
      {
        name: <span title="Jam pulang (HH:MM)">Pulang</span>,
        selector: (r) =>
          r.time_out
            ? r.time_out.split(" ")[1]?.slice(0, 5) || r.time_out
            : "-",
        sortable: true,
        width: "110px",
      },
      {
        name: <span title="Total keterlambatan (jam:menit)">Late</span>,
        selector: (r) => r.total_late_time || "-",
        sortable: true,
        width: "90px",
      },
      {
        name: <span title="Total pulang cepat (jam:menit)">Home Early</span>,
        selector: (r) => r.go_home_early || "-",
        sortable: true,
        width: "100px",
      },
      {
        name: (
          <span title="Pengancakan diambil dari NOANCAK karyawan">
            Pengancakan
          </span>
        ),
        selector: (r) => r.pengancakan || "-",
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: "145px" },
      },
      {
        name: <span title="HK (mandays)">HK</span>,
        selector: (r) => (r.mandays != null ? String(r.mandays) : "-"),
        sortable: true,
        width: "90px",
      },
      {
        name: <span title="FCBA tujuan (khusus ASSISTENSI)">Dest</span>,
        selector: (r) => r.fcba_destination || "-",
        sortable: true,
        width: "110px",
      },
      {
        name: <span title="Lokasi koordinat masuk (Google Maps)">Loc In</span>,
        style: { flexGrow: 1.2 as number, minWidth: "140px" },
        sortable: false,
        cell: (r) => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_in} />
          </div>
        ),
      },
      {
        name: (
          <span title="Lokasi koordinat pulang (Google Maps)">Loc Out</span>
        ),
        style: { flexGrow: 1.2 as number, minWidth: "140px" },
        sortable: false,
        cell: (r) => (
          <div className="flex items-center gap-2">
            <LocationButton loc={r.location_out} />
          </div>
        ),
      },
      {
        name: (
          <span title="Exception Case (alasan/keterangan khusus)">Exc</span>
        ),
        selector: (r) => r.exception_case || "-",
        sortable: true,
        style: { flexGrow: 1.1 as number, minWidth: "160px" },
      },
      {
        name: <span title="Nomor BA EXCA (link ke PDF)">BA EXCA</span>,
        selector: (r) => r.no_ba_exca || "-",
        sortable: true,
        width: "120px",
        cell: (r) =>
          r.no_ba_exca ? (
            <a
              href={r.no_ba_exca}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
              title="Buka PDF BA EXCA"
            >
              PDF
            </a>
          ) : (
            "-"
          ),
      },
      {
        name: <span title="Informasi device yang digunakan absen">Device</span>,
        selector: (r) => r.id_device || "-",
        sortable: true,
        width: "180px",
      },
      {
        name: <span title="Pseudo MAC address device">MAC</span>,
        selector: (r) => r.mac_address || "-",
        sortable: true,
        width: "160px",
      },
      {
        name: <span title="Foto pendukung absensi (bila ada)">Foto</span>,
        width: "90px",
        cell: (r) =>
          r.images ? (
            <a
              href={r.images}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka foto"
            >
              <img
                src={r.images}
                alt="foto"
                className="rounded-lg ring-1 ring-base-300 object-cover w-10 h-10 bg-base-200"
                loading="lazy"
              />
            </a>
          ) : (
            "-"
          ),
        ignoreRowClick: true,
      },
    ],
    [mandorLabelMap]
  );

  // 👇 cast sekali, tanpa `any`, supaya TypeScript & ESLint sama-sama aman
  const checkboxComponent = DaisyCheckbox as unknown as React.ReactNode;

  // Client-side UX guard: after cookies are read (scopeReady) show a friendly
  // access denied message for users who are not ADM or MGR. The real access
  // enforcement is done server-side in `middleware.ts` but this prevents
  // a flicker of the page and gives a clearer message.
  const allowed = userLevel === "ADM" || userLevel === "MGR";
  if (scopeReady && !allowed) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
        <div className="p-6 max-w-screen-lg mx-auto">
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="mt-2 text-base-content/80">
          Halaman ini hanya dapat diakses oleh user dengan level <b>ADM</b> atau{" "}
          <b>MGR</b>.
        </p>
        <div className="mt-4">
          <a href="/dashboard" className="btn btn-primary btn-sm">
            Kembali ke Dashboard
          </a>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
      {/* Toast */}
      <div className="toast toast-top right-4 z-50">
        {alert && (
          <div
            className={`alert ${
              alert.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <div>
              <span className="font-semibold">
                {alert.type === "success" ? "Berhasil" : "Gagal"}
              </span>
              <span className="ml-2 whitespace-pre-line">{alert.msg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman Approval Absensi"
          >
            Approval Absensi
          </h1>
          <p className="text-sm opacity-70">
            Menampilkan hanya data absensi yang belum <b>Approved</b> dan belum{" "}
            <b>Reject</b>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => fetchList()}
            title="Refresh data absensi pending"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar: Bulk action + Search */}
      <div className="mb-3 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-success btn-sm"
            disabled={!hasSelection || bulkStatus !== null}
            onClick={() => handleBulkUpdate("Approved")}
            title="Ubah status data terpilih menjadi Approved"
          >
            {bulkStatus === "Approved" ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                <span>Proses Approve...</span>
              </>
            ) : (
              "Approve Terpilih"
            )}
          </button>
          <button
            className="btn btn-error btn-sm"
            disabled={!hasSelection || bulkStatus !== null}
            onClick={() => handleBulkUpdate("Reject")}
            title="Ubah status data terpilih menjadi Reject"
          >
            {bulkStatus === "Reject" ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                <span>Proses Reject...</span>
              </>
            ) : (
              "Reject Terpilih"
            )}
          </button>
          <button
            className="btn btn-sm"
            disabled={!hasSelection || bulkStatus !== null}
            onClick={() => {
              setSelectedRows([]);
              setClearSelectedToggle((prev) => !prev);
            }}
            title="Kosongkan pilihan (uncheck semua)"
          >
            Clear Centang
          </button>
        </div>

        <input
          className="input input-bordered w-full md:w-80"
          placeholder="Cari (nama, kode, FCBA, mandor, lokasi...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          title="Pencarian cepat di data pending"
        />
      </div>

      {/* DataTable */}
      <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
        <div className="min-w-[900px] md:min-w-0">
          <DataTable
            keyField="_rowKey"
            columns={columns}
            data={filteredItems}
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
                Tidak ada data pending untuk di-approve / reject.
              </div>
            }
            selectableRows
            selectableRowsComponent={checkboxComponent}
            onSelectedRowsChange={handleRowSelectedChange}
            clearSelectedRows={clearSelectedToggle}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
