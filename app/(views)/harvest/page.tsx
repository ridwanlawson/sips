"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

/* =========================
   T Y P E S
========================= */
type Harvest = {
  id: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan: string;
  nama_karyawan: string;
  fcba: string;
  afdeling: string;
  tph: string;
  fieldcode: string;
  output: string;
  mentah: string;
  overripe: string;
  busuk: string;
  busuk2: string;
  buahkecil: string;
  brondol: string;
  alasbrondol: string;
  tangkai_panjang: string;
  images: string;
  id_device: string;
  status_harvesting: string;
  card_id: string;
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  nodokumen: string;
  kode_karyawan: string;
  fcba: string;
  afdeling: string;
  tph: string;
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
  if (!y || !m || !d) return trimmed;
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
export default function HarvestPage() {
  const [items, setItems] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const today = getTodayISO();
    return {
      tanggal: today,
      tanggal_end: today,
      nodokumen: "",
      kode_karyawan: "",
      fcba: "",
      afdeling: "",
      tph: "",
    };
  });

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState<"ADM" | "MGR" | "AST" | "OTHER">(
    "OTHER"
  );
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");

  // Toast
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

  // Initialize User Level & Defaults
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

    const levelRaw = (
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      ""
    ).toUpperCase();

    if (levelRaw === "ADM" || levelRaw === "MGR" || levelRaw === "AST") {
      setUserLevel(levelRaw);
    } else {
      setUserLevel("OTHER");
    }
  }, []);

  // Apply defaults to filters based on level
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
        const currentFilters = overrideFilters || filters;
        const p = new URLSearchParams();
        if (currentFilters.tanggal) p.set("tanggal", currentFilters.tanggal!);
        if (currentFilters.tanggal_end)
          p.set("tanggal_end", currentFilters.tanggal_end!);
        if (currentFilters.nodokumen)
          p.set("nodokumen", currentFilters.nodokumen!);
        if (currentFilters.kode_karyawan)
          p.set("kode_karyawan", currentFilters.kode_karyawan!);
        if (currentFilters.fcba) p.set("fcba", currentFilters.fcba!);
        if (currentFilters.afdeling)
          p.set("afdeling", currentFilters.afdeling!);
        if (currentFilters.tph) p.set("tph", currentFilters.tph!);

        const res = await fetch(`/api/harvest?${p.toString()}`);

        if (res.status === 404) {
          setItems([]);
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.ok) {
          setItems(json.data || []);
        } else {
          showAlert(json.error || "Gagal mengambil data", "error");
        }
      } catch (e) {
        console.error(e);
        showAlert("Terjadi kesalahan jaringan", "error");
      } finally {
        setLoading(false);
      }
    },
    [filters, showAlert]
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
          it.nodokumen,
          it.kode_karyawan,
          it.nama_karyawan,
          it.fcba,
          it.afdeling,
          it.tph,
          it.fieldcode,
          it.status_harvesting,
          it.card_id,
          it.id_device,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }
    // Add index
    return res.map((item, index) => ({ ...item, _index: index + 1 }));
  }, [q, items]);

  const columns: TableColumn<Harvest & { _index: number }>[] = [
    {
      name: "No",
      selector: (row) => row._index,
      width: "60px",
      sortable: true,
    },
    {
      name: <span title="Nomor dokumen panen">No Dokumen</span>,
      selector: (row) => row.nodokumen,
      sortable: true,
      width: "200px",
    },
    {
      name: <span title="Tanggal panen (DD-MM-YYYY)">Tanggal</span>,
      selector: (row) => row.tanggal,
      format: (row) => formatDateDMY(row.tanggal),
      sortable: true,
      width: "120px",
    },
    {
      name: <span title="Nama dan kode karyawan">Karyawan</span>,
      selector: (row) => row.nama_karyawan || row.kode_karyawan,
      sortable: true,
      width: "200px",
      cell: (row) => (
        <div>
          <div className="font-bold">{row.nama_karyawan}</div>
          <div className="text-xs text-gray-500">{row.kode_karyawan}</div>
        </div>
      ),
    },
    {
      name: <span title="FCBA asal (kebun/estate)">FCBA</span>,
      selector: (row) => row.fcba,
      sortable: true,
      width: "80px",
    },
    {
      name: <span title="Afdeling / Section">Afd</span>,
      selector: (row) => row.afdeling,
      sortable: true,
      width: "80px",
    },
    {
      name: <span title="TPH (Tempat Pembuangan Hasil)">TPH</span>,
      selector: (row) => row.tph,
      sortable: true,
      width: "100px",
    },
    {
      name: <span title="Field code">Field Code</span>,
      selector: (row) => row.fieldcode,
      sortable: true,
      width: "120px",
    },
    {
      name: <span title="Output (jumlah buah yang dihasilkan)">Output</span>,
      selector: (row) => row.output,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah buah mentah">Mentah</span>,
      selector: (row) => row.mentah,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah buah overripe">Overripe</span>,
      selector: (row) => row.overripe,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah buah busuk kategori 1">Busuk</span>,
      selector: (row) => row.busuk,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah buah busuk kategori 2">Busuk 2</span>,
      selector: (row) => row.busuk2,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah buah kecil">Buah Kecil</span>,
      selector: (row) => row.buahkecil,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Jumlah brondol">Brondol</span>,
      selector: (row) => row.brondol,
      sortable: true,
      style: { justifyContent: "end" },
      width: "100px",
    },
    {
      name: <span title="Alas brondol (berat)">Alas Brondol</span>,
      selector: (row) => row.alasbrondol,
      sortable: true,
      style: { justifyContent: "end" },
      width: "120px",
    },
    {
      name: <span title="Jumlah tangkai panjang">Tangkai Pjg</span>,
      selector: (row) => row.tangkai_panjang,
      sortable: true,
      style: { justifyContent: "end" },
      width: "120px",
    },
    {
      name: <span title="Status panen (Planned/Approved/...)">Status</span>,
      selector: (row) => row.status_harvesting,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span
          className={`badge ${
            row.status_harvesting === "Planned" ? "badge-info" : "badge-ghost"
          }`}
        >
          {row.status_harvesting}
        </span>
      ),
    },
    {
      name: <span title="ID kartu karyawan (jika ada)">Card ID</span>,
      selector: (row) => row.card_id,
      sortable: true,
      width: "150px",
    },
    {
      name: <span title="ID perangkat yang merekam panen">Device ID</span>,
      selector: (row) => row.id_device,
      sortable: true,
      width: "200px",
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

        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Harvest (Panen)"
          >
            Harvesting (Panen)
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
              title="Refresh data panen"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="Cari apapun (No Dokumen, Karyawan, FCBA, TPH...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            title="Pencarian cepat di semua kolom penting"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Awal"
                value={filters.tanggal}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal: e.target.value }))
                }
                title="Filter tanggal awal"
              />
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Akhir"
                value={filters.tanggal_end}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal_end: e.target.value }))
                }
                title="Filter tanggal akhir"
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="No Dokumen"
                value={filters.nodokumen}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, nodokumen: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.kode_karyawan}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, kode_karyawan: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba}
                disabled={userLevel === "MGR" || userLevel === "AST"}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fcba: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling}
                disabled={userLevel === "AST"}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, afdeling: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="TPH"
                value={filters.tph}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tph: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className="btn btn-outline"
                onClick={() => fetchData()}
                title="Terapkan filter"
              >
                Terapkan Filter
              </button>
              <button
                className="btn"
                onClick={() => {
                  const resetFilters = {
                    tanggal: "",
                    tanggal_end: "",
                    nodokumen: "",
                    kode_karyawan: "",
                    fcba: "",
                    afdeling: "",
                    tph: "",
                  };
                  setFilters(resetFilters);
                  fetchData(resetFilters);
                }}
                title="Reset semua filter"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Table */}
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
