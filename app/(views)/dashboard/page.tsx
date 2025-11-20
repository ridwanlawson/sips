"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
} from "@/app/components/dashboard-chart";
import { logoutAndRedirect } from "@/utils/authHelper";

/* =========================
   T Y P E S
========================= */

type UserLevel = "ADM" | "MGR" | "AST" | "OTHER";

interface UserProfile {
  id?: string | number;
  username?: string;
  fullname?: string;
  level?: string;
  fcba?: string;
  afdeling?: string;
  section?: string;
  gang?: string;
}

interface AttendanceRecord {
  id?: string | number;
  tanggal?: string | null; // "YYYY-MM-DD HH:mm:ss"
  attendance?: string | null; // KJ, WH, WS, KB, OT, P1, MK, dll
  total_late_time?: string | null; // "HH:MM"
  go_home_early?: string | null; // "HH:MM" → pulang awal
  fcba?: string | null;
  section?: string | null;
  gang?: string | null;
}

interface DashboardStats {
  totalHadir: number;
  totalTelat: number;
  totalPulangAwal: number;
  totalAlpa: number;
}

type Timeframe = "daily" | "weekly" | "monthly" | "yearly";

interface DailyGroupKey {
  date: string;
  fcba?: string;
  afdeling?: string;
}

interface DailySummary extends DailyGroupKey {
  hadir: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  hadir: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface YearlySummary {
  year: number;
  hadir: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface Triplet {
  fcba: string;
  sectionname: string;
  gangcode: string;
}

interface Option {
  value: string;
  label: string;
}

type DetailMode = "perHari" | "perBaris";

/* =========================
   U T I L S
========================= */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? decodeURIComponent(m.pop() as string) : null;
};

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
};

// Range tanggal utk filter FRONTEND
const getDateRange = (frame: Timeframe): { from: string; to: string } => {
  const today = new Date();
  const dateTo = new Date(today);
  const dateFrom = new Date(today);

  if (frame === "daily") {
    // hanya hari ini
  } else if (frame === "weekly") {
    dateFrom.setDate(today.getDate() - 6);
  } else if (frame === "monthly") {
    dateFrom.setDate(1);
  } else if (frame === "yearly") {
    dateFrom.setMonth(0, 1);
    dateTo.setMonth(11, 31);
  }

  const toISO = (d: Date) => d.toISOString().split("T")[0];
  return { from: toISO(dateFrom), to: toISO(dateTo) };
};

const parseDateOnly = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const onlyDate = trimmed.split(" ")[0];
  if (!onlyDate) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return null;
  return onlyDate;
};

const formatDateID = (yyyyMmDd: string): string => {
  const d = new Date(yyyyMmDd + "T00:00:00");
  if (Number.isNaN(+d)) return yyyyMmDd;
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonthID = (year: number, month: number): string => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
};

const formatYearID = (year: number): string => {
  return year.toString();
};

// Klasifikasi berdasarkan KODE + total_late_time + go_home_early
type ClassifiedStatus = "HADIR" | "TELAT" | "PULANG_AWAL" | "ALPHA" | "OTHER";

const isNonZeroTime = (raw?: string | null): boolean => {
  if (!raw) return false;
  const t = raw.trim();
  if (!t) return false;
  if (t === "0" || t === "00:00" || t === "0:00") return false;
  return true;
};

const classifyStatus = (record: AttendanceRecord): ClassifiedStatus => {
  const code = (record.attendance || "").toUpperCase().trim();
  const lateRaw = record.total_late_time;
  const goHomeRaw = record.go_home_early;

  const isHadirCode = ["KJ", "WH", "WS", "OT", "KB"].includes(code);
  const isAlphaCode = ["P1", "MK"].includes(code);

  // Urutan prioritas:
  // 1. ALPHA (izin/mangkir)
  // 2. PULANG_AWAL (kalau ada go_home_early)
  // 3. TELAT (kalau late > 0)
  // 4. HADIR biasa
  if (isAlphaCode) return "ALPHA";

  if (isHadirCode) {
    if (isNonZeroTime(goHomeRaw)) {
      return "PULANG_AWAL";
    }
    if (isNonZeroTime(lateRaw)) {
      return "TELAT";
    }
    return "HADIR";
  }

  return "OTHER";
};

