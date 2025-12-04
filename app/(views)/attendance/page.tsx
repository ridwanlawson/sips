"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import DataTable, { TableColumn } from "react-data-table-component";

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

type FormState = {
  id?: string;
  tanggal: string; // "YYYY-MM-DD"
  kode_karyawan_mandor: string;
  kode_karyawan: string;
  time_in: string; // "HH:MM"
  time_out: string; // "HH:MM"
  location_in: string;
  location_out: string;
  pengancakan: string; // dari NOANCAK
  total_late_time: string; // H:MM (readOnly)
  go_home_early: string; // H:MM (readOnly)
  attendance_type: "REGULAR" | "ASSISTENSI";
  attendance: "KJ" | "WH" | "WS" | "MK" | "ML" | "P1" | "KB" | "OT";
  exception_case: string; // textarea
  no_ba_exca: string;
  no_ba_exca_file?: File | undefined; // PDF upload
  fcba: string;
  section: string;
  gang: string;
  fcba_destination: string;
  id_device: string;
  mac_address: string;
  images: File | undefined;

  mandays: string; // readOnly “0 – 1”
};

const initialForm: FormState = {
  id: undefined,
  tanggal: "",
  kode_karyawan_mandor: "",
  kode_karyawan: "",
  time_in: "",
  time_out: "",
  location_in: "",
  location_out: "",
  pengancakan: "",
  total_late_time: "",
  go_home_early: "",
  attendance_type: "REGULAR",
  attendance: "KJ",
  exception_case: "",
  no_ba_exca: "",
  no_ba_exca_file: undefined,
  fcba: "",
  section: "",
  gang: "",
  fcba_destination: "",
  id_device: "",
  mac_address: "",
  images: undefined,
  mandays: "0",
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  kode_karyawan_mandor: string;
  kode_karyawan: string;
  fcba: string;
  afdeling: string;
  gang: string;
  attendance: string;
  status_attendance: string;
  attendance_type: string;
  fcba_destination: string;
}>;

type Triplet = { fcba: string; sectionname: string; gangcode: string };

type Employee = {
  fccode: string;
  fullname?: string;
  fcba?: string;
  sectionname?: string;
  gangcode?: string;
  noancak?: string;
};

type Option = { value: string; label: string };

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
  fcba?: unknown;
  sectionname?: unknown;
  gangcode?: unknown;
};

/* =========================
   U T I L S
========================= */
import { logoutAndRedirect } from "@/utils/authHelper";
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from "@/utils/imageHelper";

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

const getReadableDevice = () => {
  if (typeof navigator === "undefined") return "Unknown • Unknown";
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Mac OS X/i.test(ua)
    ? "macOS"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Unknown";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
    ? "Chrome"
    : /Firefox\//i.test(ua)
    ? "Firefox"
    : /Safari\//i.test(ua)
    ? "Safari"
    : "Browser";
  return `${os} • ${browser}`;
};

