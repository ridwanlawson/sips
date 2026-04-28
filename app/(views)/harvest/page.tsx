"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import Image from "next/image";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonTable } from "@/app/components/skeletons";
import * as XLSX from "xlsx";

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
  no_ba_exca: File | null;
};

const initialForm: FormState = {
  nodokumen: "",
  tanggal: "",
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

type UserLevel = "ADM" | "MGR" | "AST" | "OTHER";

/* =========================
   U T I L S
========================= */
import { logoutAndRedirect } from "@/utils/authHelper";
import { getProxiedImageUrl, PLACEHOLDER_IMAGE } from "@/utils/imageHelper";
import { getTodayISO, formatDateDMY, formatDateISO } from "@/utils/datetime";
import { buildMapUrl } from "@/utils/mapHelper";
import { cookieStore } from "@/utils/cookieStore";

const LocationButton: React.FC<{ loc?: string | null; tanggal?: string; nodokumen?: string }> = ({
  loc,
  tanggal,
  nodokumen,
}) => {
  if (!loc) return <span className="text-gray-400">-</span>;
  const googleUrl = buildMapUrl(loc);
  const label = loc.length > 20 ? loc.slice(0, 20) + "…" : loc;

  // Geo Sips URL dengan parameter
  const geoSipsUrl = `http://172.16.5.199:91?${new URLSearchParams({ dateFrom: formatDateISO(new Date(tanggal || "")) || "", dateTo: formatDateISO(new Date(tanggal || "")) || "", nodokumen: nodokumen || "" }).toString()}`;

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

/* =========================
   M A I N
========================= */
export default function HarvestPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
      kemandoran: "",
    };
  });

  const [userLevel, setUserLevel] = useState<UserLevel>("OTHER");
  const [homeFcba, setHomeFcba] = useState<string>("");
  const [homeSection, setHomeSection] = useState<string>("");

  // Modal states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>("");
  const imgRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);

  // Check if user can modify (ADM or MGR only)
  const canModify = userLevel === "ADM" || userLevel === "MGR";

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

    const levelRaw = cookieStore.getLevel();
    if (levelRaw === "ADM" || levelRaw === "MGR" || levelRaw === "AST") {
      setUserLevel(levelRaw);
    } else {
      setUserLevel("OTHER");
    }
  }, []);

  /* ===== Apply defaults to filters ===== */
  useEffect(() => {
    if (userLevel === "MGR") {
      setFilters((f) => ({ ...f, fcba: homeFcba }));
    } else if (userLevel === "AST") {
      setFilters((f) => ({ ...f, fcba: homeFcba, afdeling: homeSection }));
    }
  }, [userLevel, homeFcba, homeSection]);

  /* ===== Query for harvest list ===== */
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["harvest", filters, userLevel, homeFcba, homeSection],
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
  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/harvest/${id}`, { credentials: "include" });
      if (res.status === 401) {
        await logoutAndRedirect();
        return;
      }
      if (!res.ok) throw new Error("Gagal mengambil detail");
      const json = await res.json();
      const data = extractSingleData<Harvest>(json);
      if (data) {
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
          id_device: data.id_device || "",
          card_id: data.card_id || "",
          images: null,
          no_ba_exca: null,
        });
        if (data.images) {
          setPreview(getProxiedImageUrl(data.images));
        }
        setIsEditing(true);
        setOpen(true);
      }
    } catch (e) {
      toast.error("Gagal mengambil detail data");
    } finally {
      setDetailLoading(false);
    }
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
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const url =
      isEditing && form.id ? `/api/harvest/${form.id}` : "/api/harvest";
    const method = isEditing && form.id ? "PUT" : "POST";

    mutation.mutate({ url, method, body: formData });
  };

  const handleDelete = (id: string) => {
    if (!canModify) {
      toast.error("Anda tidak memiliki akses untuk menghapus data");
      return;
    }
    if (confirm("Yakin ingin menghapus data ini?")) {
      deleteMutation.mutate(id);
    }
  };

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

  /* ===== EXPORT EXCEL ===== */
  const handleExport = () => {
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

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Harvesting");
    XLSX.writeFile(
      wb,
      `Harvesting_${filters.tanggal || "all"}_${filters.tanggal_end || "all"}.xlsx`,
    );
  };

  /* ===== Columns ===== */
  const columns: TableColumn<Harvest>[] = [
    ...(canModify
      ? [
        {
          name: <span title="Aksi edit/hapus data panen">Aksi</span>,
          width: "120px",
          cell: (row: Harvest) => (
            <div className="space-x-1 whitespace-nowrap overflow-visible">
              <button
                className="btn btn-xs btn-outline"
                onClick={() => fetchDetail(row.id)}
                title="Edit"
              >
                Edit
              </button>
              <button
                className="btn btn-xs btn-error"
                onClick={() => handleDelete(row.id)}
                title="Hapus"
              >
                Hapus
              </button>
            </div>
          ),
          ignoreRowClick: true,
        },
      ]
      : []),
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
      width: "70px",
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
      width: "70px",
      style: { justifyContent: "end" },
    },
    {
      name: "Mentah",
      selector: (row) => row.mentah,
      sortable: true,
      width: "70px",
      style: { justifyContent: "end" },
    },
    {
      name: "Over",
      selector: (row) => row.overripe,
      sortable: true,
      width: "60px",
      style: { justifyContent: "end" },
    },
    {
      name: "Busuk",
      selector: (row) => row.busuk,
      sortable: true,
      width: "60px",
      style: { justifyContent: "end" },
    },
    {
      name: "Brondol",
      selector: (row) => row.brondol,
      sortable: true,
      width: "70px",
      style: { justifyContent: "end" },
    },
    {
      name: "Lokasi",
      selector: (row) => row.location || "",
      width: "140px",
      cell: (row) => <LocationButton loc={row.location} tanggal={row.tanggal} nodokumen={row.nodokumen} />,
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
                  setForm(initialForm);
                  setPreview("");
                  setOpen(true);
                }}
              >
                + Tambah Panen
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="Cari No Dokumen, Karyawan, FCBA, TPH..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            title="Pencarian cepat di semua kolom penting"
          />
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
                paginationPerPage={10}
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
            <h3 className="font-bold text-lg mb-4">
              {isEditing ? "Edit Data Panen" : "Tambah Data Panen"}
            </h3>

            {detailLoading ? (
              <div className="py-8 text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Memuat detail...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      onChange={(e) =>
                        setForm((s) => ({ ...s, tanggal: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* Kode Karyawan */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Kode Karyawan *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.kode_karyawan}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          kode_karyawan: e.target.value,
                        }))
                      }
                      required
                    />
                  </fieldset>

                  {/* FCBA */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">FCBA *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.fcba}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, fcba: e.target.value }))
                      }
                      required
                      disabled={userLevel !== "ADM"}
                    />
                  </fieldset>

                  {/* Afdeling */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Afdeling *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.afdeling}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, afdeling: e.target.value }))
                      }
                      required
                      disabled={userLevel === "AST"}
                    />
                  </fieldset>

                  {/* No Ancak */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">No Ancak *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.noancak}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, noancak: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* TPH */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">TPH *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.tph}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, tph: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* Field Code */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Field Code *</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.fieldcode}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, fieldcode: e.target.value }))
                      }
                      required
                    />
                  </fieldset>

                  {/* Kemandoran */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Kemandoran</legend>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={form.kemandoran}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, kemandoran: e.target.value }))
                      }
                    />
                  </fieldset>
                </div>

                <div className="divider">Output Data</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Lokasi (lat,lng)</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={form.location}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, location: e.target.value }))
                      }
                      placeholder="contoh: 118.0399877,2.2893371"
                    />
                    {form.location && (
                      <a
                        href={buildMapUrl(form.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm link link-primary mt-1"
                      >
                        Lihat di Maps
                      </a>
                    )}
                  </div>

                  {/* Status Harvesting */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Status Harvesting</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={form.status_harvesting}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          status_harvesting: e.target.value,
                        }))
                      }
                    >
                      <option value="Planned">Planned</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Exception Case */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Exception Case</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      value={form.exception_case}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          exception_case: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>

                  {/* Foto */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Foto</span>
                    </label>
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
                    {preview && (
                      <div className="mt-2 relative w-32 h-32">
                        <Image
                          src={preview}
                          alt="Preview"
                          fill
                          className="object-cover rounded"
                          sizes="128px"
                        />
                      </div>
                    )}
                  </div>

                  {/* File BA Exca */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">File BA Exca (PDF)</span>
                    </label>
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
                  </div>
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
      )
      }
    </div >
  );
}
