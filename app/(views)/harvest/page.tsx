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

type Option = { value: string; label: string };

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
   Searchable Select (Simplified)
========================= */
const SearchSelect: React.FC<{
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ options, value, onChange, placeholder, disabled }) => {
  return (
    <select
      className="select select-bordered w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder || "Pilih..."}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
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

  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState<"ADM" | "MGR" | "AST" | "OTHER">("OTHER");
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");

  // Toast
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showAlert = useCallback((msg: string, type: "success" | "error" = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  // Initialize User Level & Defaults
  useEffect(() => {
    const ckHome = readCookie("user_Fcba") || readCookie("user_FCBA") || readCookie("user_fcba") || "";
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
      setUserLevel(levelRaw as any);
    } else {
      setUserLevel("OTHER");
    }
  }, []);

  // Apply defaults to filters based on level
  useEffect(() => {
    if (userLevel === "MGR") {
        setFilters(f => ({ ...f, fcba: homeFcba }));
    } else if (userLevel === "AST") {
        setFilters(f => ({ ...f, fcba: homeFcba, afdeling: homeSection }));
    }
  }, [userLevel, homeFcba, homeSection]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.tanggal) p.set("tanggal", filters.tanggal);
      if (filters.tanggal_end) p.set("tanggal_end", filters.tanggal_end);
      if (filters.nodokumen) p.set("nodokumen", filters.nodokumen);
      if (filters.kode_karyawan) p.set("kode_karyawan", filters.kode_karyawan);
      if (filters.fcba) p.set("fcba", filters.fcba);
      if (filters.afdeling) p.set("afdeling", filters.afdeling);
      if (filters.tph) p.set("tph", filters.tph);

      const res = await fetch(`/api/harvest?${p.toString()}`);
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
  }, [filters, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: TableColumn<Harvest>[] = [
    {
      name: "No Dokumen",
      selector: (row) => row.nodokumen,
      sortable: true,
      width: "200px",
    },
    {
      name: "Tanggal",
      selector: (row) => row.tanggal,
      format: (row) => formatDateDMY(row.tanggal),
      sortable: true,
      width: "120px",
    },
    {
      name: "Karyawan",
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
      name: "FCBA",
      selector: (row) => row.fcba,
      sortable: true,
      width: "80px",
    },
    {
      name: "Afd",
      selector: (row) => row.afdeling,
      sortable: true,
      width: "80px",
    },
    {
      name: "TPH",
      selector: (row) => row.tph,
      sortable: true,
      width: "100px",
    },
    {
      name: "Output",
      selector: (row) => row.output,
      sortable: true,
      right: true,
      width: "100px",
    },
    {
      name: "Status",
      selector: (row) => row.status_harvesting,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className={`badge ${row.status_harvesting === 'Planned' ? 'badge-info' : 'badge-ghost'}`}>
          {row.status_harvesting}
        </span>
      ),
    },
  ];

  // Expanded component for details
  const ExpandedComponent = ({ data }: { data: Harvest }) => (
    <div className="p-4 bg-base-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <div className="font-bold opacity-70">Field Code</div>
        <div>{data.fieldcode}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Mentah</div>
        <div>{data.mentah}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Overripe</div>
        <div>{data.overripe}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Busuk</div>
        <div>{data.busuk}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Busuk 2</div>
        <div>{data.busuk2}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Buah Kecil</div>
        <div>{data.buahkecil}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Brondol</div>
        <div>{data.brondol}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Alas Brondol</div>
        <div>{data.alasbrondol}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Tangkai Panjang</div>
        <div>{data.tangkai_panjang}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Card ID</div>
        <div>{data.card_id}</div>
      </div>
      <div>
        <div className="font-bold opacity-70">Device ID</div>
        <div>{data.id_device}</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 min-h-screen bg-base-100 text-base-content">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Panen</h1>
          <p className="text-sm opacity-60">List data hasil panen harian</p>
        </div>
        <div className="flex gap-2">
            <button
            className="btn btn-sm btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            >
            Filter {showFilters ? "▲" : "▼"}
            </button>
            <button className="btn btn-sm btn-primary" onClick={fetchData} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
            </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div
          role="alert"
          className={`alert ${
            alert.type === "success" ? "alert-success" : "alert-error"
          } mb-4`}
        >
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 p-4 bg-base-200 rounded-xl">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tanggal Awal</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={filters.tanggal}
              onChange={(e) =>
                setFilters((s) => ({ ...s, tanggal: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tanggal Akhir</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={filters.tanggal_end}
              onChange={(e) =>
                setFilters((s) => ({ ...s, tanggal_end: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">No Dokumen</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Cari No Dokumen..."
              value={filters.nodokumen}
              onChange={(e) =>
                setFilters((s) => ({ ...s, nodokumen: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Kode Karyawan</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Cari Kode Karyawan..."
              value={filters.kode_karyawan}
              onChange={(e) =>
                setFilters((s) => ({ ...s, kode_karyawan: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">FCBA</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="FCBA..."
              value={filters.fcba}
              disabled={userLevel === "MGR" || userLevel === "AST"}
              onChange={(e) =>
                setFilters((s) => ({ ...s, fcba: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Afdeling</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Afdeling..."
              value={filters.afdeling}
              disabled={userLevel === "AST"}
              onChange={(e) =>
                setFilters((s) => ({ ...s, afdeling: e.target.value }))
              }
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">TPH</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="TPH..."
              value={filters.tph}
              onChange={(e) =>
                setFilters((s) => ({ ...s, tph: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={items}
            progressPending={loading}
            pagination
            expandableRows
            expandableRowsComponent={ExpandedComponent}
            highlightOnHover
            pointerOnHover
            responsive
          />
        </div>
      </div>
    </div>
  );
}
