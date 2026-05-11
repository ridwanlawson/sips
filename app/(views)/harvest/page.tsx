"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BusinessUnit } from "../../../utils/businessUnitService";
import { fetchBusinessUnits } from "../../../utils/businessUnitService";
import DataTable from "@/app/components/dynamic-data-table";
import type { TableColumn } from "react-data-table-component";
import Image from "next/image";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonTable } from "@/app/components/skeletons";
import { centerHeaderStyle } from "@/utils/tableHelper";
import { isUnauthenticatedJson, logoutAndRedirect } from "@/utils/authHelper";

/* =========================
   Searchable Select Component
======================== */
type Option = { value: string; label: string };

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
          o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s),
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
          className={`input input-bordered w-full flex items-center justify-between whitespace-nowrap overflow-hidden ${small ? "input-sm" : ""
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
                    className={`w-full text-left p-2 hover:bg-base-200 ${opt.value === value ? "bg-base-200" : ""
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
   T Y P E S
========================= */
type Harvest = {
  _rowKey?: string;
  _index?: number;
  id: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan_mandor1?: string | null;
  nama_karyawan_mandor1?: string | null;
  kode_karyawan_mandor_panen?: string | null;
  nama_karyawan_mandor_panen?: string | null;
  kode_karyawan_kerani?: string | null;
  nama_karyawan_kerani?: string | null;
  kode_karyawan: string;
  nama_karyawan: string;
  noancak: string;
  tph: string;
  fieldcode: string;
  fcba: string;
  afdeling: string;
  output: string;
  mentah: string;
  overripe: string;
  busuk: string;
  busuk2: string;
  buahkecil: string;
  brondol: string;
  alasbrondol: string;
  tangkaipanjang: string;
  parteno: string;
  parteno50plus: string;
  status_assistensi?: string | null;
  status_harvesting: string;
  kemandoran?: string | null;
  images?: string | null;
  no_ba_exca?: string | null;
  exception_case?: string | null;
  id_device?: string | null;
  location?: string | null;
  card_id?: string | null;
  created_at?: string | null;
  created_by?: string | null;
};

type Triplet = { fcba: string; sectionname: string; gangcode: string };

type Employee = {
  fccode: string;
  fullname?: string;
  fcba?: string;
  sectionname?: string;
  gangcode?: string;
  noancak?: string;
};

type EmployeesApiRow = {
  [key: string]: unknown;
  fccode?: unknown;
  fcname?: unknown;
  fcba?: unknown;
  sectionname?: unknown;
  gangcode?: unknown;
  noancak?: unknown;
  NOANCAK?: unknown;
};

type FormState = {
  id?: string;
  nodokumen: string;
  tanggal: string;
  kode_karyawan_mandor1: string;
  kode_karyawan_mandor_panen: string;
  kode_karyawan_kerani: string;
  kode_karyawan: string;
  noancak: string;
  tph: string;
  fieldcode: string;
  fcba: string;
  afdeling: string;
  output: string;
  mentah: string;
  overripe: string;
  busuk: string;
  busuk2: string;
  buahkecil: string;
  brondol: string;
  alasbrondol: string;
  tangkaipanjang: string;
  parteno: string;
  parteno50plus: string;
  status_assistensi: string;
  status_harvesting: string;
  kemandoran: string;
  exception_case: string;
  location: string;
  id_device: string;
  card_id: string;
  images: File | null;
  no_ba_exca: File | string | null;
};

const initialForm: FormState = {
  nodokumen: "",
  tanggal: getTodayISO(),
  kode_karyawan_mandor1: "",
  kode_karyawan_mandor_panen: "",
  kode_karyawan_kerani: "",
  kode_karyawan: "",
  noancak: "",
  tph: "",
  fieldcode: "",
  fcba: "",
  afdeling: "",
  output: "",
  mentah: "0",
  overripe: "0",
  busuk: "0",
  busuk2: "0",
  buahkecil: "0",
  brondol: "0",
  alasbrondol: "",
  tangkaipanjang: "0",
  parteno: "0",
  parteno50plus: "0",
  status_assistensi: "",
  status_harvesting: "Planned",
  kemandoran: "",
  exception_case: "",
  location: "",
  id_device: "",
  card_id: "",
  images: null,
  no_ba_exca: null,
};

type Filters = Partial<{
  tanggal: string;
  tanggal_end: string;
  nodokumen: string;
  kode_karyawan: string;
  fcba: string;
  afdeling: string;
  tph: string;
  kemandoran: string;
}>;

type UserLevel =
  | "ADM"
  | "MGR"
  | "KSI"
  | "MD1"
  | "AST"
  | "KRT"
  | "KRA"
  | "KRP"
  | "MDP"
  | "OTHER";

/* =========================
   U T I L S
========================= */
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from "@/utils/imageHelper";
import {
  getTodayISO,
  formatDateDMY,
  formatDateISO,
  getYesterdayISO,
} from "@/utils/datetime";
import { buildMapUrl } from "@/utils/mapHelper";
import { cookieStore } from "@/utils/cookieStore";
import { useLocale } from "@/hooks/useLocale";

const LocationButton: React.FC<{
  loc?: string | null;
  tanggal?: string;
  nodokumen?: string;
}> = ({ loc, tanggal, nodokumen }) => {
  if (!loc) return <span className="text-gray-400">-</span>;
  const googleUrl = buildMapUrl(loc);

  // Geo Sips URL dengan parameter
  const geoSipsUrl = `http://gis.skj.my.id:91?${new URLSearchParams({ dateFrom: formatDateISO(new Date(tanggal || "")) || "", dateTo: formatDateISO(new Date(tanggal || "")) || "", nodokumen: nodokumen || "" }).toString()}`;

  return (
    <div className="flex gap-1">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-xs gap-1"
        title={`Google Maps: ${loc}`}
      >
        <span aria-hidden>📍</span> {"GMaps"}
      </a>
      <a
        href={geoSipsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-xs gap-1 text-info"
        title="Buka di Geo Sips"
      >
        <span aria-hidden>🌐</span> Geo
      </a>
    </div>
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
    const seed = `${navigator.userAgent}|${deviceId}|${screen.width}x${screen.height
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

/* Type guards */
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

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatTotal = (value: number, localeTag = "id-ID"): string =>
  value.toLocaleString(localeTag, { maximumFractionDigits: 2 });

/* =========================
   M A I N
========================= */
export default function HarvestPage() {
  const localeTag = useLocale();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      tanggal: yesterday,
      tanggal_end: today,
      nodokumen: "",
      kode_karyawan: "",
      fcba: "",
      afdeling: "",
      tph: "",
      kemandoran: "",
    };
  });

  const [userLevel, setUserLevel] = useState<UserLevel>("OTHER");
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");
  const [homeGang, setHomeGang] = useState<string>("");
  const [userFcbaCookie, setUserFcbaCookie] = useState<string>("");
  const [userAfdelingCookie, setUserAfdelingCookie] = useState<string>("");

  // Modal states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>("");
  const imgRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);

  // Cascading states for form
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [selFcba, setSelFcba] = useState<string>("");
  const [selSection, setSelSection] = useState<string>("");
  const [selGang, setSelGang] = useState<string>("");

  // Location loading state
  const [locLoading, setLocLoading] = useState<boolean>(false);

  // Check if user can modify (ADM or KSI only)
  const canModify =
    userLevel === "ADM" || userLevel === "KSI";

  // ESC to close modal
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

  /* ===== Bootstrap cookies ===== */
  useEffect(() => {
    setHomeFcba(cookieStore.getFcba());
    setHomeSection(cookieStore.getSection());
    setHomeGang(cookieStore.getGang());
    setUserFcbaCookie(
      cookieStore.getCookie("user_Fcba") ||
      cookieStore.getCookie("user_fcba") ||
      "",
    );
    setUserAfdelingCookie(
      cookieStore.getCookie("user_Afdeling") ||
      cookieStore.getCookie("user_afdeling") ||
      "",
    );

    const levelRaw = cookieStore.getLevel();
    if (
      levelRaw === "ADM" ||
      levelRaw === "MGR" ||
      levelRaw === "KSI" ||
      levelRaw === "MD1" ||
      levelRaw === "AST" ||
      levelRaw === "KRT" ||
      levelRaw === "KRA" ||
      levelRaw === "KRP" ||
      levelRaw === "MDP"
    ) {
      setUserLevel(levelRaw as UserLevel);
    } else {
      setUserLevel("OTHER");
    }

    const ckTrip = cookieStore.getCookie("opt_triplets");
    if (ckTrip) {
      try {
        const arr = JSON.parse(ckTrip) as Triplet[];
        if (Array.isArray(arr) && arr.length) setTriplets(arr);
      } catch {
        // ignore
      }
    }
  }, []);

  /* ===== Apply defaults to filters ===== */
  useEffect(() => {
    // ADM: no defaults, can select any
    // MGR, KSI: can select afdeling, fcba locked to user_Fcba
    // MD1, AST, KRT, KRA: fcba + afdeling locked. KRP, MDP: plus kemandoran.
    if (userLevel === "ADM") {
      // ADM can select any, no defaults
    } else if (userLevel === "MGR" || userLevel === "KSI") {
      setFilters((f) => ({ ...f, fcba: userFcbaCookie || homeFcba }));
    } else if (userLevel === "KRP" || userLevel === "MDP") {
      setFilters((f) => ({
        ...f,
        fcba: userFcbaCookie || homeFcba,
        afdeling: userAfdelingCookie || homeSection,
        kemandoran: homeGang,
      }));
    } else {
      // MD1, AST, KRT, KRA, or OTHER
      setFilters((f) => ({
        ...f,
        fcba: userFcbaCookie || homeFcba,
        afdeling: userAfdelingCookie || homeSection,
      }));
    }
  }, [
    userLevel,
    homeFcba,
    homeSection,
    homeGang,
    userFcbaCookie,
    userAfdelingCookie,
  ]);

  /* ===== Sync selFcba/selSection with user cookies ===== */
  useEffect(() => {
    if (userLevel !== "ADM" && !selFcba) {
      setSelFcba(userFcbaCookie || homeFcba || "");
    }
    if (
      !(userLevel === "ADM" || userLevel === "MGR" || userLevel === "KSI") &&
      !selSection
    ) {
      setSelSection(userAfdelingCookie || homeSection || "");
    }
  }, [
    userLevel,
    homeFcba,
    homeSection,
    selFcba,
    selSection,
    userFcbaCookie,
    userAfdelingCookie,
  ]);

  /* ===== Query for harvest list ===== */
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["harvest", filters, userLevel, homeFcba, homeSection, homeGang],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.tanggal) p.set("tanggal", filters.tanggal);
      if (filters.tanggal_end) p.set("tanggal_end", filters.tanggal_end!);
      if (filters.nodokumen) p.set("nodokumen", filters.nodokumen);
      if (filters.kode_karyawan) p.set("kode_karyawan", filters.kode_karyawan);
      if (filters.fcba) p.set("fcba", filters.fcba);
      if (filters.afdeling) p.set("afdeling", filters.afdeling);
      if (filters.tph) p.set("tph", filters.tph);
      if (filters.kemandoran) p.set("kemandoran", filters.kemandoran);

      const res = await fetch(`/api/harvest?${p.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          await logoutAndRedirect();
          return [];
        }
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }

      const json: unknown = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return [];
      }
      const raw = extractArrayData<Harvest>(json);

      // Remove duplicates and add row keys
      const byId = new Map<string, Harvest>();
      for (const row of raw) {
        if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
      }
      const dataRaw = Array.from(byId.values());

      const seen = new Set<string>();
      return dataRaw.map((it, idx) => {
        const candidate = [
          it.id || "",
          it.nodokumen || "",
          (it.tanggal || "").split(" ")[0],
          String(idx),
        ].join("|");
        let key = candidate;
        while (seen.has(key)) key = `${key}_`;
        seen.add(key);
        return { ...it, _rowKey: key };
      });
    },
    enabled: !!homeFcba || userLevel === "ADM",
  });

  // Show toast on error
  useEffect(() => {
    if (queryError) {
      const msg =
        typeof queryError === "string"
          ? queryError
          : queryError instanceof Error
            ? queryError.message
            : "Terjadi kesalahan saat mengambil data";
      toast.error(msg);
    }
  }, [queryError]);

  /* ===== Parallel data fetching with useQuery ===== */
  // Business units query - runs in parallel
  const { data: businessUnits = [], isLoading: isLoadingBU } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: async () => {
      try {
        const bu = await fetchBusinessUnits();
        localStorage.setItem("business_units", JSON.stringify(bu));
        return bu;
      } catch (err) {
        console.warn("failed to fetch business units:", err);
        const cached = localStorage.getItem("business_units");
        if (cached) {
          try {
            return JSON.parse(cached) as BusinessUnit[];
          } catch {
            return [];
          }
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Employees query - runs in parallel, depends on cookies only
  const { data: employees = [], isLoading: isLoadingEmp } = useQuery({
    queryKey: ["employees", userLevel, homeFcba, homeSection],
    queryFn: async () => {
      let apiUrl = "/api/karyawans";
      const params = new URLSearchParams();

      if (userLevel === "AST") {
        if (homeFcba) params.append("fcba", homeFcba);
        if (homeSection) params.append("sectionname", homeSection);
      } else if (
        userLevel === "ADM" ||
        userLevel === "MGR" ||
        userLevel === "KSI"
      ) {
        // ADM, MGR, KSI get employees by fcba (can select afdeling in UI)
        if (homeFcba) params.append("fcba", homeFcba);
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const r = await fetch(apiUrl, { credentials: "include" });
      const j: unknown = await r.json();
      const rowsRaw = extractArrayData<EmployeesApiRow>(j);

      // Build triplets from employees if no cookie
      const ckTrip = cookieStore.getCookie("opt_triplets");
      if (!ckTrip && rowsRaw.length > 0) {
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

      // Build employees map
      const mapEmp = new Map<string, Employee>();
      for (const it of rowsRaw) {
        const fccode = String(it.fccode ?? "").trim();
        if (!fccode) continue;
        if (!mapEmp.has(fccode)) {
          // Extract noancak from API response
          const noancakValue =
            (it as { noancak?: unknown }).noancak ??
            (it as { NOANCAK?: unknown }).NOANCAK;
          const noancak =
            typeof noancakValue === "string" ? noancakValue.trim() : undefined;

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
      return Array.from(mapEmp.values());
    },
    enabled: !!homeFcba || userLevel === "ADM",
    staleTime: 30 * 60 * 1000, // 30 minutes - for poor network conditions
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  });

  // Query: Field Codes from TPH API (by fcba + afdeling)
  const { data: tphFieldcodeData = [], isLoading: isLoadingFieldcode } =
    useQuery({
      queryKey: ["tph-fieldcodes", selFcba, selSection],
      queryFn: async () => {
        if (!selFcba || !selSection) return [];

        // Get actual fcba name
        let fcbaName = selFcba;
        const buMatch = Array.isArray(businessUnits)
          ? businessUnits.find((b) => b.fccode === selFcba)
          : undefined;
        if (buMatch) fcbaName = buMatch.fcname || selFcba;

        const params = new URLSearchParams();
        params.append("fcba", fcbaName);
        params.append("afdeling", selSection);

        try {
          const res = await fetch(`/api/tph?${params.toString()}`, {
            credentials: "include",
          });
          if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error(`HTTP ${res.status}`);
          }
          const json = await res.json();
          const data = extractArrayData<{
            notph?: string;
            fieldcode?: string;
            ancakno?: string;
            division?: string;
          }>(json);
          return data;
        } catch (err) {
          console.error("Failed to fetch TPH fieldcodes:", err);
          return [];
        }
      },
      enabled: !!selFcba && !!selSection,
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000,
    });

  // Derived: distinct Field Code options from TPH data
  const fieldcodeOptions: Option[] = useMemo(() => {
    if (!tphFieldcodeData.length) return [];
    const set = new Set<string>();
    for (const t of tphFieldcodeData) {
      const fc = String(t.fieldcode ?? "").trim();
      if (fc) set.add(fc);
    }
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [tphFieldcodeData]);

  // Query: TPH data from API (by fcba + afdeling + fieldcode)
  const { data: tphDetailData = [], isLoading: isLoadingTph } = useQuery({
    queryKey: ["tph-detail", selFcba, selSection, form.fieldcode],
    queryFn: async () => {
      if (!selFcba || !selSection || !form.fieldcode) return [];

      // Get actual fcba name
      let fcbaName = selFcba;
      const buMatch = Array.isArray(businessUnits)
        ? businessUnits.find((b) => b.fccode === selFcba)
        : undefined;
      if (buMatch) fcbaName = buMatch.fcname || selFcba;

      const params = new URLSearchParams();
      params.append("fcba", fcbaName);
      params.append("afdeling", selSection);
      params.append("fieldcode", form.fieldcode);

      try {
        const res = await fetch(`/api/tph?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const data = extractArrayData<{
          notph?: string;
          fieldcode?: string;
          ancakno?: string;
          division?: string;
        }>(json);
        return data;
      } catch (err) {
        console.error("Failed to fetch TPH detail:", err);
        return [];
      }
    },
    enabled: !!selFcba && !!selSection && !!form.fieldcode,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Derived: TPH (notph) options based on selected fieldcode
  const tphOptions: Option[] = useMemo(() => {
    if (!tphDetailData.length) return [];
    const set = new Map<string, string>();
    for (const t of tphDetailData) {
      const notph = String(t.notph ?? "").trim();
      if (notph && !set.has(notph)) {
        set.set(notph, notph);
      }
    }
    return Array.from(set, ([value, label]) => ({ value, label })).sort(
      (a, b) => a.label.localeCompare(b.label),
    );
  }, [tphDetailData]);

  // Derived: Ancak options based on selected fieldcode (from detail data)
  /* ===== Prefetch TPH data for poor network conditions ===== */
  const prefetchTphData = useCallback(
    async (fcba: string, section: string, fieldcode?: string) => {
      const buMatch = Array.isArray(businessUnits)
        ? businessUnits.find((b) => b.fccode === fcba)
        : undefined;
      const fcbaName = buMatch ? buMatch.fcname || fcba : fcba;

      if (fieldcode) {
        // Prefetch TPH Detail
        await queryClient.prefetchQuery({
          queryKey: ["tph-detail", fcba, section, fieldcode],
          queryFn: async () => {
            try {
              const params = new URLSearchParams({
                fcba: fcbaName,
                afdeling: section,
                fieldcode: fieldcode,
              });
              const res = await fetch(`/api/tph?${params.toString()}`, {
                credentials: "include",
              });
              if (!res.ok) return [];
              const json = await res.json();
              return extractArrayData<{
                notph?: string;
                fieldcode?: string;
                ancakno?: string;
                division?: string;
              }>(json);
            } catch {
              return [];
            }
          },
          staleTime: 30 * 60 * 1000,
        });
      } else {
        // Prefetch Field Codes
        await queryClient.prefetchQuery({
          queryKey: ["tph-fieldcodes", fcba, section],
          queryFn: async () => {
            try {
              const params = new URLSearchParams({
                fcba: fcbaName,
                afdeling: section,
              });
              const res = await fetch(`/api/tph?${params.toString()}`, {
                credentials: "include",
              });
              if (!res.ok) return [];
              const json = await res.json();
              return extractArrayData<{
                notph?: string;
                fieldcode?: string;
                ancakno?: string;
                division?: string;
              }>(json);
            } catch {
              return [];
            }
          },
          staleTime: 30 * 60 * 1000,
        });
      }
    },
    [businessUnits, queryClient],
  );

  useEffect(() => {
    // Prefetch Field Codes saat FCBA & Afdeling sudah terpilih
    if (selFcba && selSection) {
      prefetchTphData(selFcba, selSection);
    }
  }, [selFcba, selSection, prefetchTphData]);

  useEffect(() => {
    // Prefetch TPH Detail saat Field Code terpilih
    if (selFcba && selSection && form.fieldcode) {
      prefetchTphData(selFcba, selSection, form.fieldcode);
    }
  }, [selFcba, selSection, form.fieldcode, prefetchTphData]);

  /* ===== Location handler ===== */
  const handleGetLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error(
        "Browser tidak mendukung GPS / geolocation. Isi manual saja.",
      );
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const value = `${latitude},${longitude}`;
        setForm((s) => ({ ...s, location: value }));
        setLocLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser."
            : "Gagal mengambil lokasi. Coba lagi.",
        );
        setLocLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  /* ===== Mutations ===== */
  const mutation = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: string;
      body: FormData;
    }) => {
      const res = await fetch(url, {
        method,
        body,
        credentials: "include",
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        throw new Error("Unauthorized");
      }
      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error("Unauthorized");
      }
      if (!res.ok || !json.ok) {
        const errorMsg =
          typeof json.message === "string"
            ? json.message
            : typeof json.error === "string"
              ? json.error
              : "Operation failed";
        throw new Error(errorMsg);
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest"] });
      setOpen(false);
      setForm(initialForm);
      setPreview("");
      if (imgRef.current) imgRef.current.value = "";
      if (pdfRef.current) pdfRef.current.value = "";
      toast.success(
        isEditing ? "Data berhasil diupdate" : "Data berhasil ditambahkan",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/harvest/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        await logoutAndRedirect();
        throw new Error("Unauthorized");
      }
      const json: Record<string, unknown> = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        throw new Error("Unauthorized");
      }
      if (!res.ok || !json.ok) {
        const errorMsg =
          typeof json.error === "string" ? json.error : "Gagal hapus";
        throw new Error(errorMsg);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest"] });
      toast.success("Data berhasil dihapus 🗑️");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  /* ===== Fetch detail for edit ===== */
  const fetchDetail = useCallback(
    async (id: string) => {
      setIsEditing(true);
      setDetailLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/harvest/${id}`, {
          credentials: "include",
        });
        if (res.status === 401) {
          await logoutAndRedirect();
          return;
        }
        const json = await res.json();
        if (isUnauthenticatedJson(json)) {
          await logoutAndRedirect();
          return;
        }
        const data = extractSingleData<Harvest>(json);
        if (!res.ok || !data) throw new Error("Gagal ambil data");

        setForm({
          id: data.id,
          nodokumen: data.nodokumen || "",
          tanggal: data.tanggal ? data.tanggal.split(" ")[0] : "",
          kode_karyawan_mandor1: data.kode_karyawan_mandor1 || "",
          kode_karyawan_mandor_panen: data.kode_karyawan_mandor_panen || "",
          kode_karyawan_kerani: data.kode_karyawan_kerani || "",
          kode_karyawan: data.kode_karyawan || "",
          noancak: data.noancak || "",
          tph: data.tph || "",
          fieldcode: data.fieldcode || "",
          fcba: data.fcba || "",
          afdeling: data.afdeling || "",
          output: data.output || "",
          mentah: data.mentah || "0",
          overripe: data.overripe || "0",
          busuk: data.busuk || "0",
          busuk2: data.busuk2 || "0",
          buahkecil: data.buahkecil || "0",
          brondol: data.brondol || "0",
          alasbrondol: data.alasbrondol || "",
          tangkaipanjang: data.tangkaipanjang || "0",
          parteno: data.parteno || "0",
          parteno50plus: data.parteno50plus || "0",
          status_assistensi: data.status_assistensi || "",
          status_harvesting: data.status_harvesting || "Planned",
          kemandoran: data.kemandoran || "",
          exception_case: data.exception_case || "",
          location: data.location || "",
          id_device:
            data.id_device ||
            `${getReadableDevice()} • ${getOrCreateDeviceIds().deviceId}`,
          card_id: data.card_id || "",
          images: null,
          no_ba_exca: data.no_ba_exca || null,
        });
        setPreview(data.images ? getProxiedImageUrl(data.images) : "");
        setSelFcba(data.fcba || homeFcba || "");
        setSelSection(data.afdeling || homeSection || "");
        setSelGang(data.kemandoran || "");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memuat detail";
        toast.error(msg);
        setOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [homeFcba, homeSection],
  );

  /* ===== Computed options for cascading selects ===== */
  const fcbaOptions = useMemo(() => {
    if (businessUnits && businessUnits.length) {
      return businessUnits
        .map((b) => ({
          value: b.fccode,
          label: b.fcname ? `${b.fccode} - ${b.fcname}` : b.fccode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return Array.from(new Set(triplets.map((t) => t.fcba).filter(Boolean)))
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [triplets, businessUnits]);

  const sectionOptions: Option[] = useMemo(() => {
    if (!selFcba) return [];
    return Array.from(
      new Set(
        triplets
          .filter((t) => {
            if (t.fcba === selFcba) return true;
            const buMatch = Array.isArray(businessUnits)
              ? businessUnits.find((b) => b.fccode === selFcba)
              : undefined;
            if (buMatch && t.fcba === buMatch.fcname) return true;
            return false;
          })
          .map((t) => t.sectionname)
          .filter(Boolean),
      ),
    )
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [triplets, selFcba, businessUnits]);

  // Kemandoran: only gangs starting with MD
  const kemandoranOptions: Option[] = useMemo(() => {
    if (!selFcba || !selSection) return [];
    let fcbaName = selFcba;
    const buMatch = Array.isArray(businessUnits)
      ? businessUnits.find((b) => b.fccode === selFcba)
      : undefined;
    if (buMatch) fcbaName = buMatch.fcname || selFcba;

    // Kemandoran = gangcode from employees matching fcba and section, only MD prefix
    const pool = employees.filter(
      (e) =>
        (e.fcba || "") === fcbaName &&
        (e.sectionname || "") === selSection &&
        (e.gangcode || "").toUpperCase().startsWith("MD"),
    );
    const set = new Set<string>();
    for (const e of pool) {
      const raw = (e.gangcode || "").trim();
      if (raw) set.add(raw);
    }
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [employees, selFcba, selSection, businessUnits]);

  // Query: Employees by fcba + afdeling + kemandoran (with MD->PN transformation for API)
  const { data: employeesByGang = [], isLoading: isLoadingEmpByGang } =
    useQuery({
      queryKey: ["employees-by-gang", selFcba, selSection, selGang],
      queryFn: async () => {
        if (!selFcba || !selSection || !selGang) return [];

        // Get actual fcba name
        let fcbaName = selFcba;
        const buMatch = Array.isArray(businessUnits)
          ? businessUnits.find((b) => b.fccode === selFcba)
          : undefined;
        if (buMatch) fcbaName = buMatch.fcname || selFcba;

        // Transform MDxxx to PNxxx for API parameter
        const gangForApi = selGang.toUpperCase().startsWith("MD")
          ? "PN" + selGang.substring(2)
          : selGang;

        const params = new URLSearchParams();
        params.append("fcba", fcbaName);
        params.append("sectionname", selSection);
        params.append("gangcode", gangForApi);

        try {
          const res = await fetch(`/api/karyawans?${params.toString()}`, {
            credentials: "include",
          });
          if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error(`HTTP ${res.status}`);
          }
          const json = await res.json();
          const rowsRaw = extractArrayData<EmployeesApiRow>(json);

          // Build employees map with noancak
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
          return Array.from(mapEmp.values());
        } catch (err) {
          console.error("Failed to fetch employees by gang:", err);
          return [];
        }
      },
      enabled: !!selFcba && !!selSection && !!selGang,
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000,
    });

  // Employee options from employeesByGang query
  const employeeOptions: Option[] = useMemo(() => {
    if (!employeesByGang.length) return [];
    return employeesByGang
      .map((e) => ({
        value: e.fccode,
        label: e.fullname ? `${e.fccode} - ${e.fullname}` : e.fccode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeesByGang]);

  /* ===== Cascading change handlers ===== */
  const onChangeFcba = (v: string) => {
    setSelFcba(v);
    setSelSection("");
    setSelGang("");
    setForm((s) => ({
      ...s,
      fcba: v,
      afdeling: "",
      fieldcode: "", // fieldcode dari TPH, reset saat FCBA berubah
      kemandoran: "",
      noancak: "",
      kode_karyawan: "",
      tph: "",
    }));
  };

  const onChangeSection = (v: string) => {
    setSelSection(v);
    setSelGang("");
    // fieldcode tidak direset saat section berubah (karena dari TPH API)
    setForm((s) => ({
      ...s,
      afdeling: v,
      kemandoran: "",
      kode_karyawan: "",
    }));
  };

  const onChangeFieldcode = (v: string) => {
    setForm((s) => ({
      ...s,
      fieldcode: v,
      noancak: "", // reset noancak dan tph saat fieldcode berubah
      tph: "",
    }));
  };

  const onChangeGang = (v: string) => {
    setSelGang(v);
    setForm((s) => ({
      ...s,
      kemandoran: v,
      kode_karyawan: "",
    }));
  };

  const onChangeEmployee = (fccode: string) => {
    const emp = employeesByGang.find((e) => e.fccode === fccode);
    setForm((s) => ({
      ...s,
      kode_karyawan: fccode,
      noancak: emp?.noancak || "", // No Ancak from selected employee
    }));
  };

  /* ===== Device IDs ===== */
  useEffect(() => {
    const { deviceId } = getOrCreateDeviceIds();
    setForm((s) => ({
      ...s,
      id_device: s.id_device || `${getReadableDevice()} • ${deviceId}`,
    }));
  }, []);

  /* ===== Form handlers ===== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    if (!canModify) {
      toast.error("Anda tidak memiliki akses untuk melakukan perubahan");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "images" && value instanceof File) {
        formData.append(key, value);
      } else if (key === "no_ba_exca" && value instanceof File) {
        formData.append(key, value);
      } else if (
        key === "no_ba_exca" &&
        isEditing &&
        typeof value === "string"
      ) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const url =
      isEditing && form.id ? `/api/harvest/${form.id}` : "/api/harvest";
    const method = isEditing && form.id ? "PUT" : "POST";

    mutation.mutate({ url, method, body: formData });
  };

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Yakin ingin menghapus data ini?")) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  /* ===== Quick search ===== */
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
          it.kemandoran,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s)),
      );
    }
    return res;
  }, [q, items]);

  const harvestTotals = useMemo(
    () =>
      filtered.reduce(
        (acc, row) => ({
          output: acc.output + toNumber(row.output),
          mentah: acc.mentah + toNumber(row.mentah),
          overripe: acc.overripe + toNumber(row.overripe),
          busuk: acc.busuk + toNumber(row.busuk),
          brondol: acc.brondol + toNumber(row.brondol),
        }),
        {
          output: 0,
          mentah: 0,
          overripe: 0,
          busuk: 0,
          brondol: 0,
        },
      ),
    [filtered],
  );

  const totalCards = [
    {
      label: "Total Janjang",
      value: harvestTotals.output,
      className: "text-primary",
    },
    {
      label: "Total Brondolan",
      value: harvestTotals.brondol,
      className: "text-success",
    },
  ];

  /* ===== EXPORT EXCEL ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      No: idx + 1,
      "No Dokumen": r.nodokumen || "-",
      Tanggal: (r.tanggal || "").split(" ")[0],
      "Kode Karyawan": r.kode_karyawan || "-",
      "Nama Karyawan": r.nama_karyawan || "-",
      Kemandoran: r.kemandoran || "-",
      FCBA: r.fcba || "-",
      Afdeling: r.afdeling || "-",
      TPH: r.tph || "-",
      "Field Code": r.fieldcode || "-",
      Output: r.output || "0",
      Mentah: r.mentah || "0",
      Overripe: r.overripe || "0",
      Busuk: r.busuk || "0",
      Busuk2: r.busuk2 || "0",
      "Buah Kecil": r.buahkecil || "0",
      Brondol: r.brondol || "0",
      "Alas Brondol": r.alasbrondol || "0",
      "Tangkai Panjang": r.tangkaipanjang || "0",
      Parteno: r.parteno || "0",
      "Parteno 50+": r.parteno50plus || "0",
      Status: r.status_harvesting || "-",
      Lokasi: r.location || "-",
    }));

    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Harvesting");
    xlsx.writeFile(
      wb,
      `Harvesting_${filters.tanggal || "all"}_${filters.tanggal_end || "all"}.xlsx`,
    );
  };

  /* ===== Columns ===== */
  const columns: TableColumn<Harvest>[] = [
    {
      name: <span title="Aksi edit/hapus data panen">Aksi</span>,
      width: "120px",
      cell: (row: Harvest) => {
        const status = (row.status_harvesting || "").toLowerCase();
        const isPlanned = status === "planned";
        const canEditRole = canModify;
        const canEdit = canEditRole && isPlanned;
        const canDelete =
          userLevel === "ADM" && status !== "approved" && status !== "";

        return (
          <div className="space-x-1 whitespace-nowrap overflow-visible">
            {canEditRole && (
              <button
                className={`btn btn-xs ${canEdit ? "btn-outline" : "btn-disabled"
                  }`}
                onClick={() => canEdit && fetchDetail(row.id)}
                disabled={!canEdit}
                title={canEdit ? "Edit" : "Hanya bisa edit saat Planned"}
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
        <span title="Status persetujuan panen (Planned/Approved/dll)">
          Status
        </span>
      ),
      selector: (r) => r.status_harvesting ?? "-",
      sortable: true,
      width: "120px",
      cell: (r) => (
        <span
          className={`badge ${(r.status_harvesting || "").toLowerCase() === "planned"
            ? "badge-warning"
            : (r.status_harvesting || "").toLowerCase() === "approved"
              ? "badge-success"
              : "badge-ghost"
            }`}
        >
          {r.status_harvesting ?? "-"}
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
      name: "No Dokumen",
      selector: (row) => row.nodokumen,
      sortable: true,
      width: "250px",
    },
    {
      name: "Tanggal",
      selector: (row) => row.tanggal,
      format: (row) => formatDateDMY(row.tanggal),
      sortable: true,
      width: "100px",
    },
    {
      name: "Karyawan",
      selector: (row) => row.nama_karyawan || row.kode_karyawan,
      sortable: true,
      width: "180px",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.nama_karyawan}</div>
          <div className="text-xs text-gray-500">{row.kode_karyawan}</div>
        </div>
      ),
    },
    {
      name: "Kemandoran",
      selector: (row) => row.kemandoran || "-",
      sortable: true,
      width: "120px",
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
      width: "80px",
    },
    {
      name: "Field",
      selector: (row) => row.fieldcode,
      sortable: true,
      width: "80px",
    },
    {
      name: "Output",
      selector: (row) => row.output,
      sortable: true,
      width: "90px",
      style: { justifyContent: "end" },
    },
    {
      name: "Mentah",
      selector: (row) => row.mentah,
      sortable: true,
      width: "90px",
      style: { justifyContent: "end" },
    },
    {
      name: "Over",
      selector: (row) => row.overripe,
      sortable: true,
      width: "90px",
      style: { justifyContent: "end" },
    },
    {
      name: "Busuk",
      selector: (row) => row.busuk,
      sortable: true,
      width: "90px",
      style: { justifyContent: "end" },
    },
    {
      name: "Brondol",
      selector: (row) => row.brondol,
      sortable: true,
      width: "90px",
      style: { justifyContent: "end" },
    },
    {
      name: (
        <span title="Lokasi panen" className="text-center">
          Lokasi
        </span>
      ),
      selector: (row) => row.location || "",
      width: "140px",
      cell: (row) => (
        <LocationButton
          loc={row.location}
          tanggal={row.tanggal}
          nodokumen={row.nodokumen}
        />
      ),
    },
    {
      name: (
        <span title="Exception Case (alasan/keterangan khusus)">
          Exception Case
        </span>
      ),
      selector: (row) => row.exception_case || "-",
      sortable: true,
      style: { flexGrow: 1.1 as number, minWidth: "160px" },
    },
    {
      name: <span title="Lampiran BA EXCA atau file pendukung">Lampiran</span>,
      selector: (row) => row.no_ba_exca || "-",
      sortable: true,
      width: "120px",
      cell: (row) =>
        row.no_ba_exca ? (
          <a
            href={row.no_ba_exca}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
            title="Buka lampiran"
          >
            PDF
          </a>
        ) : (
          "-"
        ),
    },
    {
      name: <span title="Foto pendukung panen (bila ada)">Foto</span>,
      width: "90px",
      cell: (r: Harvest) =>
        r.images ? (
          <a
            href={getProxiedImageUrl(r.images)}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka foto"
          >
            <div className="relative w-10 h-10 rounded-lg ring-1 ring-base-300 bg-base-200 overflow-hidden">
              <Image
                src={getProxiedImageUrl(r.images)}
                alt="foto"
                fill
                className="object-cover"
                loading="lazy"
                onError={(e) => {
                  const img = e?.currentTarget as HTMLImageElement | null;
                  if (img) {
                    img.onerror = null;
                    img.src = PLACEHOLDER_IMAGE;
                  }
                }}
                unoptimized
              />
            </div>
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
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman pengelolaan Harvesting (Panen)"
          >
            Harvesting (Panen)
          </h1>
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap w-full">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters((s) => !s)}
            >
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
            <button
              className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["harvest"] })
              }
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Memuat...
                </>
              ) : (
                "Refresh"
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExport}
              title="Ekspor data yang difilter ke Excel"
            >
              📤 Export
            </button>
            {canModify && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsEditing(false);
                  // Initialize form with today's date and user cookies
                  setForm({
                    ...initialForm,
                    tanggal: getTodayISO(),
                    fcba:
                      userLevel === "ADM"
                        ? ""
                        : userFcbaCookie || homeFcba || "",
                    afdeling:
                      userLevel === "ADM" ||
                        userLevel === "KSI"
                        ? ""
                        : userAfdelingCookie || homeSection || "",
                  });
                  setPreview("");
                  // Initialize cascading selects with user cookies
                  setSelFcba(
                    userLevel === "ADM" ? "" : userFcbaCookie || homeFcba || "",
                  );
                  setSelSection(
                    userLevel === "ADM" ||
                      userLevel === "KSI"
                      ? ""
                      : userAfdelingCookie || homeSection || "",
                  );
                  setSelGang("");
                  setOpen(true);
                  // Auto get location
                  setTimeout(() => {
                    handleGetLocation();
                  }, 0);
                }}
              >
                + Tambah Panen
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          {/* TOTAL CARDS (di kiri) */}
          <div className="flex gap-2">
            {totalCards.map((card) => (
              <div
                key={card.label}
                className="bg-base-100 border border-base-200 rounded-lg px-3 py-2 shadow-sm whitespace-nowrap"
              >
                <div className="text-[10px] opacity-70 leading-none">
                  {card.label}
                </div>
                <div className={`text-sm font-semibold ${card.className}`}>
                  {formatTotal(card.value)}
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH (dorong ke kanan) */}
          <div className="ml-auto w-full md:w-96">
            <input
              className="input input-bordered w-full"
              placeholder="Cari No Dokumen, Karyawan, FCBA, TPH..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal: e.target.value }))
                }
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.tanggal_end}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tanggal_end: e.target.value }))
                }
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
                placeholder="Kemandoran"
                value={filters.kemandoran}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, kemandoran: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba}
                disabled={userLevel !== "ADM"}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fcba: e.target.value }))
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling}
                disabled={
                  !(
                    userLevel === "ADM" ||
                    userLevel === "MGR" ||
                    userLevel === "KSI"
                  )
                }
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
                className={`btn btn-outline ${loading ? "btn-disabled" : ""}`}
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["harvest"] })
                }
                disabled={loading}
                title="Terapkan filter"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Memuat...
                  </>
                ) : (
                  "Terapkan Filter"
                )}
              </button>
              <button
                className={`btn ${loading ? "btn-disabled" : ""}`}
                onClick={() => {
                  const resetFilters: Filters = {
                    tanggal: "",
                    tanggal_end: "",
                    nodokumen: "",
                    kode_karyawan: "",
                    kemandoran: "",
                    fcba: "",
                    afdeling: "",
                    tph: "",
                  };
                  setFilters(resetFilters);
                }}
                disabled={loading}
                title="Reset semua filter"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Memuat...
                  </>
                ) : (
                  "Reset"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-base-200 shadow-sm overflow-x-auto bg-base-100">
          <div className="min-w-[900px]">
            {loading ? (
              <SkeletonTable rows={10} />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                pagination
                customStyles={centerHeaderStyle}
                paginationPerPage={100}
                paginationRowsPerPageOptions={[10, 30, 100, 500]}
                highlightOnHover
                pointerOnHover
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
      </div>

      {/* Modal Form */}
      {open && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">
                {isEditing ? "Edit Data Panen" : "Tambah Data Panen"}
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => {
                  setOpen(false);
                  setPreview("");
                }}
                aria-label="Tutup"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Memuat detail...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* No Dokumen */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">No Dokumen *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.nodokumen}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, nodokumen: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* Tanggal */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Tanggal *</legend>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={form.tanggal}
                      max={getTodayISO()}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, tanggal: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* FCBA: ADM bisa pilih, lainnya dikunci ke user_Fcba cookie */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      {userLevel === "ADM" ? "FCBA *" : "FCBA (akun)"}
                    </legend>
                    {userLevel === "ADM" ? (
                      <SearchSelect
                        options={fcbaOptions}
                        value={selFcba}
                        onChange={onChangeFcba}
                        placeholder={
                          isLoadingBU ? "Memuat FCBA..." : "Pilih FCBA"
                        }
                        disabled={isLoadingBU}
                      />
                    ) : (
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={userFcbaCookie || homeFcba || ""}
                        readOnly
                        disabled
                      />
                    )}
                  </fieldset>

                  {/* Afdeling: ADM/MGR/KSI bisa pilih, lainnya dikunci ke user_Afdeling cookie */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      {userLevel === "ADM" ||
                        userLevel === "MGR" ||
                        userLevel === "KSI"
                        ? "Afdeling (Section) *"
                        : "Afdeling (akun)"}
                    </legend>
                    {userLevel === "ADM" ||
                      userLevel === "MGR" ||
                      userLevel === "KSI" ? (
                      <SearchSelect
                        options={sectionOptions}
                        value={selSection ?? ""}
                        onChange={onChangeSection}
                        placeholder={
                          isLoadingEmp
                            ? "Memuat..."
                            : selFcba
                              ? "Pilih Afdeling"
                              : "Pilih FCBA dulu"
                        }
                        disabled={!selFcba || isLoadingEmp}
                      />
                    ) : (
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={userAfdelingCookie || homeSection || ""}
                        readOnly
                        disabled
                      />
                    )}
                  </fieldset>

                  {/* Field Code - dari API TPH (fcba + afdeling) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Field Code *</legend>
                    {isLoadingFieldcode ? (
                      <div className="skeleton h-10 w-full rounded-md animate-pulse bg-base-300" />
                    ) : (
                      <SearchSelect
                        options={fieldcodeOptions}
                        value={form.fieldcode ?? ""}
                        onChange={onChangeFieldcode}
                        placeholder={
                          selFcba && selSection
                            ? fieldcodeOptions.length === 0
                              ? "Tidak ada Field Code"
                              : "Pilih Field Code"
                            : "Pilih FCBA dan Afdeling dulu"
                        }
                        disabled={!selFcba || !selSection}
                      />
                    )}
                  </fieldset>

                  {/* TPH - dari TPH API (fcba + afdeling + fieldcode) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">TPH *</legend>
                    {isLoadingTph ? (
                      <div className="skeleton h-10 w-full rounded-md animate-pulse bg-base-300" />
                    ) : (
                      <SearchSelect
                        options={tphOptions}
                        value={form.tph ?? ""}
                        onChange={(v) => setForm((s) => ({ ...s, tph: v }))}
                        placeholder={
                          form.fieldcode
                            ? tphOptions.length === 0
                              ? "Tidak ada TPH"
                              : "Pilih TPH"
                            : "Pilih Field Code dulu"
                        }
                        disabled={!form.fieldcode}
                      />
                    )}
                  </fieldset>

                  {/* Kemandoran - hanya gang dengan prefix MD */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Kemandoran</legend>
                    <SearchSelect
                      options={kemandoranOptions}
                      value={form.kemandoran ?? ""}
                      onChange={onChangeGang}
                      placeholder={
                        isLoadingEmp
                          ? "Memuat..."
                          : selSection
                            ? kemandoranOptions.length === 0
                              ? "Tidak ada Kemandoran MD"
                              : "Pilih Kemandoran"
                            : "Pilih Afdeling dulu"
                      }
                      disabled={!selSection || isLoadingEmp}
                    />
                  </fieldset>

                  {/* Kode Karyawan - dari API dengan fcba+afdeling+kemandoran (MD->PN) */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Karyawan *</legend>
                    <SearchSelect
                      options={employeeOptions}
                      value={form.kode_karyawan ?? ""}
                      onChange={onChangeEmployee}
                      placeholder={
                        isLoadingEmpByGang
                          ? "Memuat Karyawan..."
                          : selGang
                            ? employeeOptions.length === 0
                              ? "Tidak ada Karyawan"
                              : "Pilih Karyawan"
                            : "Pilih Kemandoran dulu"
                      }
                      disabled={!selGang || isLoadingEmpByGang}
                    />
                  </fieldset>

                  {/* No Ancak - otomatis dari Karyawan yang dipilih */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">No Ancak</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.noancak ?? ""}
                      readOnly
                      disabled
                      placeholder="Otomatis dari Karyawan"
                    />
                  </fieldset>
                </div>

                <div className="divider">Output Data</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Output */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Output</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.output}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, output: e.target.value }))
                      }
                      required
                      min="0"
                    />
                  </div>

                  {/* Mentah */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Mentah</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.mentah}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, mentah: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Overripe */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Overripe</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.overripe}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, overripe: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Busuk */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Busuk</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.busuk}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, busuk: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Busuk 2 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Busuk 2</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.busuk2}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, busuk2: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Buah Kecil */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Buah Kecil</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.buahkecil}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, buahkecil: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Brondol */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Brondol</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.brondol}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, brondol: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Tangkai Panjang */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Tangkai Panjang</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.tangkaipanjang}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          tangkaipanjang: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Parteno */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Parteno</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.parteno}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, parteno: e.target.value }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Parteno 50+ */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Parteno 50+</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={form.parteno50plus}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          parteno50plus: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  {/* Alas Brondol */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Alas Brondol</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={form.alasbrondol}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, alasbrondol: e.target.value }))
                      }
                    >
                      <option value="">- Pilih -</option>
                      <option value="Y">Ya (Y)</option>
                      <option value="N">Tidak (N)</option>
                    </select>
                  </div>
                </div>

                <div className="divider">Informasi Tambahan</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lokasi */}
                  <fieldset className="fieldset md:col-span-2">
                    <legend className="fieldset-legend">
                      Lokasi (lat,lng) *
                    </legend>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={form.location}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, location: e.target.value }))
                        }
                        placeholder="contoh: -2.2893371,118.0399877"
                        required
                      />

                      <button
                        type="button"
                        className={`btn btn-square ${locLoading ? "btn-disabled" : ""}`}
                        onClick={handleGetLocation}
                        disabled={locLoading}
                      >
                        {locLoading ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          "📍"
                        )}
                      </button>
                    </div>

                    {form.location && (
                      <div className="mt-1">
                        <a
                          className="link link-primary text-sm"
                          href={buildMapUrl(form.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                  </fieldset>

                  {/* Exception Case + File PDF dalam 1 row */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Exception Case {!isEditing ? "*" : ""}
                    </legend>

                    <textarea
                      className="textarea textarea-bordered min-h-24 w-full"
                      value={form.exception_case}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          exception_case: e.target.value,
                        }))
                      }
                      required={!isEditing}
                      rows={3}
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      File BA ExCa (PDF)
                    </legend>

                    <input
                      type="file"
                      ref={pdfRef}
                      accept=".pdf"
                      className="file-input file-input-bordered w-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setForm((s) => ({ ...s, no_ba_exca: file }));
                      }}
                    />
                  </fieldset>

                  {/* FOTO FULL WIDTH */}
                  <fieldset className="fieldset md:col-span-2">
                    <legend className="fieldset-legend">Foto</legend>

                    <input
                      type="file"
                      ref={imgRef}
                      accept="image/*"
                      className="file-input file-input-bordered w-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;

                        setForm((s) => ({ ...s, images: file }));

                        if (file) {
                          const url = URL.createObjectURL(file);
                          setPreview(url);
                        }
                      }}
                    />

                    {/* Preview Full Width */}
                    {preview && (
                      <div className="mt-3 relative w-full h-80 rounded-xl overflow-hidden border">
                        <Image
                          src={preview}
                          alt="Preview"
                          fill
                          className="object-contain bg-base-200"
                          sizes="100vw"
                        />
                      </div>
                    )}
                  </fieldset>
                </div>

                {/* Actions */}
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setOpen(false);
                      setPreview("");
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setOpen(false);
              setPreview("");
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
