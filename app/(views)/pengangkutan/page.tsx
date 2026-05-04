"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import DataTable, { TableColumn } from "react-data-table-component";
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from "@/utils/imageHelper";
import { isUnauthenticatedJson, logoutAndRedirect } from "@/utils/authHelper";

/* =========================
   T Y P E S
========================= */
type Pengangkutan = {
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
  totaljanjang?: string | null;
  output?: string | null;
  janjangnormal?: string | null;
  brondolan?: string | null;
  status_pengangkutan?: string | null;
  card_id?: string | null;
  flag?: string | null;
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
  flag: string;
}>;

/* =========================
   U T I L S
========================= */
const getTodayISO = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateDMY = (raw: string | null | undefined): string => {
  if (!raw) return "-";
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  const onlyDate = trimmed.split(" ")[0];
  const parts = onlyDate.split("-");
  if (parts.length !== 3) return trimmed;
  const [y, m, d] = parts;
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? decodeURIComponent(m.pop() as string) : null;
};

/* =========================
   M A I N
========================= */
export default function PengangkutanPage() {
  const [items, setItems] = useState<Pengangkutan[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const today = getTodayISO();
    return {
      tanggal: today,
      tanggal_end: today,
      nopengangkutan: "",
      nospb: "",
      nodokumen: "",
      kode_karyawan_kerani: "",
      kode_karyawan_driver: "",
      type_pengangkutan: "",
      kode_kendaraan: "",
      fcba: "",
      pabrik_tujuan: "",
      afdeling: "",
      tph: "",
      fieldcode: "",
      status_pengangkutan: "",
      flag: "",
    };
  });

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState<"ADM" | "MGR" | "AST" | "OTHER">(
    "OTHER",
  );
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");

  // Toast
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const showAlert = (msg: string, type: "success" | "error" = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Initialize user defaults
  useEffect(() => {
    const ckHome = readCookie("user_Fcba") || readCookie("user_FCBA") || "";
    setHomeFcba(ckHome);

    const ckSection =
      readCookie("user_Section") || readCookie("user_SECTION") || "";
    setHomeSection(ckSection);

    const levelRaw = (
      (readCookie("user_Level") || readCookie("user_LEVEL") || "") as string
    ).toUpperCase();
    const resolvedLevel =
      levelRaw === "ADM"
        ? "ADM"
        : levelRaw === "MGR"
          ? "MGR"
          : levelRaw === "AST"
            ? "AST"
            : "OTHER";
    setUserLevel(resolvedLevel);
  }, []);

  useEffect(() => {
    if (userLevel === "MGR") {
      setFilters((f) => ({ ...f, fcba: homeFcba }));
    } else if (userLevel === "AST") {
      setFilters((f) => ({ ...f, fcba: homeFcba, afdeling: homeSection }));
    }
  }, [userLevel, homeFcba, homeSection]);

  const fetchData = useCallback(
    async (overrideFilters?: Filters) => {
      setLoading(true);
      try {
        const current = overrideFilters || filters;
        const p = new URLSearchParams();
        if (current.tanggal) p.set("tanggal", current.tanggal as string);
        if (current.tanggal_end)
          p.set("tanggal_end", current.tanggal_end as string);
        if (current.nopengangkutan)
          p.set("nopengangkutan", current.nopengangkutan as string);
        if (current.nospb) p.set("nospb", current.nospb as string);
        if (current.nodokumen) p.set("nodokumen", current.nodokumen as string);
        if (current.kode_karyawan_kerani)
          p.set("kode_karyawan_kerani", current.kode_karyawan_kerani as string);
        if (current.kode_karyawan_driver)
          p.set("kode_karyawan_driver", current.kode_karyawan_driver as string);
        if (current.type_pengangkutan)
          p.set("type_pengangkutan", current.type_pengangkutan as string);
        if (current.kode_kendaraan)
          p.set("kode_kendaraan", current.kode_kendaraan as string);
        if (current.fcba) p.set("fcba", current.fcba as string);
        if (current.pabrik_tujuan)
          p.set("pabrik_tujuan", current.pabrik_tujuan as string);
        if (current.afdeling) p.set("afdeling", current.afdeling as string);
        if (current.tph) p.set("tph", current.tph as string);
        if (current.fieldcode) p.set("fieldcode", current.fieldcode as string);
        if (current.status_pengangkutan)
          p.set("status_pengangkutan", current.status_pengangkutan as string);
        if (current.flag) p.set("flag", current.flag as string);

        const res = await fetch(`/api/pengangkutans?${p.toString()}`, {
          credentials: "include",
        });

        if (res.status === 404) {
          setItems([]);
          setLoading(false);
          return;
        }

        if (res.status === 401) {
          await logoutAndRedirect();
          return;
        }

        const json = await res.json();
        if (isUnauthenticatedJson(json)) {
          await logoutAndRedirect();
          return;
        }
        // Example API returns { success: true, data: [...] }
        if (json && (json.success === true || json.ok === true)) {
          const data = json.data || json.rows || [];
          setItems(data as Pengangkutan[]);
        } else {
          showAlert(
            json.message || json.error || "Gagal mengambil data",
            "error",
          );
        }
      } catch (e) {
        console.error(e);
        showAlert("Terjadi kesalahan jaringan", "error");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ===== Quick search lokal ===== */
  const filtered = useMemo(() => {
    let res = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      res = items.filter((it) =>
        [
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
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s)),
      );
    }
    return res.map((item, index) => ({ ...item, _index: index + 1 }));
  }, [q, items]);

  const columns: TableColumn<Pengangkutan & { _index: number }>[] = [
    {
      name: <span title="Nomor urut baris">#</span>,
      selector: (r) => r._index,
      width: "60px",
    },
    {
      name: <span title="Nomor pengangkutan">No Pengangkutan</span>,
      selector: (r) => r.nopengangkutan,
      sortable: true,
      width: "220px",
    },
    {
      name: <span title="Nomor SPB">No SPB</span>,
      selector: (r) => r.nospb || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: <span title="Nomor dokumen">No Dokumen</span>,
      selector: (r) => r.nodokumen || "-",
      sortable: true,
      width: "160px",
    },
    {
      name: <span title="Tanggal pengangkutan (DD-MM-YYYY)">Tanggal</span>,
      selector: (r) => r.tanggal || "-",
      format: (r) => formatDateDMY(r.tanggal),
      sortable: true,
      width: "120px",
    },
    {
      name: <span title="Kerani (nama dan kode)">Kerani</span>,
      selector: (r) => r.nama_karyawan_kerani || r.kode_karyawan_kerani || "-",
      sortable: true,
      width: "220px",
      cell: (r) => (
        <div>
          <div className="font-bold">{r.nama_karyawan_kerani}</div>
          <div className="text-xs text-gray-500">{r.kode_karyawan_kerani}</div>
        </div>
      ),
    },
    {
      name: <span title="Driver (nama dan kode)">Driver</span>,
      selector: (r) => r.nama_karyawan_driver || r.kode_karyawan_driver || "-",
      sortable: true,
      width: "220px",
      cell: (r) => (
        <div>
          <div className="font-bold">{r.nama_karyawan_driver}</div>
          <div className="text-xs text-gray-500">{r.kode_karyawan_driver}</div>
        </div>
      ),
    },
    {
      name: <span title="Tipe pengangkutan">Type</span>,
      selector: (r) => String(r.type_pengangkutan || ""),
      sortable: true,
      width: "90px",
    },
    {
      name: <span title="Kode / Nama kendaraan">Kendaraan</span>,
      selector: (r) => r.nama_kendaraan || r.kode_kendaraan || "-",
      sortable: true,
      width: "160px",
    },
    {
      name: <span title="FCBA asal (kebun/estate)">FCBA</span>,
      selector: (r) => r.fcba || "-",
      sortable: true,
      width: "100px",
    },
    {
      name: <span title="Pabrik tujuan">Pabrik</span>,
      selector: (r) => r.pabrik_tujuan || "-",
      sortable: true,
      width: "100px",
    },
    {
      name: <span title="Afdeling / Section">Afdeling</span>,
      selector: (r) => r.afdeling || "-",
      sortable: true,
      width: "100px",
    },
    {
      name: <span title="TPH (Tempat Penampungan Hasil)">TPH</span>,
      selector: (r) => r.tph || "-",
      sortable: true,
      width: "80px",
    },
    {
      name: <span title="Field code">Field</span>,
      selector: (r) => r.fieldcode || "-",
      sortable: true,
      width: "110px",
    },
    {
      name: "Total Janjang",
      selector: (r) => r.totaljanjang || "-",
      sortable: true,
      width: "120px",
      style: { justifyContent: "center" },
    },
    {
      name: "Output",
      selector: (r) => r.output || "-",
      sortable: true,
      width: "100px",
      style: { justifyContent: "center" },
    },
    {
      name: <span title="Janjang Normal">Janjang Normal</span>,
      selector: (r) => r.janjangnormal || "-",
      sortable: true,
      width: "120px",
      style: { justifyContent: "center" },
    },
    {
      name: <span title="Brondolan">Brondolan</span>,
      selector: (r) => r.brondolan || "-",
      sortable: true,
      width: "100px",
      style: { justifyContent: "center" },
    },
    {
      name: (
        <span title="Status pengangkutan (Planned/Approved/...)">Status</span>
      ),
      selector: (r) => r.status_pengangkutan || "-",
      sortable: true,
      width: "120px",
      cell: (r) => (
        <span
          className={`badge ${
            r.status_pengangkutan === "Planned" ? "badge-info" : "badge-ghost"
          }`}
        >
          {r.status_pengangkutan}
        </span>
      ),
    },
    {
      name: "Card ID",
      selector: (r) => r.card_id || "-",
      sortable: true,
      width: "150px",
    },
    {
      name: <span title="Foto pendukung pengangkutan (bila ada)">Foto</span>,
      width: "90px",
      cell: (r) =>
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
          "-"
        ),
      ignoreRowClick: true,
    },
  ];

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
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Pengangkutan"
          >
            Transport (Pengangkutan)
          </h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters((s) => !s)}
              title="Tampilkan / sembunyikan filter lanjutan"
            >
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => fetchData()}
              title="Refresh data pengangkutan"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="Cari (no pengangkutan, SPB, driver, fcba...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal: e.target.value }))
                }
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal_end || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal_end: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Pengangkutan"
                value={filters.nopengangkutan || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, nopengangkutan: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No SPB"
                value={filters.nospb || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, nospb: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Dokumen"
                value={filters.nodokumen || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, nodokumen: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Driver"
                value={filters.kode_karyawan_driver || ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    kode_karyawan_driver: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kerani"
                value={filters.kode_karyawan_kerani || ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    kode_karyawan_kerani: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fcba: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling || ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, afdeling: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Status"
                value={filters.status_pengangkutan || ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    status_pengangkutan: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button className="btn btn-outline" onClick={() => fetchData()}>
                Terapkan Filter
              </button>
              <button
                className="btn"
                onClick={() => {
                  const reset: Filters = {
                    tanggal: "",
                    tanggal_end: "",
                    nopengangkutan: "",
                    nospb: "",
                    nodokumen: "",
                    kode_karyawan_kerani: "",
                    kode_karyawan_driver: "",
                    fcba: "",
                    afdeling: "",
                    status_pengangkutan: "",
                  };
                  setFilters(reset);
                  fetchData(reset);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
          <div className="min-w-[900px] md:min-w-0">
            <DataTable
              columns={columns}
              data={filtered}
              progressPending={loading}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 30, 100, 500]}
              highlightOnHover
              pointerOnHover
              fixedHeader
              fixedHeaderScrollHeight="520px"
              persistTableHead
              responsive
              noDataComponent={
                <div className="py-8 text-base-content/70">Tidak ada data.</div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