// Ekstrak array data dari response API (ok + data / data.data)
const extractAttendanceArray = (payload: unknown): AttendanceRecord[] => {
  if (!isRecord(payload)) return [];
  if ("ok" in payload && payload.ok === true && "data" in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) return d as AttendanceRecord[];
    if (
      isRecord(d) &&
      "data" in d &&
      Array.isArray((d as { data: unknown }).data)
    ) {
      return (d as { data: AttendanceRecord[] }).data;
    }
  }
  return [];
};

const extractTriplets = (payload: unknown): Triplet[] => {
  if (!isRecord(payload)) return [];
  if ("ok" in payload && payload.ok === true && "data" in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) {
      return d
        .map((row) => {
          if (!isRecord(row)) return null;
          const fcba = String(row.fcba ?? "").trim();
          const sectionname = String(row.sectionname ?? "").trim();
          const gangcode = String(row.gangcode ?? "").trim();
          if (!fcba && !sectionname && !gangcode) return null;
          return { fcba, sectionname, gangcode };
        })
        .filter((v): v is Triplet => v !== null);
    }
    if (
      isRecord(d) &&
      "data" in d &&
      Array.isArray((d as { data: unknown }).data)
    ) {
      return extractTriplets({ ok: true, data: (d as { data: unknown }).data });
    }
  }
  return [];
};

/* =========================
   S E A R C H  S E L E C T
========================= */

