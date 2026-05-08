/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/app/components/dynamic-data-table";
import type { TableColumn } from "react-data-table-component";
import toast from "react-hot-toast";
import { SkeletonTable } from "@/app/components/skeletons";
import { isUnauthenticatedJson, logoutAndRedirect } from "@/utils/authHelper";
import { getTodayISO, formatDateDMY, getYesterdayISO } from "@/utils/datetime";
import { centerHeaderStyle } from "@/utils/tableHelper";

/* =========================
   T Y P E S
========================= */
type LhmData = {
  _rowKey?: string;
  _selected?: boolean;
  id: string;
  rowdata: string;
  fddate: string;
  kemandoran: string;
  fcba: string;
  afdeling: string;
  employeecode: string;
  nama: string;
  attendance: string;
  hk: string | null;
  blok: string;
  tahuntanam: string;
  jjg: string;
  brd: string;
  ha: string;
  mentahqty: string;
  mentahrp: string;
  emptybunchqty: string;
  emptybunchrp: string;
  jumlahdenda: string;
  totalalljjg: string;
  basis: string;
  rpbasis: string;
  premilv1: string;
  rate1: string;
  rplv1: string;
  premilv2: string;
  rate2: string;
  rplv2: string;
  premilv3: string;
  rate3: string;
  rplv3: string;
  totalrppremi: string;
  kurangbasis: string;
  harilibur: string;
  rphk: string;
  total: string;
  under_ripe: string;
  overripe: string;
  abnormal: string;
  long_stalk: string;
  eaten_by_rat: string;
  unharvest_ffb: string;
  uncollect_lf_circle: string;
  uncollect_lf_piece: string;
  unarrange_ffb: string;
  unprune_frond: string;
  qe_1_pelepah_tidak_disusun: string;
  qe_2_buah_matahari: string;
  qe_3_buah_busuk: string;
  qe_4_buah_mentah_diperam: string;
  qe_5_over_pruning: string;
  qe_6_brondolan_tidak_dialas: string;
  qe_7_brondolan_kotor_sampah: string;
  qe_8_buah_dibelah: string;
  qe_9: string;
  qe_10: string;
  fcentry: string;
  fcedit: string;
  fcip: string;
  lastupdate: string;
  lasttime: string;
  qe_11_buah_mentah_a1: string;
  qe_12_buah_tinggal_s: string;
  qe_13_b_ggng_pjg_t_dipotong: string;
  qe_14: string;
  qe_15: string;
  qe_16_buah_mentah_kerani: string;
  qe_17_buah_mentah_mandor: string;
  documentno: string;
};

type Filters = Partial<{
  fddate: string;
  fddate_end: string;
  kemandoran: string;
  employeecode: string;
  fcba: string;
  afdeling: string;
  tahuntanam: string;
  blok: string;
  attendance: string;
}>;

/* =========================
   U T I L S
========================= */
const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? decodeURIComponent(m.pop() as string) : null;
};