const getOrCreateDeviceIds = () => {
  if (typeof window === "undefined") return { deviceId: "", pseudoMac: "" };
  const devKey = "sips_device_id";
  const macKey = "sips_pseudo_mac";
  let deviceId = localStorage.getItem(devKey) || "";
  let pseudoMac = localStorage.getItem(macKey) || "";
  const ensurePseudoMacFormat = (s: string) => {
    const hex = s
      .replace(/[^a-f0-9]/gi, "")
      .padEnd(12, "0")
      .slice(0, 12);
    const formatted =
      hex
        .match(/.{1,2}/g)
        ?.join(":")
        .toUpperCase() ?? "00:00:00:00:00:00";
    return formatted;
  };
  if (!deviceId) {
    const rnd = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
    deviceId = rnd ?? String(Date.now()) + Math.random().toString(16).slice(2);
    localStorage.setItem(devKey, deviceId);
  }
  if (!pseudoMac) {
    const seed = `${navigator.userAgent}|${deviceId}|${screen.width}x${
      screen.height
    }|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    pseudoMac = ensurePseudoMacFormat(h.toString(16));
    localStorage.setItem(macKey, pseudoMac);
  }
  return { deviceId, pseudoMac };
};

/* ====== Date/Time helpers ====== */
const combineToDate = (dateISO: string, hhmm: string): Date | null => {
  if (!dateISO || !hhmm) return null;
  const [hhStr, mmStr] = hhmm.split(":");
  const hh = parseInt(hhStr ?? "", 10);
  const mm = parseInt(mmStr ?? "", 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const d = new Date(`${dateISO}T00:00`);
  if (Number.isNaN(+d)) return null;
  d.setHours(hh, mm, 0, 0);
  return d;
};

const combineToApiString = (dateISO: string, hhmm: string): string =>
  `${dateISO} ${hhmm}:00`;

const hhmm = (minutes: number) => {
  const m = Math.max(0, Math.floor(minutes));
  const H = Math.floor(m / 60);
  const M = m % 60;
  return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
};

const diffMinutes = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 60000);
};

/* Text H:MM normalizer */
const normalizeHM = (input: string) => {
  const s = (input || "").trim();
  if (!s) return "";
  const m1 = s.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (m1) {
    const H = Math.max(0, parseInt(m1[1] ?? "0", 10) || 0);
    const M = Math.max(0, Math.min(59, parseInt(m1[2] ?? "0") || 0));
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
  }
  const m2 = s.match(/^(\d{1,3})$/);
  if (m2) {
    const num = parseInt(m2[1] ?? "0", 10);
    const H = Math.floor(num / 100);
    const M = num % 100;
    return `${String(H).padStart(2, "0")}:${String(Math.min(59, M)).padStart(
      2,
      "0"
    )}`;
  }
  return s;
};

/* =========================
   Searchable Select
========================= */
const SearchSelect: React.FC<{
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  small?: boolean;
}> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  name,
  small,
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
  }, [q, options]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const target = e.target as Node | null;
      if (target && !boxRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const currentLabel =
    options.find((o) => o.value === value)?.label || value || "";

  return (
    <div className="relative min-w-0" ref={boxRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        className={`input input-bordered w-full flex items-center justify-between whitespace-nowrap overflow-hidden ${
          small ? "input-sm" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setOpen((s) => !s)}
        aria-expanded={open}
        title={currentLabel || placeholder}
        disabled={disabled}
      >
        <span className={`truncate ${!value ? "text-base-content/50" : ""}`}>
          {currentLabel || placeholder || "Pilih..."}
        </span>
        <span className="ml-2">▾</span>
      </button>

      {required && !value && (
        <span className="sr-only" aria-live="polite">
          required
        </span>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-base-300 bg-base-100 shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              className="input input-bordered w-full"
              placeholder="Ketik untuk mencari..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.length === 0 && (
              <li className="p-3 text-base-content/60">Tidak ada data</li>
            )}
            {filtered.map((opt) => (
              <li key={`ss-${opt.value}`}>
                <button
                  type="button"
                  className={`w-full text-left p-2 hover:bg-base-200 ${
                    opt.value === value ? "bg-base-200" : ""
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQ("");
                  }}
                  title={opt.label}
                >
                  <div className="font-medium truncate">{opt.label}</div>
                  {opt.label !== opt.value && (
                    <div className="text-xs opacity-70 truncate">
                      {opt.value}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* =========================
   T Y P E  G U A R D S
========================= */
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

const extractSingleData = <T,>(payload: unknown): T | null => {
  if (!isObject(payload)) return null;
  if ("ok" in payload && payload.ok === true && "data" in payload) {
    const d = (payload as { data: unknown }).data;
    if (isObject(d) && "data" in d) {
      const inner = (d as { data: unknown }).data as T;
      return inner;
    }
    return d as T;
  }
  return null;
};

/* =========================
   M A I N
========================= */
export default function Attendance() {
  const [items, setItems] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const today = getTodayISO();
    return {
      tanggal: today,
      tanggal_end: today,
      kode_karyawan_mandor: "",
      kode_karyawan: "",
      fcba: "",
      afdeling: "",
      gang: "",
      attendance: "",
      status_attendance: "",
      attendance_type: "",
      fcba_destination: "",
    };
  });

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ESC untuk tutup modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // form
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>("");
  const imgRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // flag aturan Exception / BA EXCA saat edit
  const [initialHasException, setInitialHasException] = useState(false);
  const [initialHasBaExca, setInitialHasBaExca] = useState(false);

  // toast
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

  // Master data / cascading
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selFcba, setSelFcba] = useState<string>("");
  const [selSection, setSelSection] = useState<string>("");
  const [selGang, setSelGang] = useState<string>("");
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");
  const [userLevel, setUserLevel] = useState<"ADM" | "MGR" | "AST" | "OTHER">(
    "OTHER"
  );
  const [destFcba, setDestFcba] = useState<string>("");

  // loading ambil lokasi (in/out)
  const [locLoading, setLocLoading] = useState<"in" | "out" | null>(null);

  const handleGetLocation = (target: "in" | "out") => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      showAlert(
        "Browser tidak mendukung GPS / geolocation. Isi manual saja.",
        "error"
      );
      return;
    }

    setLocLoading(target);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const value = `${latitude},${longitude}`;

        setForm((s) =>
          target === "in"
            ? { ...s, location_in: value }
            : { ...s, location_out: value }
        );

        setLocLoading(null);
      },
      (err) => {
        console.error("Geolocation error:", err);
        showAlert(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser."
            : "Gagal mengambil lokasi. Coba lagi.",
          "error"
        );
        setLocLoading(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* ===== Device IDs (auto) ===== */
  useEffect(() => {
    const { deviceId, pseudoMac } = getOrCreateDeviceIds();
    setForm((s) => ({
      ...s,
      id_device: s.id_device || `${getReadableDevice()} • ${deviceId}`,
      mac_address: s.mac_address || pseudoMac,
    }));
  }, []);

  /* ===== Bootstrap cookies + master data ===== */
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

    const ckTrip = readCookie("opt_triplets");
    if (ckTrip) {
      try {
        const arr = JSON.parse(ckTrip) as Triplet[];
        if (Array.isArray(arr) && arr.length) setTriplets(arr);
      } catch {
        // ignore
      }
    }

    (async () => {
      try {
        const r = await fetch("/api/karyawans", { credentials: "include" });
        const j: unknown = await r.json();

        const rowsRaw = extractArrayData<EmployeesApiRow>(j);

        if (!ckTrip) {
          const map = new Map<string, Triplet>();
          for (const it of rowsRaw) {
            const fcba = String(it.fcba ?? "").trim();
            const sectionname = String(it.sectionname ?? "").trim();
            const gangcode = String(it.gangcode ?? "").trim();
            if (!fcba && !sectionname && !gangcode) continue;
            const key = `${fcba}|${sectionname}|${gangcode}`;
            if (!map.has(key)) map.set(key, { fcba, sectionname, gangcode });
          }
          setTriplets(Array.from(map.values()));
        }

        const mapEmp = new Map<string, Employee>();
        for (const it of rowsRaw) {
          const fccode = String(it.fccode ?? "").trim();
          if (!fccode) continue;
          if (!mapEmp.has(fccode)) {
            const noancakValue =
              (it as { noancak?: unknown }).noancak ??
              (it as { NOANCAK?: unknown }).NOANCAK;
            const noancak =
              typeof noancakValue === "string"
                ? noancakValue.trim()
                : undefined;

            mapEmp.set(fccode, {
              fccode,
              fullname: typeof it.fcname === "string" ? it.fcname : undefined,
              fcba: String(it.fcba ?? "").trim(),
              sectionname: String(it.sectionname ?? "").trim(),
              gangcode: String(it.gangcode ?? "").trim(),
              noancak,
            });
          }
        }
        setEmployees(Array.from(mapEmp.values()));
      } catch (e) {
        console.warn("fetch /api/karyawans gagal:", e);
      }
    })();
  }, []);

  /* ===== Attendance-type: reset cascade dari FCBA akun ===== */
  useEffect(() => {
    if (isEditing) return;

    if (userLevel === "ADM") {
      setSelFcba((prev) => prev || homeFcba || "");
      setForm((s) => ({ ...s, fcba: s.fcba || homeFcba || "" }));
    } else {
      setSelFcba(homeFcba || "");
      setForm((s) => ({ ...s, fcba: homeFcba || "" }));
    }

    if (userLevel === "AST") {
      setSelSection(homeSection || "");
      setForm((s) => ({ ...s, section: homeSection || "" }));
    } else {
      setSelSection("");
      setForm((s) => ({ ...s, section: "" }));
    }

    setSelGang("");
    setForm((s) => ({ ...s, kode_karyawan: "" }));
  }, [form.attendance_type, homeFcba, homeSection, userLevel, isEditing]);

  /* ===== Options ===== */
  const fcbaOptions = useMemo(
    () =>
      Array.from(new Set(triplets.map((t) => t.fcba).filter(Boolean)))
        .sort()
        .map((v) => ({ value: v, label: v })),
    [triplets]
  );

  const sectionOptions: Option[] = useMemo(() => {
    if (!selFcba) return [];
    return Array.from(
      new Set(
        triplets
          .filter((t) => t.fcba === selFcba)
          .map((t) => t.sectionname)
          .filter(Boolean)
      )
    )
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [triplets, selFcba]);

  const gangOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection) return [];
    return Array.from(
      new Set(
        triplets
          .filter((t) => t.fcba === selFcba && t.sectionname === selSection)
          .map((t) => t.gangcode)
          .filter(Boolean)
      )
    )
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [triplets, selFcba, selSection]);

  const pengancakanOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang) return [];
    const pool = employees.filter(
      (e) =>
        (e.fcba || "") === selFcba &&
        (e.sectionname || "") === selSection &&
        (e.gangcode || "") === selGang
    );
    const set = new Set<string>();
    for (const e of pool) {
      const raw = (e.noancak || "").trim();
      if (raw) set.add(raw);
    }
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [employees, selFcba, selSection, selGang]);

  const employeeOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection || !selGang) return [];
    const pool = employees.filter(
      (e) =>
        (e.fcba || "") === selFcba &&
        (e.sectionname || "") === selSection &&
        (e.gangcode || "") === selGang
    );
    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || "").trim();
      if (!value) continue;
      const label = e.fullname ? `${value} - ${e.fullname}` : value;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort(
      (a, b) => a.label.localeCompare(b.label)
    );
  }, [employees, selFcba, selSection, selGang]);

  const mandorOptions: Option[] = useMemo(() => {
    let pool: Employee[] = [];

    if (userLevel === "ADM") {
      const fc = selFcba || homeFcba || "";
      pool = employees.filter((e) => (e.fcba || "") === fc);
    } else if (userLevel === "MGR") {
      const fc = homeFcba || "";
      pool = employees.filter((e) => (e.fcba || "") === fc);
    } else if (userLevel === "AST") {
      const fc = homeFcba || "";
      const sec = homeSection || "";
      pool = employees.filter(
        (e) => (e.fcba || "") === fc && (!sec || (e.sectionname || "") === sec)
      );
    } else {
      const fc = homeFcba || selFcba || "";
      pool = employees.filter((e) => (e.fcba || "") === fc);
    }

    const map = new Map<string, string>();
    for (const e of pool) {
      const value = (e.fccode || "").trim();
      if (!value) continue;
      const label = e.fullname ? `${value} - ${e.fullname}` : value;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort(
      (a, b) => a.label.localeCompare(b.label)
    );
  }, [employees, selFcba, homeFcba, homeSection, userLevel]);

  const empLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      const code = (e.fccode || "").trim();
      if (!code) continue;
      const label = e.fullname ? `${code} - ${e.fullname}` : code;
      if (!map.has(code)) map.set(code, label);
    }
    return map;
  }, [employees]);

  const onChangeSection = (v: string) => {
    setSelSection(v);
    setSelGang("");
    setForm((s) => ({ ...s, section: v, kode_karyawan: "", pengancakan: "" }));
  };

  const onChangeGang = (v: string) => {
    setSelGang(v);
    setForm((s) => ({ ...s, gang: v, kode_karyawan: "", pengancakan: "" }));
  };

  const onChangeEmployee = (fccode: string) => {
    const emp = employees.find((e) => e.fccode === fccode);
    setForm((s) => ({
      ...s,
      kode_karyawan: fccode,
      pengancakan: emp?.noancak ?? s.pengancakan,
    }));
  };

  const onChangeDestFcba = (v: string) => setDestFcba(v);

  const currentFcbaForForm = useMemo(() => {
    if (userLevel === "ADM") {
      return selFcba || homeFcba || "";
    }
    return homeFcba || selFcba || "";
  }, [userLevel, selFcba, homeFcba]);

  /* ===== LIST (dengan filter rentang tanggal di frontend) ===== */
  const fetchList = useCallback(
    async (override?: Filters) => {
      setLoading(true);
      try {
        const base = override ?? filters;

        // Ambil raw string tanggal
        let start = (base.tanggal ?? "").trim();
        let end = (base.tanggal_end ?? "").trim();

        // Jika hanya salah satu diisi → samakan (range 1 hari)
        if (start && !end) {
          end = start;
        } else if (!start && end) {
          start = end;
        }

        // Kalau keduanya ada & end < start → tukar
        if (start && end && end < start) {
          const tmp = start;
          start = end;
          end = tmp;
        }

        const isAnyDateFilled = !!(start || end);
        const isRange = !!(start && end && start !== end);

        // Filter yang akan DIKIRIM ke API
        const f: Filters = { ...base };

        // Scope sesuai level
        if (userLevel === "MGR" || userLevel === "AST") {
          if (homeFcba) f.fcba = homeFcba;
        }
        if (userLevel === "AST" && homeSection) {
          f.afdeling = homeSection;
        }

        // Bersihkan tanggal dulu
        delete f.tanggal;
        delete f.tanggal_end;

        if (!isAnyDateFilled) {
          // tidak kirim tanggal → backend bebas kirim semua tanggal
        } else if (!isRange) {
          // 1 hari saja → kirim sebagai tanggal tunggal
          f.tanggal = start;
        } else {
          // Range beneran → JANGAN kirim tanggal ke API
          // nanti di-filter di FE pakai start-end
        }

        // Build query string (tanpa tanggal_end)
        const params = new URLSearchParams();
        Object.entries(f).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            params.append(k, v as string);
          }
        });

        const res = await fetch(
          `/api/attendance${params.toString() ? `?${params}` : ""}`,
          { credentials: "include" }
        );

        // ⬇⬇⬇ PERUBAHAN PENTING DI SINI
        if (!res.ok) {
          // Kalau 404 → anggap data kosong, jangan tampilkan error
          if (res.status === 404) {
            setItems([]); // kosongkan tabel
            setLoading(false); // stop loading
            return; // keluar tanpa throw → tidak masuk catch
          }
          // Status lain (500, 401, dll) → tetap dianggap error
          if (res.status === 401) {
            await logoutAndRedirect();
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        // ⬆⬆⬆ SAMPAI SINI

        const json: unknown = await res.json();

        const raw = extractArrayData<Absensi>(json);

        // ===== FILTER RENTANG TANGGAL DI FRONTEND =====
        let filteredByDate = raw;
        if (start && end) {
          filteredByDate = raw.filter((row) => {
            const dateOnly = (row.tanggal || "").split(" ")[0]; // "YYYY-MM-DD"
            if (!dateOnly) return false;
            return dateOnly >= start! && dateOnly <= end!;
          });
        }

        // Hilangkan duplikat by ID
        const byId = new Map<string, Absensi>();
        for (const row of filteredByDate)
          if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
        const dataRaw = Array.from(byId.values());

        // Tambahkan _rowKey unik
        const seen = new Set<string>();
        const data = dataRaw.map((it, idx) => {
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

        setItems(data);
      } catch (e) {
        // HANYA masuk ke sini kalau benar-benar error (bukan karena data kosong)
        console.error(e);
        showAlert("Gagal memuat data", "error");
      } finally {
        setLoading(false);
      }
    },
    [filters, showAlert, userLevel, homeFcba, homeSection]
  );

  const didRunInitial = useRef(false);
  useEffect(() => {
    if (didRunInitial.current) return;
    didRunInitial.current = true;
    fetchList();
  }, [fetchList]);

  /* ===== Defaults untuk ADD ===== */
  const setDefaultsForAdd = () => {
    const today = getTodayISO();
    const { deviceId, pseudoMac } = getOrCreateDeviceIds();

    setInitialHasBaExca(false);
    setInitialHasException(false);

    setForm({
      ...initialForm,
      tanggal: today,
      time_in: "06:00",
      time_out: "14:00",
      id_device: `${getReadableDevice()} • ${deviceId}`,
      mac_address: pseudoMac,
      attendance_type: "REGULAR",
      mandays: "1",
      fcba: userLevel === "ADM" ? homeFcba || "" : homeFcba || "",
      section: userLevel === "AST" ? homeSection || "" : "",
    });
  };

  const onAddClick = () => {
    setDefaultsForAdd();
    setIsEditing(false);
    setPreview("");
    setDestFcba("");
    setSelFcba(userLevel === "ADM" ? homeFcba || "" : homeFcba || "");
    setSelSection(userLevel === "AST" ? homeSection || "" : "");
    setSelGang("");
    setOpen(true);
    setDetailLoading(false);
    if (imgRef.current) imgRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";

    setTimeout(() => {
      handleGetLocation("in");
      handleGetLocation("out");
    }, 0);
  };

  /* ===== AUTO COMPUTE LATE / EARLY / MANDAYS ===== */
  const recomputeComputedFields = useCallback((s: FormState): FormState => {
    const dIn = combineToDate(s.tanggal, s.time_in);
    const dOut = combineToDate(s.tanggal, s.time_out);

    const baseIn = s.tanggal ? new Date(`${s.tanggal}T06:00`) : null;
    const baseOut = s.tanggal ? new Date(`${s.tanggal}T14:00`) : null;

    let totalLate = s.total_late_time;
    if (dIn && baseIn) {
      totalLate =
        dIn.getTime() > baseIn.getTime()
          ? hhmm(diffMinutes(baseIn, dIn))
          : "00:00";
    }

    let goEarly = s.go_home_early;
    if (dOut && baseOut) {
      goEarly =
        dOut.getTime() < baseOut.getTime()
          ? hhmm(diffMinutes(dOut, baseOut))
          : "00:00";
    }

    let effectiveMin = 0;
    if (dIn && dOut && baseIn && baseOut) {
      const effStart =
        dIn.getTime() > baseIn.getTime() ? dIn : (baseIn as Date);
      const effEnd =
        dOut.getTime() < baseOut.getTime() ? dOut : (baseOut as Date);
      effectiveMin = Math.max(0, diffMinutes(effStart, effEnd));
    }

    const fullHK =
      !!dIn &&
      !!dOut &&
      !!baseIn &&
      !!baseOut &&
      dIn.getTime() <= baseIn.getTime() &&
      dOut.getTime() >= baseOut.getTime();

    let mandays = "0";
    if (
      s.attendance === "KJ" ||
      s.attendance === "WH" ||
      s.attendance === "WS"
    ) {
      mandays = fullHK ? "1" : (effectiveMin / 480).toFixed(4);
    } else {
      mandays = "0";
    }

    return {
      ...s,
      total_late_time: totalLate,
      go_home_early: goEarly,
      mandays,
    };
  }, []);

  useEffect(() => {
    setForm((s) => recomputeComputedFields(s));
  }, [
    form.tanggal,
    form.time_in,
    form.time_out,
    form.attendance,
    recomputeComputedFields,
  ]);

  /* ===== SUBMIT ===== */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();

      if (!form.tanggal) throw new Error("Tanggal wajib diisi");
      if (!form.time_in) throw new Error("Time In wajib diisi");
      if (!form.location_in) throw new Error("Location In wajib diisi");
      if (!form.kode_karyawan) throw new Error("Pilih Karyawan");

      let finalFcba = currentFcbaForForm || form.fcba || "";
      if (userLevel !== "ADM") {
        finalFcba = homeFcba || finalFcba;
      }
      if (!finalFcba) throw new Error("FCBA akun tidak ditemukan (cookie)");
      const finalSection =
        userLevel === "AST" && homeSection ? homeSection : form.section || "";

      const trimmedException = form.exception_case.trim();
      const hasException = trimmedException.length > 0;

      const hasUploadedPdf = form.no_ba_exca_file instanceof File;
      const hasExistingPdf = !!form.no_ba_exca;

      const exceptionRequired = !isEditing || !initialHasException;
      const baExcaRequired = !isEditing || !initialHasBaExca;

      if (exceptionRequired && !hasException) {
        throw new Error("Exception Case wajib diisi.");
      }

      if (baExcaRequired && !hasUploadedPdf && !hasExistingPdf) {
        throw new Error("No BA EXCA (PDF) wajib diisi.");
      }

      const timeInApi = combineToApiString(form.tanggal, form.time_in);
      const timeOutApi = form.time_out
        ? combineToApiString(form.tanggal, form.time_out)
        : "";

      fd.append("tanggal", form.tanggal);
      fd.append("kode_karyawan", form.kode_karyawan);
      fd.append("attendance", form.attendance);
      fd.append("attendance_type", form.attendance_type);
      fd.append("fcba", finalFcba);
      fd.append("time_in", timeInApi);
      if (form.time_out) fd.append("time_out", timeOutApi);
      fd.append("location_in", form.location_in);
      if (form.location_out) fd.append("location_out", form.location_out);
      if (form.pengancakan) fd.append("pengancakan", form.pengancakan);
      if (form.total_late_time)
        fd.append("total_late_time", normalizeHM(form.total_late_time));
      if (form.go_home_early)
        fd.append("go_home_early", normalizeHM(form.go_home_early));
      if (trimmedException) fd.append("exception_case", trimmedException);
      if (finalSection) fd.append("section", finalSection);
      if (form.gang) fd.append("gang", form.gang);

      if (form.mandays) fd.append("mandays", form.mandays);

      const { deviceId, pseudoMac } = getOrCreateDeviceIds();
      fd.append(
        "id_device",
        form.id_device || `${getReadableDevice()} • ${deviceId}`
      );
      fd.append("mac_address", form.mac_address || pseudoMac);

      if (form.attendance_type === "ASSISTENSI") {
        if (!destFcba)
          throw new Error("FCBA Destination wajib diisi untuk ASSISTENSI");
        fd.append("fcba_destination", destFcba);
      }

      if (form.images instanceof File) fd.append("images", form.images);
      if (form.no_ba_exca_file instanceof File) {
        fd.append("no_ba_exca", form.no_ba_exca_file);
      } else if (isEditing && form.no_ba_exca) {
        fd.append("no_ba_exca", form.no_ba_exca);
      }

      if (form.kode_karyawan_mandor)
        fd.append("kode_karyawan_mandor", form.kode_karyawan_mandor);

      const method = isEditing ? "PUT" : "POST";
      const url =
        isEditing && form.id ? `/api/attendance/${form.id}` : `/api/attendance`;

      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include",
      });

      if (res.status === 401) {
        await logoutAndRedirect();
        return;
      }

      const json: unknown = await res.json();

      if (
        !isObject(json) ||
        !("ok" in json) ||
        (json as { ok: unknown }).ok !== true
      ) {
        const errMsg =
          (isObject(json) &&
            ("message" in json || "error" in json) &&
            String(
              (json as Record<string, unknown>).message ??
                (json as Record<string, unknown>).error
            )) ||
          "Gagal menyimpan data";
        throw new Error(errMsg);
      }

      showAlert(
        isEditing
          ? "Data berhasil diperbarui ✅"
          : "Data berhasil ditambahkan ✅"
      );
      await fetchList();
      setForm((s) => ({
        ...initialForm,
        id_device: s.id_device,
        mac_address: s.mac_address,
      }));
      setDestFcba("");
      setSelFcba(userLevel === "ADM" ? homeFcba || "" : homeFcba || "");
      setSelSection(userLevel === "AST" ? homeSection || "" : "");
      setSelGang("");
      if (imgRef.current) imgRef.current.value = "";
      if (pdfRef.current) pdfRef.current.value = "";
      setPreview("");
      setOpen(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan";
      showAlert(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Yakin ingin menghapus data ini?")) return;
      try {
        const res = await fetch(`/api/attendance/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json: unknown = await res.json();
        if (
          !isObject(json) ||
          !("ok" in json) ||
          (json as { ok: unknown }).ok !== true
        )
          throw new Error(
            (isObject(json) &&
              String(
                (json as Record<string, unknown>).error || "Gagal hapus"
              )) ||
              "Gagal hapus"
          );
        setItems((prev) => prev.filter((i) => i.id !== id));
        showAlert("Data berhasil dihapus 🗑️");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal menghapus data";
        showAlert(msg, "error");
      }
    },
    [showAlert]
  );

  /* ===== DETAIL ===== */
  const handleDetail = useCallback(
    async (id: string) => {
      setIsEditing(true);
      setDetailLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/attendance/${id}`, {
          credentials: "include",
        });
        const json: unknown = await res.json();
        const d = extractSingleData<Absensi>(json);
        if (!res.ok || !d) throw new Error("Gagal ambil data");

        const toHM = (dt?: string | null) =>
          dt && dt.includes(" ")
            ? (dt.split(" ")[1] ?? "").slice(0, 5)
            : dt
            ? dt.slice(11, 16)
            : "";

        const existingException = (d.exception_case || "").trim();
        const existingBaExca = (d.no_ba_exca || "").trim();

        setInitialHasException(existingException.length > 0);
        setInitialHasBaExca(existingBaExca.length > 0);

        const filled: FormState = {
          id: d.id,
          tanggal: (d.tanggal || "").split(" ")[0],
          kode_karyawan_mandor: d.kode_karyawan_mandor || "",
          kode_karyawan: d.kode_karyawan || "",
          time_in: toHM(d.time_in) || "06:00",
          time_out: toHM(d.time_out) || "14:00",
          location_in: d.location_in || "",
          location_out: d.location_out || "",
          pengancakan: d.pengancakan || "",
          total_late_time: d.total_late_time || "",
          go_home_early: d.go_home_early || "",
          attendance_type: d.attendance_type || "REGULAR",
          attendance: d.attendance || "MK",
          exception_case: existingException,
          no_ba_exca: existingBaExca,
          no_ba_exca_file: undefined,
          fcba: d.fcba || "",
          section: d.section || "",
          gang: d.gang || "",
          fcba_destination: d.fcba_destination || "",
          id_device:
            d.id_device ||
            `${getReadableDevice()} • ${getOrCreateDeviceIds().deviceId}`,
          mac_address: d.mac_address || getOrCreateDeviceIds().pseudoMac,
          images: undefined,
          mandays: d.mandays != null ? String(d.mandays) : "0",
        };
        setForm(() => filled);

        setSelFcba(d.fcba || homeFcba || "");
        setSelSection(d.section || homeSection || "");
        setSelGang(d.gang || "");

        setDestFcba(d.fcba_destination || "");
        setPreview(d.images || "");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memuat detail";
        showAlert(msg, "error");
      } finally {
        setDetailLoading(false);
      }
    },
    [showAlert, homeFcba, homeSection]
  );

  /* ===== PREVIEW FOTO ===== */
  const onChangeImage = (f?: File) => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    if (!f) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(f);
    setPreview(url);
  };
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ===== Columns ===== */
  const sortByLabel = (
    a: Absensi,
    b: Absensi,
    getLabel: (r: Absensi) => string
  ) =>
    getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: "base" });

  const columns: TableColumn<Absensi>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data absensi">Aksi</span>,
        width: "120px",
        cell: (row) => {
          const status = (row.status_attendance || "").toLowerCase();
          const isPlanned = status === "planned";
          const canEditRole = userLevel === "ADM" || userLevel === "AST";
          const canEdit = canEditRole && isPlanned;

          const canDelete =
            userLevel === "ADM" && status !== "approved" && status !== "";

          return (
            <div className="space-x-1 whitespace-nowrap overflow-visible">
              {canEditRole && (
                <button
                  className={`btn btn-xs ${
                    canEdit ? "btn-outline" : "btn-disabled"
                  }`}
                  onClick={() => canEdit && handleDetail(row.id)}
                  disabled={!canEdit}
                  title={
                    canEdit
                      ? "Edit"
                      : "Hanya bisa edit saat Planned (ADM & AST saja)"
                  }
                >
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  className="btn btn-xs btn-error"
                  onClick={() => handleDelete(row.id)}
                  title="Hapus (hanya ADM & belum Approved)"
                >
                  Hapus
                </button>
              )}
            </div>
          );
        },
        ignoreRowClick: true,
      },
      {
        name: (
          <span title="Status persetujuan absensi (Planned/Approved/dll)">
            Status
          </span>
        ),
        selector: (r) => r.status_attendance ?? "-",
        sortable: true,
        width: "120px",
        cell: (r) => (
          <span
            className={`badge ${
              (r.status_attendance || "").toLowerCase() === "planned"
                ? "badge-warning"
                : (r.status_attendance || "").toLowerCase() === "approved"
                ? "badge-success"
                : "badge-ghost"
            }`}
          >
            {r.status_attendance ?? "-"}
          </span>
        ),
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
        width: "100px",
        cell: (r) => {
          const raw = (r.tanggal || "").split(" ")[0];
          return <span title={raw}>{formatDateDMY(raw)}</span>;
        },
      },
      {
        name: <span title="Nama dan kode karyawan">Karyawan</span>,
        style: { flexGrow: 2 as number, minWidth: "220px" },
        width: "240px",
        sortable: true,
        sortFunction: (a, b) =>
          sortByLabel(
            a,
            b,
            (r) => `${r.namakaryawan || ""} ${r.kode_karyawan || ""}`
          ),
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
        name: <span title="Mandor (atasan langsung) karyawan">Mandor</span>,
        width: "200px",
        style: { flexGrow: 1.5 as number, minWidth: "220px" },
        sortable: true,
        sortFunction: (a, b) =>
          sortByLabel(a, b, (r) => {
            const code = r.kode_karyawan_mandor || "";
            const label = (code && (empLabelMap.get(code) || code)) || "";
            return label;
          }),
        cell: (r) => {
          const code = r.kode_karyawan_mandor || "";
          if (!code) return <>-</>;
          const label = empLabelMap.get(code) || code;
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
        name: <span title="Jenis absensi (REGULAR atau ASSISTENSI)">Type</span>,
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
        name: <span title="HK (mandays), hanya >0 untuk KJ/WH/WS">HK</span>,
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
              href={getProxiedImageUrl(r.images)}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka foto"
            >
              {/*
                Changed: use next/image instead of raw <img> to address the linter/optimizaton warning.
                - width/height set to match original w-10 h-10 (40x40)
                - onError sets placeholder
                - unoptimized used to avoid requiring remoteDomains config
              */}
              <Image
                src={getProxiedImageUrl(r.images)}
                alt="foto"
                width={40}
                height={40}
                className="rounded-lg ring-1 ring-base-300 object-cover bg-base-200"
                loading="lazy"
                onError={(e) => {
                  // fallback to placeholder on error
                  const img = e?.currentTarget as HTMLImageElement | null;
                  if (img) {
                    img.onerror = null;
                    img.src = PLACEHOLDER_IMAGE;
                  }
                }}
                unoptimized
              />
            </a>
          ) : (
            "-"
          ),
        ignoreRowClick: true,
      },
    ],
    [handleDetail, handleDelete, empLabelMap, userLevel]
  );

  /* ===== Quick search lokal ===== */
  const filtered = useMemo(() => {
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
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [q, items]);

  const disableUnlessAllowed = (allowed: boolean) =>
    isEditing ? !allowed : false;

  const canAddOrEdit = userLevel === "ADM" || userLevel === "AST";

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
            title="Halaman pengelolaan Attendance (Absensi)"
          >
            Attendance (Absensi)
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
              onClick={() => fetchList()}
              title="Refresh data absensi"
            >
              Refresh
            </button>
            {canAddOrEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onAddClick}
                title="Tambah data absensi baru (hanya ADM & AST)"
              >
                + Tambah Absensi
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="Cari apapun (karyawan, fcba, mandor, device, lokasi...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            title="Pencarian cepat di semua kolom penting"
          />
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Tanggal Awal */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Awal"
                value={filters.tanggal ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal: e.target.value }))
                }
                title="Filter tanggal awal absensi"
              />
              {/* Tanggal Akhir */}
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Akhir"
                value={filters.tanggal_end ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal_end: e.target.value }))
                }
                title="Filter tanggal akhir absensi"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.kode_karyawan ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, kode_karyawan: e.target.value }))
                }
                title="Filter berdasarkan kode karyawan"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Mandor"
                value={filters.kode_karyawan_mandor ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    kode_karyawan_mandor: e.target.value,
                  }))
                }
                title="Filter berdasarkan kode mandor"
              />
              <input
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fcba: e.target.value }))
                }
                title="Filter berdasarkan FCBA"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, afdeling: e.target.value }))
                }
                title="Filter berdasarkan Afdeling / Section"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Gang"
                value={filters.gang ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, gang: e.target.value }))
                }
                title="Filter berdasarkan kode Gang"
              />
              <select
                className="select select-bordered w-full"
                value={filters.attendance ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, attendance: e.target.value }))
                }
                title="Filter berdasarkan kode attendance"
              >
                <option value="">Attendance</option>
                {["KJ", "MK", "WH", "WS", "ML", "P1", "KB", "OT"].map((v) => (
                  <option key={`att-${v}`} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                className="select select-bordered w-full"
                value={filters.attendance_type ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, attendance_type: e.target.value }))
                }
                title="Filter berdasarkan jenis attendance"
              >
                <option value="">Type</option>
                <option value="REGULAR">REGULAR</option>
                <option value="ASSISTENSI">ASSISTENSI</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={filters.status_attendance ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    status_attendance: e.target.value,
                  }))
                }
                title="Filter berdasarkan status attendance"
              >
                <option value="">Status</option>
                <option value="Approved">Approved</option>
                <option value="Planned">Planned</option>
                <option value="Reject">Reject</option>
              </select>
              <input
                className="input input-bordered w-full"
                placeholder="FCBA Tujuan"
                value={filters.fcba_destination ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({
                    ...s,
                    fcba_destination: e.target.value,
                  }))
                }
                title="Filter berdasarkan FCBA tujuan"
              />
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className="btn btn-outline"
                onClick={() => fetchList()}
                title="Terapkan filter"
              >
                Terapkan Filter
              </button>
              <button
                className="btn"
                onClick={() => {
                  const resetFilters: Filters = {
                    tanggal: "",
                    tanggal_end: "",
                    kode_karyawan_mandor: "",
                    kode_karyawan: "",
                    fcba: "",
                    afdeling: "",
                    gang: "",
                    attendance: "",
                    attendance_type: "",
                    status_attendance: "",
                    fcba_destination: "",
                  };
                  setFilters(resetFilters);
                  // pass resetFilters as override so fetchList uses cleared filters immediately
                  fetchList(resetFilters);
                }}
                title="Reset semua filter"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* DataTable */}
        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
          <div className="min-w-[900px] md:min-w-0">
            <DataTable
              keyField="_rowKey"
              columns={columns}
              data={filtered}
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
                <div className="py-8 text-base-content/70">Tidak ada data.</div>
              }
            />
          </div>
        </div>

        {/* MODAL ADD/EDIT */}
        {open && (
          <div className="modal modal-open">
            <div className="modal-box max-w-5xl relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Tutup"
              >
                ✕
              </button>
              <h3 className="font-bold text-xl mb-3">
                {isEditing ? "Edit Data Absensi" : "Tambah Absensi"}
              </h3>
              {detailLoading && (
                <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                  <div className="flex items-center gap-3">
                    <span className="loading loading-spinner loading-lg" />
                    <span>Memuat detail...</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-1">
                {/* Tanggal */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Tanggal *</legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.tanggal ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, tanggal: e.target.value }))
                    }
                    required
                    disabled={disableUnlessAllowed(false)}
                    title="Tanggal absensi"
                  />
                </fieldset>

                {/* Type */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Attendance Type *</legend>
                  <SearchSelect
                    options={[
                      { value: "REGULAR", label: "REGULAR" },
                      { value: "ASSISTENSI", label: "ASSISTENSI" },
                    ]}
                    value={form.attendance_type}
                    onChange={(v) =>
                      setForm((s) => ({
                        ...s,
                        attendance_type: v as FormState["attendance_type"],
                      }))
                    }
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* FCBA */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">
                    {userLevel === "ADM" ? "FCBA" : "FCBA (akun)"}
                  </legend>
                  {userLevel === "ADM" ? (
                    <SearchSelect
                      options={fcbaOptions}
                      value={selFcba}
                      onChange={(v) => {
                        setSelFcba(v);
                        setSelSection("");
                        setSelGang("");
                        setForm((s) => ({
                          ...s,
                          fcba: v,
                          section: "",
                          gang: "",
                          kode_karyawan: "",
                          pengancakan: "",
                        }));
                      }}
                      placeholder="Pilih FCBA"
                      small
                      disabled={disableUnlessAllowed(false)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={homeFcba ?? ""}
                      readOnly
                      disabled
                    />
                  )}
                </fieldset>

                {/* FCBA Dest */}
                {form.attendance_type === "ASSISTENSI" && (
                  <fieldset className="fieldset col-span-12 md:col-span-3">
                    <legend className="fieldset-legend">
                      FCBA Destination *
                    </legend>
                    <SearchSelect
                      options={fcbaOptions.filter(
                        (o) =>
                          o.value &&
                          (!currentFcbaForForm ||
                            o.value !== currentFcbaForForm)
                      )}
                      value={destFcba ?? ""}
                      onChange={onChangeDestFcba}
                      placeholder={
                        currentFcbaForForm
                          ? "Pilih FCBA tujuan"
                          : "Pilih FCBA dulu"
                      }
                      disabled={
                        !currentFcbaForForm || disableUnlessAllowed(false)
                      }
                    />
                  </fieldset>
                )}

                {/* Mandor */}
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">Mandor (opsional)</legend>
                  <SearchSelect
                    options={mandorOptions}
                    value={form.kode_karyawan_mandor ?? ""}
                    onChange={(v) =>
                      setForm((s) => ({ ...s, kode_karyawan_mandor: v }))
                    }
                    placeholder="Pilih Mandor"
                    small
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* Section / Gang / Karyawan */}
                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">
                    Afdeling (Section)
                  </legend>
                  <SearchSelect
                    options={sectionOptions}
                    value={selSection ?? ""}
                    onChange={onChangeSection}
                    placeholder={
                      selFcba
                        ? userLevel === "AST"
                          ? homeSection || "Afdeling terkunci"
                          : "Pilih Afdeling"
                        : "Pilih FCBA dulu"
                    }
                    disabled={
                      !selFcba ||
                      disableUnlessAllowed(false) ||
                      userLevel === "AST"
                    }
                    small
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-4">
                  <legend className="fieldset-legend">Gang</legend>
                  <SearchSelect
                    options={gangOptions}
                    value={selGang ?? ""}
                    onChange={onChangeGang}
                    placeholder={
                      selSection ? "Pilih Gang" : "Pilih Afdeling dulu"
                    }
                    disabled={!selSection || disableUnlessAllowed(false)}
                    small
                  />
                </fieldset>

                <fieldset className="fieldset  col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">Karyawan *</legend>
                  <SearchSelect
                    options={employeeOptions}
                    value={form.kode_karyawan ?? ""}
                    onChange={onChangeEmployee}
                    placeholder={selGang ? "Pilih Karyawan" : "Pilih Gang dulu"}
                    disabled={!selGang || disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* Attendance */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Attendance *</legend>
                  <SearchSelect
                    options={[
                      "KJ",
                      "MK",
                      "WH",
                      "WS",
                      "ML",
                      "P1",
                      "KB",
                      "OT",
                    ].map((v) => ({
                      value: v,
                      label: v,
                    }))}
                    value={form.attendance ?? "KJ"}
                    onChange={(v) =>
                      setForm((s) => ({
                        ...s,
                        attendance: v as FormState["attendance"],
                      }))
                    }
                    small
                    disabled={disableUnlessAllowed(false)}
                  />
                </fieldset>

                {/* Pengancakan */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">
                    Pengancakan (No Ancak)
                  </legend>
                  <SearchSelect
                    options={pengancakanOptions}
                    value={form.pengancakan ?? ""}
                    onChange={(v) => setForm((s) => ({ ...s, pengancakan: v }))}
                    placeholder={
                      selGang ? "Pilih Pengancakan" : "Pilih Gang/Karyawan dulu"
                    }
                    disabled={!selGang || disableUnlessAllowed(false)}
                    small
                  />
                </fieldset>

                {/* Time & Location */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Time In (HH:MM) *</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_in ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, time_in: e.target.value }))
                    }
                    required
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    Default 06:00. Jika di atas 06:00, kolom Late otomatis
                    terisi.
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Time Out (HH:MM)</legend>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={form.time_out ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, time_out: e.target.value }))
                    }
                    disabled={disableUnlessAllowed(false)}
                  />
                  <p className="text-xs mt-1 opacity-70">
                    Default 14:00. Jika sebelum 14:00, kolom Go Home Early
                    otomatis terisi.
                  </p>
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Location In *</legend>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.location_in ?? ""}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, location_in: e.target.value }))
                      }
                      required
                      disabled={disableUnlessAllowed(false)}
                    />
                    <button
                      type="button"
                      className={`btn btn-square ${
                        locLoading === "in" ? "btn-disabled" : ""
                      }`}
                      onClick={() => handleGetLocation("in")}
                      disabled={
                        disableUnlessAllowed(false) || locLoading !== null
                      }
                      title="Ambil lokasi otomatis dari GPS"
                    >
                      {locLoading === "in" ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "📍"
                      )}
                    </button>
                  </div>
                  {form.location_in && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={buildMapUrl(form.location_in)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  )}
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">Location Out</legend>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.location_out ?? ""}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, location_out: e.target.value }))
                      }
                      disabled={disableUnlessAllowed(false)}
                    />
                    <button
                      type="button"
                      className={`btn btn-square ${
                        locLoading === "out" ? "btn-disabled" : ""
                      }`}
                      onClick={() => handleGetLocation("out")}
                      disabled={
                        disableUnlessAllowed(false) || locLoading !== null
                      }
                      title="Ambil lokasi otomatis dari GPS"
                    >
                      {locLoading === "out" ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "📍"
                      )}
                    </button>
                  </div>
                  {form.location_out && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={buildMapUrl(form.location_out)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  )}
                </fieldset>

                {/* Lain-lain */}
                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">Total Late (H:MM)</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center pointer-events-none select-none"
                    value={form.total_late_time ?? ""}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>

                <fieldset className="fieldset col-span-6 md:col-span-2">
                  <legend className="fieldset-legend">
                    Go Home Early (H:MM)
                  </legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center pointer-events-none select-none"
                    value={form.go_home_early ?? ""}
                    readOnly
                    tabIndex={-1}
                  />
                </fieldset>

                {/* Mandays/HK */}
                <fieldset className="fieldset col-span-12 md:col-span-2">
                  <legend className="fieldset-legend">HK (otomatis)</legend>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full text-center"
                    value={form.mandays}
                    readOnly
                  />
                </fieldset>

                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">
                    MAC Address (pseudo)
                  </legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.mac_address ?? ""}
                    readOnly
                  />
                </fieldset>

                {/* Device */}
                <fieldset className="fieldset col-span-12 md:col-span-3">
                  <legend className="fieldset-legend">ID Device (auto)</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.id_device ?? ""}
                    readOnly
                  />
                </fieldset>

                {/* Exception Case */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    Exception Case
                    {!isEditing || !initialHasException ? " *" : ""}
                  </legend>
                  <textarea
                    className="textarea textarea-bordered min-h-24 w-full"
                    value={form.exception_case ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, exception_case: e.target.value }))
                    }
                    required={!isEditing || !initialHasException}
                  />
                </fieldset>

                {/* BA EXCA PDF */}
                <fieldset className="fieldset col-span-12 md:col-span-6">
                  <legend className="fieldset-legend">
                    No BA EXCA (PDF)
                    {!isEditing || !initialHasBaExca ? " *" : ""}
                  </legend>
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        no_ba_exca_file: e.target.files?.[0],
                      }))
                    }
                    required={!isEditing || !initialHasBaExca}
                  />
                  {form.no_ba_exca && (
                    <div className="mt-1">
                      <a
                        className="link link-primary text-sm"
                        href={form.no_ba_exca}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat BA EXCA saat ini (PDF)
                      </a>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    Disimpan di folder yang sama dengan foto (images).
                  </p>
                </fieldset>

                {/* Upload Foto & Preview */}
                <div className="col-span-12">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Lampiran Foto</legend>
                    <input
                      ref={imgRef}
                      type="file"
                      accept="image/*"
                      className="file-input file-input-bordered w-full"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setForm((s) => ({ ...s, images: f }));
                        onChangeImage(f);
                      }}
                      disabled={disableUnlessAllowed(false)}
                    />
                  </fieldset>
                  {preview && (
                    <div className="mt-2 relative h-48 w-full">
                      {preview.startsWith("blob:") ? (
                        <Image
                          src={preview}
                          alt="preview"
                          fill
                          className="object-contain rounded-xl ring-1 ring-inset ring-black/10"
                        />
                      ) : (
                        <a
                          href={preview}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src={preview}
                            alt="preview"
                            fill
                            className="object-contain rounded-xl ring-1 ring-inset ring-black/10"
                          />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-action col-span-12">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setOpen(false)}
                  >
                    Batal
                  </button>
                  <button
                    className={`btn btn-primary ${
                      submitting ? "btn-disabled" : ""
                    }`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="loading loading-spinner" />
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