const SearchSelect: React.FC<{
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  small?: boolean;
}> = ({ options, value, onChange, placeholder, disabled, small }) => {
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
    const handler = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const target = e.target as Node | null;
      if (target && !boxRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    options.find((o) => o.value === value)?.label || value || "";

  const handleToggle = () => {
    if (disabled) return;
    setOpen((s) => !s);
  };

  // posisi dropdown fixed agar tidak kepotong
  const dropdownStyle = useMemo(() => {
    if (!open || !boxRef.current) return undefined;
    const rect = boxRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      top: rect.bottom + 4,
    };
  }, [open]);

  return (
    <div className="relative overflow-visible" ref={boxRef}>
      <button
        type="button"
        className={`input input-bordered w-full flex items-center justify-between whitespace-nowrap overflow-hidden ${
          small ? "input-sm" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={handleToggle}
        disabled={disabled}
        title={currentLabel || placeholder}
      >
        <span className={`truncate ${!value ? "text-base-content/50" : ""}`}>
          {currentLabel || placeholder || "Pilih..."}
        </span>
        <span className="ml-2">▾</span>
      </button>

      {open && !disabled && (
        <div
          className="fixed z-[999] rounded-xl border border-base-300 bg-base-100 shadow-xl"
          style={dropdownStyle}
        >
          <div className="p-2">
            <input
              autoFocus
              className="input input-bordered w-full input-sm"
              placeholder="Ketik untuk mencari..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.length === 0 && (
              <li className="p-3 text-base-content/60 text-sm">
                Tidak ada data
              </li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-base-200 text-sm ${
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
   M A I N  D A S H B O A R D
========================= */

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel>("OTHER");

  // RAW dari API (tanpa filter tanggal)
  const [attendanceRaw, setAttendanceRaw] = useState<AttendanceRecord[]>([]);

  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [filterFcba, setFilterFcba] = useState<string>("ALL");
  const [filterAfdeling, setFilterAfdeling] = useState<string>("");

  const [showFilters, setShowFilters] = useState(false);

  // Mode tampilan riwayat: per hari (rekap) / per baris (detail)
  const [detailMode, setDetailMode] = useState<DetailMode>("perHari");

  // State untuk mengatasi hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  /* ===== Bootstrap user dari cookies + /api/user/profile ===== */
  useEffect(() => {
    const cookieFullname =
      readCookie("user_FullName") ||
      readCookie("user_fullname") ||
      readCookie("user_Name") ||
      readCookie("user_name") ||
      "";
    const cookieLevelRaw =
      readCookie("user_Level") ||
      readCookie("user_LEVEL") ||
      readCookie("user_level") ||
      "";
    const cookieFcba =
      readCookie("user_Fcba") ||
      readCookie("user_FCBA") ||
      readCookie("user_fcba") ||
      "";
    const cookieSection =
      readCookie("user_Section") ||
      readCookie("user_SECTION") ||
      readCookie("user_section") ||
      readCookie("user_Afdeling") ||
      readCookie("user_afdeling") ||
      "";
    const cookieGang =
      readCookie("user_Gang") ||
      readCookie("user_gang") ||
      readCookie("user_GANG") ||
      "";

    let lvl: UserLevel = "OTHER";
    const upperLvl = cookieLevelRaw.toUpperCase();
    if (upperLvl === "ADM" || upperLvl === "MGR" || upperLvl === "AST") {
      lvl = upperLvl;
    }

    setUserLevel(lvl);
    setUserProfile((prev) => ({
      ...(prev || {}),
      fullname: cookieFullname || prev?.fullname,
      level: upperLvl || prev?.level,
      fcba: cookieFcba || prev?.fcba,
      afdeling: cookieSection || prev?.afdeling,
      gang: cookieGang || prev?.gang,
    }));

    if (lvl === "ADM") {
      setFilterFcba("ALL");
      setFilterAfdeling("");
    } else if (lvl === "MGR") {
      setFilterFcba(cookieFcba || "");
      setFilterAfdeling("");
    } else if (lvl === "AST") {
      setFilterFcba(cookieFcba || "");
      setFilterAfdeling(cookieSection || "");
    }

    // Ambil triplets dari cookie kalau ada
    const ckTrip = readCookie("opt_triplets");
    if (ckTrip) {
      try {
        const arr = JSON.parse(ckTrip) as Triplet[];
        if (Array.isArray(arr) && arr.length > 0) {
          setTriplets(arr);
        }
      } catch {
        // ignore
      }
    }

    // Fetch profile untuk pelengkap (opsional)
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const json: unknown = await res.json();
        if (res.ok && isRecord(json) && json.ok === true && "data" in json) {
          const dRaw = (json as { data: unknown }).data;
          const inner =
            isRecord(dRaw) && "data" in dRaw && isRecord(dRaw.data)
              ? (dRaw as { data: UserProfile }).data
              : (dRaw as UserProfile);

          setUserProfile((prev) => ({
            ...(prev || {}),
            ...inner,
          }));

          const lvl2 = (inner.level || "").toUpperCase();
          if (lvl2 === "ADM" || lvl2 === "MGR" || lvl2 === "AST") {
            setUserLevel(lvl2);
            if (lvl2 === "ADM") {
              setFilterFcba("ALL");
            } else if (lvl2 === "MGR") {
              setFilterFcba(inner.fcba || cookieFcba || "");
            } else if (lvl2 === "AST") {
              setFilterFcba(inner.fcba || cookieFcba || "");
              setFilterAfdeling(
                inner.afdeling || inner.section || cookieSection || ""
              );
            }
          }
        }
      } catch {
        // abaikan error kecil
      }
    })();

    // Kalau triplets belum ada → coba ambil dari /api/karyawans
    if (!ckTrip) {
      (async () => {
        try {
          const res = await fetch("/api/karyawans", {
            credentials: "include",
          });
          const json: unknown = await res.json();
          const t = extractTriplets(json);
          if (t.length > 0) setTriplets(t);
        } catch {
          // ignore
        }
      })();
    }
  }, []);

  /* ===== Options FCBA & Afdeling (chain) ===== */
  const fcbaOptions: Option[] = useMemo(() => {
    const uniq = Array.from(
      new Set(triplets.map((t) => t.fcba).filter(Boolean))
    ).sort();

    const base = uniq.map((v) => ({ value: v, label: v }));
    if (userLevel === "ADM") {
      return [{ value: "ALL", label: "ALL FCBA" }, ...base];
    }
    return base;
  }, [triplets, userLevel]);

  const afdelingOptions: Option[] = useMemo(() => {
    if (!filterFcba || filterFcba === "ALL") {
      const uniq = Array.from(
        new Set(triplets.map((t) => t.sectionname).filter(Boolean))
      ).sort();
      return uniq.map((v) => ({ value: v, label: v }));
    }
    const uniq = Array.from(
      new Set(
        triplets
          .filter((t) => t.fcba === filterFcba)
          .map((t) => t.sectionname)
          .filter(Boolean)
      )
    ).sort();
    return uniq.map((v) => ({ value: v, label: v }));
  }, [triplets, filterFcba]);

  /* ===== Fetch Attendance (TANPA filter tanggal) ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();

        const homeFcba =
          userProfile?.fcba ||
          readCookie("user_Fcba") ||
          readCookie("user_FCBA") ||
          readCookie("user_fcba") ||
          "";
        const homeAfdeling =
          userProfile?.afdeling ||
          userProfile?.section ||
          readCookie("user_Section") ||
          readCookie("user_SECTION") ||
          readCookie("user_section") ||
          readCookie("user_Afdeling") ||
          readCookie("user_afdeling") ||
          "";

        if (userLevel === "ADM") {
          if (filterFcba && filterFcba !== "ALL") {
            params.set("fcba", filterFcba.trim());
          }
          if (filterAfdeling.trim()) {
            params.set("afdeling", filterAfdeling.trim());
          }
        } else if (userLevel === "MGR") {
          if (homeFcba) params.set("fcba", homeFcba.trim());
          if (filterAfdeling.trim()) {
            params.set("afdeling", filterAfdeling.trim());
          }
        } else if (userLevel === "AST") {
          if (homeFcba) params.set("fcba", homeFcba.trim());
          if (homeAfdeling) params.set("afdeling", homeAfdeling.trim());
        } else {
          // OTHER → tidak kirim fcba/afdeling (lihat semuanya)
        }

        const res = await fetch(
          `/api/attendance${params.toString() ? `?${params}` : ""}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "include",
          }
        );

        if (!res.ok) {
          if (res.status === 404) {
            setAttendanceRaw([]);
            return;
          }
          if (res.status === 401) {
            await logoutAndRedirect();
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json: unknown = await res.json();
        const rows = extractAttendanceArray(json);

        setAttendanceRaw(rows);
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
        setError("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filterFcba,
    filterAfdeling,
    userLevel,
    userProfile?.fcba,
    userProfile?.afdeling,
    userProfile?.section,
  ]);

  /* ===== Filter berdasarkan Timeframe (FRONTEND) ===== */
  const filteredAttendance: AttendanceRecord[] = useMemo(() => {
    if (!attendanceRaw.length) return [];
    const { from, to } = getDateRange(timeframe);
    return attendanceRaw.filter((r) => {
      const d = parseDateOnly(r.tanggal);
      if (!d) return false;
      return d >= from && d <= to;
    });
  }, [attendanceRaw, timeframe]);

  /* ===== Stats dari filteredAttendance ===== */

  const stats: DashboardStats = useMemo(() => {
    let totalHadir = 0;
    let totalTelat = 0;
    let totalPulangAwal = 0;
    let totalAlpa = 0;

    for (const r of filteredAttendance) {
      const cls = classifyStatus(r);
      if (cls === "HADIR") totalHadir += 1;
      else if (cls === "TELAT") totalTelat += 1;
      else if (cls === "PULANG_AWAL") totalPulangAwal += 1;
      else if (cls === "ALPHA") totalAlpa += 1;
    }

    return { totalHadir, totalTelat, totalPulangAwal, totalAlpa };
  }, [filteredAttendance]);

  /* ===== Aggregasi berdasarkan Timeframe ===== */

  // Aggregasi Harian (dipakai utk Riwayat Per Hari & Line Chart harian)
  const dailySummaries: DailySummary[] = useMemo(() => {
    const map = new Map<string, DailySummary>();

    for (const r of filteredAttendance) {
      const dateOnly = parseDateOnly(r.tanggal);
      if (!dateOnly) continue;

      let keyObj: DailyGroupKey;
      if (userLevel === "ADM") {
        keyObj = {
          date: dateOnly,
          fcba: r.fcba || "-",
          afdeling: r.section || "-",
        };
      } else if (userLevel === "MGR") {
        keyObj = {
          date: dateOnly,
          afdeling: r.section || "-",
        };
      } else {
        keyObj = { date: dateOnly };
      }

      const keyParts = [keyObj.date];
      if (keyObj.fcba) keyParts.push(`FCBA:${keyObj.fcba}`);
      if (keyObj.afdeling) keyParts.push(`AFD:${keyObj.afdeling}`);
      const key = keyParts.join("|");

      let summary = map.get(key);
      if (!summary) {
        summary = {
          ...keyObj,
          hadir: 0,
          telat: 0,
          pulangAwal: 0,
          alpa: 0,
        };
        map.set(key, summary);
      }

      const cls = classifyStatus(r);
      if (cls === "HADIR") summary.hadir += 1;
      else if (cls === "TELAT") summary.telat += 1;
      else if (cls === "PULANG_AWAL") summary.pulangAwal += 1;
      else if (cls === "ALPHA") summary.alpa += 1;
    }

    const arr = Array.from(map.values());
    // sort berdasarkan tanggal (terbaru dulu)
    arr.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return arr;
  }, [filteredAttendance, userLevel]);

  // Aggregasi Bulanan (untuk line chart monthly / yearly)
  const monthlySummaries: MonthlySummary[] = useMemo(() => {
    if (timeframe !== "monthly" && timeframe !== "yearly") return [];

    const map = new Map<string, MonthlySummary>();

    for (const r of filteredAttendance) {
      const dateOnly = parseDateOnly(r.tanggal);
      if (!dateOnly) continue;

      const [year, month] = dateOnly.split("-").map(Number);
      const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

      let summary = map.get(monthKey);
      if (!summary) {
        summary = {
          year,
          month,
          monthName: formatMonthID(year, month),
          hadir: 0,
          telat: 0,
          pulangAwal: 0,
          alpa: 0,
        };
        map.set(monthKey, summary);
      }

      const cls = classifyStatus(r);
      if (cls === "HADIR") summary.hadir += 1;
      else if (cls === "TELAT") summary.telat += 1;
      else if (cls === "PULANG_AWAL") summary.pulangAwal += 1;
      else if (cls === "ALPHA") summary.alpa += 1;
    }

    const arr = Array.from(map.values());
    // sort berdasarkan tahun dan bulan (terbaru dulu)
    arr.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    return arr;
  }, [filteredAttendance, timeframe]);

  // Aggregasi Tahunan (untuk line chart yearly)
  const yearlySummaries: YearlySummary[] = useMemo(() => {
    if (timeframe !== "yearly") return [];

    const map = new Map<number, YearlySummary>();

    for (const r of filteredAttendance) {
      const dateOnly = parseDateOnly(r.tanggal);
      if (!dateOnly) continue;

      const year = parseInt(dateOnly.split("-")[0]);

      let summary = map.get(year);
      if (!summary) {
        summary = {
          year,
          hadir: 0,
          telat: 0,
          pulangAwal: 0,
          alpa: 0,
        };
        map.set(year, summary);
      }

      const cls = classifyStatus(r);
      if (cls === "HADIR") summary.hadir += 1;
      else if (cls === "TELAT") summary.telat += 1;
      else if (cls === "PULANG_AWAL") summary.pulangAwal += 1;
      else if (cls === "ALPHA") summary.alpa += 1;
    }

    const arr = Array.from(map.values());
    // sort berdasarkan tahun (terbaru dulu)
    arr.sort((a, b) => b.year - a.year);
    return arr;
  }, [filteredAttendance, timeframe]);

  // Data per-baris untuk Riwayat Detail (urut tanggal terbaru dulu)
  const rowDetails: AttendanceRecord[] = useMemo(() => {
    const arr = filteredAttendance.slice();
    arr.sort((a, b) => {
      const da = parseDateOnly(a.tanggal) || "";
      const db = parseDateOnly(b.tanggal) || "";
      if (da < db) return 1;
      if (da > db) return -1;
      return 0;
    });
    return arr;
  }, [filteredAttendance]);

  /* ===== Data Chart ===== */

  const barChartData = useMemo(
    () => [
      { label: "Hadir", value: stats.totalHadir },
      { label: "Telat", value: stats.totalTelat },
      { label: "Pulang Awal", value: stats.totalPulangAwal },
      { label: "Alpha", value: stats.totalAlpa },
    ],
    [stats]
  );

  const pieChartData = useMemo(
    () => [
      { label: "Hadir", value: stats.totalHadir, color: "#10b981" },
      { label: "Telat", value: stats.totalTelat, color: "#f59e0b" },
      { label: "Pulang Awal", value: stats.totalPulangAwal, color: "#3b82f6" },
      { label: "Alpha", value: stats.totalAlpa, color: "#ef4444" },
    ],
    [stats]
  );

  // 🔥 Data untuk Line Chart berdasarkan timeframe (sekarang sudah ada Pulang Awal)
  const lineChartData = useMemo(() => {
    if (timeframe === "daily" || timeframe === "weekly") {
      return dailySummaries
        .slice()
        .reverse()
        .map((d) => ({
          label: formatDateID(d.date),
          hadir: d.hadir,
          telat: d.telat,
          pulangAwal: d.pulangAwal,
          alpa: d.alpa,
        }));
    } else if (timeframe === "monthly") {
      return monthlySummaries
        .slice()
        .reverse()
        .map((m) => ({
          label: m.monthName,
          hadir: m.hadir,
          telat: m.telat,
          pulangAwal: m.pulangAwal,
          alpa: m.alpa,
        }));
    } else if (timeframe === "yearly") {
      return yearlySummaries
        .slice()
        .reverse()
        .map((y) => ({
          label: formatYearID(y.year),
          hadir: y.hadir,
          telat: y.telat,
          pulangAwal: y.pulangAwal,
          alpa: y.alpa,
        }));
    }
    return [];
  }, [timeframe, dailySummaries, monthlySummaries, yearlySummaries]);

  const grandTotal =
    stats.totalHadir +
    stats.totalTelat +
    stats.totalPulangAwal +
    stats.totalAlpa;

  const pctHadir = grandTotal
    ? Math.round((stats.totalHadir / grandTotal) * 100)
    : 0;
  const pctTelat = grandTotal
    ? Math.round((stats.totalTelat / grandTotal) * 100)
    : 0;
  const pctPulangAwal = grandTotal
    ? Math.round((stats.totalPulangAwal / grandTotal) * 100)
    : 0;
  const pctAlpa = grandTotal
    ? Math.round((stats.totalAlpa / grandTotal) * 100)
    : 0;

  /* ===== UI Helpers ===== */

  const displayName =
    toTitleCase(
      userProfile?.fullname ||
        readCookie("user_FullName") ||
        userProfile?.username ||
        ""
    ) || "User";

  const displayLevel = (userProfile?.level || "").toUpperCase() || userLevel;

  const displayFcba = userProfile?.fcba || "-";
  const displayAfdeling = userProfile?.afdeling || userProfile?.section || "-";
  const displayGang = userProfile?.gang || "-";

  const timeframeLabel = (tf: Timeframe): string => {
    switch (tf) {
      case "daily":
        return "Per Hari";
      case "weekly":
        return "7 Hari Terakhir";
      case "monthly":
        return "Per Bulan (bulan ini)";
      case "yearly":
        return "Per Tahun (tahun ini)";
      default:
        return "";
    }
  };

  const getTrendLabel = (): string => {
    switch (timeframe) {
      case "daily":
        return "Per Hari";
      case "weekly":
        return "Per Hari (7 Hari Terakhir)";
      case "monthly":
        return "Per Bulan";
      case "yearly":
        return "Per Tahun";
      default:
        return "Per Hari";
    }
  };

  const detailModeLabel =
    detailMode === "perHari" ? "Per Hari (Rekap)" : "Per Baris (Detail)";

  /* =========================
     R E N D E R
  ========================== */

  // Tampilkan loading skeleton sampai client-side rendering siap
  if (!isClient) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="animate-slideUp flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 bg-base-300 rounded w-64 animate-pulse mb-2" />
            <div className="space-y-2">
              <div className="h-6 bg-base-300 rounded w-48 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-48 animate-pulse mb-4" />
              <div className="h-64 bg-base-300 rounded animate-pulse" />
            </div>
          </div>
          <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-48 animate-pulse mb-4" />
              <div className="h-64 bg-base-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
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
              <span className="badge badge-primary badge-lg">
                Level : {displayLevel}
              </span>
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
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-wide text-base-content/60">
            Periode Data:
          </span>
          {(["daily", "weekly", "monthly", "yearly"] as Timeframe[]).map(
            (tf) => (
              <button
                key={tf}
                type="button"
                className={`btn btn-xs md:btn-sm ${
                  timeframe === tf
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {timeframeLabel(tf)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error animate-slideUp">
          <span>{error}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="card bg-base-100 shadow-sm border border-base-300 animate-slideUp">
        <div className="card-body py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="card-title text-sm md:text-base">
              🎯 Filter Data
              <span className="text-xs font-normal text-base-content/60">
                {" "}
                (sesuai level & periode)
              </span>
            </h2>
            <button
              type="button"
              className="btn btn-xs md:btn-sm btn-ghost"
              onClick={() => setShowFilters((s) => !s)}
            >
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {userLevel === "ADM" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold">FCBA</label>
                  <SearchSelect
                    options={fcbaOptions}
                    value={filterFcba}
                    onChange={(v) => {
                      setFilterFcba(v);
                      setFilterAfdeling("");
                    }}
                    placeholder="Pilih FCBA / ALL"
                    small
                  />
                </div>
              )}

              {(userLevel === "ADM" || userLevel === "MGR") && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold">Afdeling</label>
                  <SearchSelect
                    options={afdelingOptions}
                    value={filterAfdeling}
                    onChange={(v) => setFilterAfdeling(v)}
                    placeholder="Pilih Afdeling (opsional)"
                    small
                    disabled={afdelingOptions.length === 0}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Keterangan</label>
                <p className="text-xs text-base-content/60">
                  • <b>HADIR</b> = KJ, WH, WS, OT, KB <br />• <b>ALPHA</b> = P1
                  (izin dianggap alpha), MK (mangkir) <br />• <b>Pulang Awal</b>{" "}
                  = <code>go_home_early</code> lebih dari 0 menit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistik Atas: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
          <div className="card-body">
            <h2 className="card-title text-sm md:text-lg">
              🧭 Komposisi HADIR / TELAT / PULANG AWAL / ALPHA (
              {timeframeLabel(timeframe)})
            </h2>
            {loading ? (
              <div className="h-64 bg-base-300 rounded animate-pulse mt-4" />
            ) : (
              <SimplePieChart data={pieChartData} />
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
          <div className="card-body">
            <h2 className="card-title text-sm md:text-lg">
              📊 Ringkasan Absensi ({timeframeLabel(timeframe)})
            </h2>
            <p className="text-xs text-base-content/60 mt-1">
              Angka di bawah ini adalah <b>total frekuensi</b> untuk periode
              yang dipilih, bukan jumlah karyawan unik.
            </p>
            {loading ? (
              <div className="h-64 bg-base-300 rounded animate-pulse mt-4" />
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
            <h2 className="card-title text-sm md:text-lg">
              📈 Tren Absensi ({getTrendLabel()})
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge badge-success gap-1">
                Hadir {stats.totalHadir} ({pctHadir}%)
              </span>
              <span className="badge badge-warning gap-1">
                Telat {stats.totalTelat} ({pctTelat}%)
              </span>
              <span className="badge badge-info gap-1">
                Pulang Awal {stats.totalPulangAwal} ({pctPulangAwal}%)
              </span>
              <span className="badge badge-error gap-1">
                Alpha {stats.totalAlpa} ({pctAlpa}%)
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-64 bg-base-300 rounded animate-pulse" />
          ) : (
            <SimpleLineChart data={lineChartData} />
          )}
        </div>
      </div>

      {/* Riwayat Absensi Detail */}
      <div className="card bg-base-100 shadow-md border border-base-300 animate-slideUp">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <h2 className="card-title text-sm md:text-lg">
              📋 Riwayat Absensi Detail
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-base-content/60">
                Mode tampilan:
              </span>
              <button
                type="button"
                className={`btn btn-xs md:btn-sm ${
                  detailMode === "perHari"
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
                onClick={() => setDetailMode("perHari")}
              >
                Per Hari (Rekap)
              </button>
              <button
                type="button"
                className={`btn btn-xs md:btn-sm ${
                  detailMode === "perBaris"
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
                onClick={() => setDetailMode("perBaris")}
              >
                Per Baris (Detail)
              </button>
            </div>
          </div>

          <p className="text-xs text-base-content/60 mb-3">
            Periode: <b>{timeframeLabel(timeframe)}</b> • Mode:{" "}
            <b>{detailModeLabel}</b> • Data mengikuti pola level login:
            {userLevel === "ADM" && " ADM melihat per FCBA & Afdeling."}
            {userLevel === "MGR" && " MGR melihat per Afdeling dalam FCBA-nya."}
            {userLevel === "AST" &&
              " AST melihat data sesuai FCBA & Afdeling akun login."}
          </p>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-base-300 rounded animate-pulse"
                />
              ))}
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              📭 Tidak ada data absensi pada periode & filter yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* MODE PER HARI (REKAP) */}
              {detailMode === "perHari" && (
                <table className="table table-sm w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th>Tanggal</th>
                      {userLevel === "ADM" && (
                        <>
                          <th>FCBA</th>
                          <th>Afdeling</th>
                        </>
                      )}
                      {userLevel === "MGR" && <th>Afdeling</th>}
                      <th className="text-center">Hadir</th>
                      <th className="text-center">Telat</th>
                      <th className="text-center">Pulang Awal</th>
                      <th className="text-center">Alpha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummaries.map((d, idx) => (
                      <tr
                        key={`${d.date}-${d.fcba ?? ""}-${
                          d.afdeling ?? ""
                        }-${idx}`}
                        className="hover:bg-base-200"
                      >
                        <td className="whitespace-nowrap font-medium">
                          {formatDateID(d.date)}
                        </td>
                        {userLevel === "ADM" && (
                          <>
                            <td>
                              <span className="badge badge-ghost badge-sm font-mono">
                                {d.fcba || "-"}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-ghost badge-sm font-mono">
                                {d.afdeling || "-"}
                              </span>
                            </td>
                          </>
                        )}
                        {userLevel === "MGR" && (
                          <td>
                            <span className="badge badge-ghost badge-sm font-mono">
                              {d.afdeling || "-"}
                            </span>
                          </td>
                        )}
                        <td className="text-center">
                          <span className="badge badge-success badge-sm">
                            {d.hadir}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-warning badge-sm">
                            {d.telat}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-info badge-sm">
                            {d.pulangAwal}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-error badge-sm">
                            {d.alpa}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* MODE PER BARIS (DETAIL) */}
              {detailMode === "perBaris" && (
                <table className="table table-sm w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th>Tanggal</th>
                      {userLevel === "ADM" && (
                        <>
                          <th>FCBA</th>
                          <th>Afdeling</th>
                          <th>Gang</th>
                        </>
                      )}
                      {userLevel === "MGR" && (
                        <>
                          <th>Afdeling</th>
                          <th>Gang</th>
                        </>
                      )}
                      {userLevel === "AST" && (
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
                      const dateOnly = parseDateOnly(r.tanggal) || "-";
                      const status = classifyStatus(r);

                      // FIX DUPLICATE KEY: gabungkan id + index
                      const keyBase =
                        r.id !== undefined && r.id !== null
                          ? String(r.id)
                          : `${dateOnly}`;
                      const rowKey = `${keyBase}-${idx}`;

                      return (
                        <tr key={rowKey} className="hover:bg-base-200">
                          <td className="whitespace-nowrap">
                            {dateOnly !== "-" ? formatDateID(dateOnly) : "-"}
                          </td>

                          {/* Kolom lokasi disesuaikan level */}
                          {userLevel === "ADM" && (
                            <>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.fcba || "-"}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.section || "-"}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.gang || "-"}
                                </span>
                              </td>
                            </>
                          )}

                          {userLevel === "MGR" && (
                            <>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.section || "-"}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.gang || "-"}
                                </span>
                              </td>
                            </>
                          )}

                          {userLevel === "AST" && (
                            <>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.fcba || "-"}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.section || "-"}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-ghost badge-sm font-mono">
                                  {r.gang || "-"}
                                </span>
                              </td>
                            </>
                          )}

                          <td>
                            <span className="badge badge-outline badge-sm font-mono">
                              {r.attendance || "-"}
                            </span>
                          </td>
                          <td>
                            {status === "HADIR" && (
                              <span className="badge badge-success badge-sm">
                                HADIR
                              </span>
                            )}
                            {status === "TELAT" && (
                              <span className="badge badge-warning badge-sm">
                                TELAT
                              </span>
                            )}
                            {status === "PULANG_AWAL" && (
                              <span className="badge badge-info badge-sm">
                                PULANG AWAL
                              </span>
                            )}
                            {status === "ALPHA" && (
                              <span className="badge badge-error badge-sm">
                                ALPHA
                              </span>
                            )}
                            {status === "OTHER" && (
                              <span className="badge badge-ghost badge-sm">
                                OTHER
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="badge badge-ghost badge-sm font-mono">
                              {isNonZeroTime(r.total_late_time)
                                ? r.total_late_time
                                : "-"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-ghost badge-sm font-mono">
                              {isNonZeroTime(r.go_home_early)
                                ? r.go_home_early
                                : "-"}
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