/* =========================
   M A I N
========================= */
export default function Approval() {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<LhmData[]>([]);
  const [toggledClearRows, setToggledClearRows] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const yesterday = getYesterdayISO();
    const today = getTodayISO();
    return {
      fddate: yesterday,
      fddate_end: today,
      kemandoran: "",
      employeecode: "",
      fcba: "",
      afdeling: "",
      tahuntanam: "",
      blok: "",
      attendance: "",
    };
  });

  const [homeFcba, setHomeFcba] = useState<string>("");
  const [userLevel, setUserLevel] = useState<"ADM" | "MGR" | "AST" | "OTHER">(
    "OTHER",
  );

  /* ===== Bootstrap cookies ===== */
  useEffect(() => {
    const ckHome =
      readCookie("user_Fcba") ||
      readCookie("user_FCBA") ||
      readCookie("user_fcba") ||
      "";
    setHomeFcba(ckHome);

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
  }, []);

  /* ===== Fetch LHM data ===== */
  const [items, setItems] = useState<LhmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    setSelectedRows([]);
    setToggledClearRows((prev) => !prev);

    try {
      const params = new URLSearchParams();
      const f = { ...filters };

      if (userLevel === "MGR" || userLevel === "AST") {
        if (homeFcba) f.fcba = homeFcba;
        if (filters.afdeling) f.afdeling = filters.afdeling;
      }

      Object.entries(f).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(k, v as string);
        }
      });

      const res = await fetch(
        `/api/approval/lhm${params.toString() ? `?${params}` : ""}`,
        { credentials: "include" },
      );

      if (res.status === 401) {
        await logoutAndRedirect();
        return;
      }

      const json = await res.json();
      if (isUnauthenticatedJson(json)) {
        await logoutAndRedirect();
        return;
      }

      if (!res.ok) {
        const msg = json.message || `HTTP ${res.status}`;
        setError(msg);
        setItems([]);
        return;
      }

      if (json.success && Array.isArray(json.data)) {
        if (json.data.length === 0) {
          // Data kosong, tampilkan message dari API
          setError(json.message || "Data tidak ditemukan.");
          setItems([]);
        } else {
          const seen = new Set<string>();
          const data = json.data.map((it: LhmData, idx: number) => {
            const candidate = [
              it.employeecode || "",
              it.kemandoran || "",
              (it.fddate || "").split(" ")[0],
              it.blok || "",
              it.fcba || "",
              it.afdeling || "",
              String(idx),
            ].join("|");
            let key = candidate;
            while (seen.has(key)) key = `${key}_`;
            seen.add(key);
            return { ...it, _rowKey: key };
          });
          setItems(data);
        }
      } else {
        const msg = json.message || "Gagal mengambil data";
        setError(msg);
        setItems([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, userLevel, homeFcba]);

  useEffect(() => {
    if (homeFcba || userLevel === "ADM") {
      fetchData();
    }
  }, [filters, userLevel, homeFcba, fetchData]);

  /* ===== Quick search ===== */
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    const filteredItems = items.filter((it) =>
      [
        it.employeecode,
        it.nama,
        it.fddate,
        it.kemandoran,
        it.blok,
        it.fcba,
        it.afdeling,
        it.attendance,
        it.tahuntanam,
        it.documentno,
        it.fcentry,
        it.lastupdate,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
    // Jika pencarian attendance tidak ditemukan, tampilkan error
    if (q && items.length > 0) {
      const attendanceExists = items.some((item) =>
        (item.attendance || "").toLowerCase().includes(s),
      );
      if (!attendanceExists) {
        setError(`Data dengan attendance "${q}" tidak ditemukan.`);
      } else {
        setError(null);
      }
    }
    return filteredItems;
  }, [q, items]);

  /* ===== Row selection ===== */
  const handleRowSelected = useCallback(
    (state: { selectedRows: LhmData[] }) => {
      setSelectedRows(state.selectedRows);
    },
    [],
  );

  /* ===== Approve (submit to upstream) ===== */
  const handleApprove = async () => {
    if (selectedRows.length === 0) {
      toast.error("Pilih data yang akan di-approve terlebih dahulu");
      return;
    }

    const confirmed = confirm(
      `Apakah Anda yakin ingin meng-approve ${selectedRows.length} data LHM?`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      // Map selected rows ke urutan dan tipe data sesuai backend
      const dataArr = selectedRows.map((row) => {
        return {
          id: row.id || "", // ID unik, jika tidak ada bisa generate UUID
          rowdata: row.rowdata || "",
          kemandoran: row.kemandoran || "",
          fddate: (row.fddate || "").split(" ")[0],
          fcba: row.fcba || "",
          afdeling: row.afdeling || "",
          employeecode: row.employeecode || "",
          nama: row.nama || "",
          attendance: row.attendance || "",
          hk: Number(row.hk || 0),
          blok: row.blok || "",
          tahuntanam: Number(row.tahuntanam || 0),
          jjg: Number(row.jjg || 0),
          brd: Number(row.brd || 0),
          ha: Number(row.ha || 0),
          mentahqty: Number(row.mentahqty || 0),
          mentahrp: Number(row.mentahrp || 0),
          emptybunchqty: Number(row.emptybunchqty || 0),
          emptybunchrp: Number(row.emptybunchrp || 0),
          jumlahdenda: Number(row.jumlahdenda || 0),
          totalalljjg: Number(row.totalalljjg || 0),
          basis: Number(row.basis || 0),
          rpbasis: Number(row.rpbasis || 0),
          premilv1: Number(row.premilv1 || 0),
          rate1: Number(row.rate1 || 0),
          rplv1: Number(row.rplv1 || 0),
          premilv2: Number(row.premilv2 || 0),
          rate2: Number(row.rate2 || 0),
          rplv2: Number(row.rplv2 || 0),
          premilv3: Number(row.premilv3 || 0),
          rate3: Number(row.rate3 || 0),
          rplv3: Number(row.rplv3 || 0),
          totalrppremi: Number(row.totalrppremi || 0),
          kurangbasis: Number(row.kurangbasis || 0),
          harilibur: Number(row.harilibur || 0),
          rphk: Number(row.rphk || 0),
          total: Number(row.total || 0),
        };
      });

      const payload = { data: dataArr };

      const res = await fetch("/api/approval/lhm/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(`${selectedRows.length} data LHM berhasil di-approve ✅`);
        setSelectedRows([]);
        setToggledClearRows((prev) => !prev);
        fetchData();
      } else {
        const msg = json.message || "Gagal meng-approve data";
        toast.error(msg);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat approval";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== Export Excel ===== */
  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const dataToExport = filtered.map((r, idx) => ({
      No: idx + 1,
      Tanggal: formatDateDMY(r.fddate),
      Kemandoran: r.kemandoran || "-",
      FCBA: r.fcba || "-",
      Afdeling: r.afdeling || "-",
      "Kode Karyawan": r.employeecode || "-",
      Nama: r.nama || "-",
      Attendance: r.attendance || "-",
      HK: r.hk ?? "-",
      Blok: r.blok || "-",
      "Tahun Tanam": r.tahuntanam || "-",
      JJG: r.jjg || "0",
      BRD: r.brd || "0",
      HA: r.ha || "0",
      MentahQty: r.mentahqty || "0",
      MentahRp: r.mentahrp || "0",
      EmptyBunchQty: r.emptybunchqty || "0",
      EmptyBunchRp: r.emptybunchrp || "0",
      JumlahDenda: r.jumlahdenda || "0",
      TotalAllJjg: r.totalalljjg || "0",
      Basis: r.basis || "0",
      RpBasis: r.rpbasis || "0",
      PremiLv1: r.premilv1 || "0",
      Rate1: r.rate1 || "0",
      RpLv1: r.rplv1 || "0",
      PremiLv2: r.premilv2 || "0",
      Rate2: r.rate2 || "0",
      RpLv2: r.rplv2 || "0",
      PremiLv3: r.premilv3 || "0",
      Rate3: r.rate3 || "0",
      RpLv3: r.rplv3 || "0",
      TotalRpPremi: r.totalrppremi || "0",
      KurangBasis: r.kurangbasis || "0",
      HariLibur: r.harilibur || "0",
      RpHK: r.rphk || "0",
      Total: r.total || "0",
      "Under Ripe": r.under_ripe || "0",
      Overripe: r.overripe || "0",
      Abnormal: r.abnormal || "0",
      "Long Stalk": r.long_stalk || "0",
      "Eaten by Rat": r.eaten_by_rat || "0",
      "Unharvest FFB": r.unharvest_ffb || "0",
      "Uncollect LF Circle": r.uncollect_lf_circle || "0",
      "Uncollect LF Piece": r.uncollect_lf_piece || "0",
      "Unarrange FFB": r.unarrange_ffb || "0",
      "Unprune Frond": r.unprune_frond || "0",
      "QE1 Pelepah Tidak Disusun": r.qe_1_pelepah_tidak_disusun || "0",
      "QE2 Buah Matahari": r.qe_2_buah_matahari || "0",
      "QE3 Buah Busuk": r.qe_3_buah_busuk || "0",
      "QE4 Buah Mentah Diperam": r.qe_4_buah_mentah_diperam || "0",
      "QE5 Over Pruning": r.qe_5_over_pruning || "0",
      "QE6 Brondolan Tidak Dialas": r.qe_6_brondolan_tidak_dialas || "0",
      "QE7 Brondolan Kotor Sampah": r.qe_7_brondolan_kotor_sampah || "0",
      "QE8 Buah Dibelah": r.qe_8_buah_dibelah || "0",
      QE9: r.qe_9 || "0",
      QE10: r.qe_10 || "0",
      "QE11 Buah Mentah A1": r.qe_11_buah_mentah_a1 || "0",
      "QE12 Buah Tinggal S": r.qe_12_buah_tinggal_s || "0",
      "QE13 B Ggng Pjg T Dipotong": r.qe_13_b_ggng_pjg_t_dipotong || "0",
      QE14: r.qe_14 || "0",
      QE15: r.qe_15 || "0",
      "QE16 Buah Mentah Kerani": r.qe_16_buah_mentah_kerani || "0",
      "QE17 Buah Mentah Mandor": r.qe_17_buah_mentah_mandor || "0",
      "Document No": r.documentno || "-",
      "Last Update": r.lastupdate || "-",
      "Last Time": r.lasttime || "-",
    }));

    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Approval LHM");
    xlsx.writeFile(
      wb,
      `Approval_LHM_${filters.fddate}_${filters.fddate_end}.xlsx`,
    );
  };

  /* ===== Columns ===== */
  const formatNumber = (val: string | null | undefined) => {
    const num = Number(val ?? "0");
    if (isNaN(num)) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const numCell = (val: string | null | undefined) => {
    const formatted = formatNumber(val);
    return (
      <span className="text-right inline-block w-full text-gray-700">
        {formatted}
      </span>
    );
  };

  const columns: TableColumn<LhmData>[] = useMemo(
    () => [
      {
        name: <span title="Aksi edit/hapus data absensi">Act</span>,
        width: "50px",
        cell: (r) => {
          const tanggal = (r.fddate || "").split(" ")[0];

          return (
            <div className="space-x-1 whitespace-nowrap">
              {r.fcba && r.fddate && r.kemandoran && (
                <a
                  href={`/approval/lhm-report?fcba=${r.fcba}&afdeling=${r.afdeling}&tanggal=${tanggal}&kemandoran=${r.kemandoran}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tooltip tooltip-right"
                  data-tip={` Print LHM Kemandoran ${r.kemandoran} `}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="css-i6dzq1"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </a>
              )}
            </div>
          );
        },
        ignoreRowClick: true,
      },
      {
        name: <span title="Nomor urut baris">#</span>,
        width: "70px",
        cell: (_r, i) => <span>{i + 1}</span>,
        ignoreRowClick: true,
      },
      {
        name: <span title="Tanggal panen">Tanggal</span>,
        selector: (r) => (r.fddate || "").split(" ")[0],
        sortable: true,
        width: "125px",
        cell: (r) => {
          const raw = (r.fddate || "").split(" ")[0];
          return <span title={raw}>{formatDateDMY(raw)}</span>;
        },
      },
      // {
      //   name: <span title="Bisnis Unit">FCBA</span>,
      //   selector: (r) => r.fcba,
      //   sortable: true,
      //   width: "70px",
      // },
      {
        name: <span title="Kode Karyawan">Karyawan</span>,
        selector: (r) => r.employeecode,
        sortable: true,
        width: "180px",
        style: { flexGrow: 2 as number, minWidth: "160px" },
      },
      {
        name: <span title="Nama Karyawan">Nama</span>,
        selector: (r) => r.nama,
        sortable: true,
        width: "160px",
        style: { flexGrow: 2 as number, minWidth: "140px" },
      },
      {
        name: <span title="Kode Attendance">Att</span>,
        selector: (r) => r.attendance,
        sortable: true,
        width: "80px",
        cell: (r) =>
          r.attendance ? (
            <span className="badge badge-sm badge-ghost">{r.attendance}</span>
          ) : null,
      },
      {
        name: <span title="Hari Kerja (HK)">HK</span>,
        selector: (r) => r.hk ?? "-",
        sortable: true,
        width: "65px",
        cell: (r) => r.hk,
      },
      {
        name: <span title="Kode Blok">Blok</span>,
        selector: (r) => r.blok,
        sortable: true,
        width: "75px",
      },
      {
        name: <span title="Tahun Tanam">Tahun Tanam</span>,
        selector: (r) => r.tahuntanam,
        sortable: true,
        width: "80px",
      },
      {
        name: <span title="Janjang (JJG)">JJG</span>,
        selector: (r) => r.jjg,
        sortable: true,
        width: "70px",
        cell: (r) => numCell(r.jjg),
      },
      {
        name: <span title="Brondolan (BRD)">BRD</span>,
        selector: (r) => r.brd,
        sortable: true,
        width: "70px",
        cell: (r) => numCell(r.brd),
      },
      {
        name: <span title="Hektar (HA)">HA</span>,
        selector: (r) => r.ha,
        sortable: true,
        width: "65px",
        cell: (r) => numCell(r.ha),
      },
      {
        name: <span title="Mentah Qty">Mentah-A (Jjg)</span>,
        selector: (r) => r.mentahqty,
        sortable: true,
        width: "110px",
        cell: (r) => numCell(r.mentahqty),
      },
      {
        name: <span title="Mentah Rp">Mentah-A (Rp)</span>,
        selector: (r) => r.mentahrp,
        sortable: true,
        width: "110px",
        cell: (r) => numCell(r.mentahrp),
      },
      {
        name: <span title="Empty Bunch Qty">E (Jjg)</span>,
        selector: (r) => r.emptybunchqty,
        sortable: true,
        width: "70px",
        cell: (r) => numCell(r.emptybunchqty),
      },
      {
        name: (
          <span title="Empty Bunch Rp">
            E <br />
            (Rp)
          </span>
        ),
        selector: (r) => r.emptybunchrp,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.emptybunchrp),
      },
      {
        name: <span title="Jumlah Denda">Jumlah (Rp)</span>,
        selector: (r) => r.jumlahdenda,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.jumlahdenda),
      },
      {
        name: <span title="Hasil Netto Jjg">Hasil Netto (Jjg)</span>,
        selector: (r) => r.totalalljjg,
        sortable: true,
        width: "80px",
        cell: (r) => numCell(r.totalalljjg),
      },
      {
        name: <span title="Janjang Basis">Basis (Jjg)</span>,
        selector: (r) => r.basis,
        sortable: true,
        width: "70px",
        cell: (r) => numCell(r.basis),
      },
      {
        name: <span title="Rupiah Siap Basis">Siap Basis (Rp)</span>,
        selector: (r) => r.rpbasis,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rpbasis),
      },
      {
        name: (
          <span title="Jumlah Janjang Lebih Basis Level 1">
            Level 1 Jlh Jjg
          </span>
        ),
        selector: (r) => r.premilv1,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.premilv1),
      },
      {
        name: <span title="Rupiah / Janjang Level 1">Level 1 Rp/Jjg</span>,
        selector: (r) => r.rate1,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rate1),
      },
      {
        name: <span title="Rupiah Level 1">Level 1 Rp</span>,
        selector: (r) => r.rplv1,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rplv1),
      },
      {
        name: (
          <span title="Jumlah Janjang Lebih Basis Level 2">
            Level 2 Jlh Jjg
          </span>
        ),
        selector: (r) => r.premilv2,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.premilv2),
      },
      {
        name: <span title="Rupiah / Janjang Level 2">Level 2 Rp/Jjg</span>,
        selector: (r) => r.rate2,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rate2),
      },
      {
        name: <span title="Rupiah Level 2">Level 2 Rp</span>,
        selector: (r) => r.rplv2,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rplv2),
      },
      {
        name: (
          <span title="Jumlah Janjang Lebih Basis Level 3">
            Level 3 Jlh Jjg
          </span>
        ),
        selector: (r) => r.premilv3,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.premilv3),
      },
      {
        name: <span title="Rupiah / Janjang Level 3">Level 3 Rp/Jjg</span>,
        selector: (r) => r.rate3,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rate3),
      },
      {
        name: <span title="Rupiah Level 3">Level 3 Rp</span>,
        selector: (r) => r.rplv3,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.rplv3),
      },
      {
        name: <span title="Jumlah Premi (Rp)">Jumlah Premi (Rp)</span>,
        selector: (r) => r.totalrppremi,
        sortable: true,
        width: "85px",
        cell: (r) => numCell(r.totalrppremi),
      },
      {
        name: <span title="Total">Total</span>,
        selector: (r) => r.total,
        sortable: true,
        width: "100px",
        cell: (r) => (
          <span className="font-bold w-full text-right inline-block">
            {formatNumber(r.total)}
          </span>
        ),
      },
    ],
    [numCell],
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <h1
            className="text-2xl sm:text-3xl font-bold min-w-0 truncate"
            title="Halaman Approval LHM (Laporan Harian Mandor)"
          >
            Approval LHM
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
              className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
              onClick={fetchData}
              disabled={loading}
              title="Refresh data LHM"
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
            <button
              className={`btn btn-primary btn-sm ${submitting ? "btn-disabled" : ""}`}
              onClick={handleApprove}
              disabled={selectedRows.length === 0 || submitting}
              title="Approve data LHM yang dipilih"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Approving...
                </>
              ) : (
                `✅ Approve (${selectedRows.length})`
              )}
            </button>
          </div>
        </div>

        {/* Selected info */}
        {selectedRows.length > 0 && (
          <div className="mb-3">
            <div className="badge badge-lg badge-success gap-2">
              <span>{selectedRows.length}</span>
              <span>data dipilih untuk approval</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setSelectedRows([]);
                  setToggledClearRows((prev) => !prev);
                }}
                title="Batal pilih semua"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Quick Search */}
        <div className="mb-3 flex justify-end gap-2">
          <input
            className="input input-bordered w-full md:w-96"
            placeholder="Cari apapun (karyawan, blok, fcba, document no...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            title="Pencarian cepat di semua kolom penting"
          />
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-4 border border-base-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Awal"
                value={filters.fddate ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fddate: e.target.value }))
                }
                title="Filter tanggal awal panen"
              />
              <input
                type="date"
                className="input input-bordered w-full"
                placeholder="Tanggal Akhir"
                value={filters.fddate_end ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fddate_end: e.target.value }))
                }
                title="Filter tanggal akhir panen"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kemandoran"
                value={filters.kemandoran ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, kemandoran: e.target.value }))
                }
                title="Filter berdasarkan kemandoran"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Kode Karyawan"
                value={filters.employeecode ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, employeecode: e.target.value }))
                }
                title="Filter berdasarkan kode karyawan"
              />
              <input
                className="input input-bordered w-full"
                placeholder="FCBA"
                value={filters.fcba ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, fcba: e.target.value }))
                }
                title="Filter berdasarkan FCBA"
                disabled={userLevel === "MGR" || userLevel === "AST"}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Afdeling"
                value={filters.afdeling ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, afdeling: e.target.value }))
                }
                title="Filter berdasarkan Afdeling"
                disabled={userLevel === "MGR" || userLevel === "AST"}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Tahun Tanam"
                value={filters.tahuntanam ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, tahuntanam: e.target.value }))
                }
                title="Filter berdasarkan tahun tanam"
              />
              <input
                className="input input-bordered w-full"
                placeholder="Blok"
                value={filters.blok ?? ""}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, blok: e.target.value }))
                }
                title="Filter berdasarkan kode blok"
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
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-base-200">
              <button
                className={`btn btn-outline ${loading ? "btn-disabled" : ""}`}
                onClick={fetchData}
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
                  const yesterday = getYesterdayISO();
                  const today = getTodayISO();
                  setFilters({
                    fddate: yesterday,
                    fddate_end: today,
                    kemandoran: "",
                    employeecode: "",
                    fcba:
                      userLevel === "MGR" || userLevel === "AST"
                        ? homeFcba
                        : "",
                    afdeling: "",
                    tahuntanam: "",
                    blok: "",
                    attendance: "",
                  });
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

        {/* Error */}
        {/* Error visual dihilangkan, cukup toast saja yang muncul */}

        {/* DataTable */}
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
                data={filtered}
                progressPending={loading}
                pagination
                customStyles={centerHeaderStyle}
                paginationPerPage={100}
                paginationRowsPerPageOptions={[10, 30, 100, 500]}
                dense
                highlightOnHover
                fixedHeader
                fixedHeaderScrollHeight="520px"
                persistTableHead
                responsive
                selectableRows
                onSelectedRowsChange={handleRowSelected}
                clearSelectedRows={toggledClearRows}
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
    </div>
  );
}
