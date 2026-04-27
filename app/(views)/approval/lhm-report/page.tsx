"use client";

import { useEffect, useState, useRef } from "react";

import { useSearchParams } from "next/navigation";
import "./lhm-report-print.css";

export default function LhmReport() {
  // Fungsi print
  const handlePrint = () => {
    window.print();
  };

  // Helper untuk format angka
  function formatNumber(val: string | number | null | undefined): string {
    const num = Number(val ?? "0");
    if (isNaN(num)) return "0";
    return num.toLocaleString("id-ID");
  }

  // Helper untuk format tanggal
  function formatDateDMY(raw: string | null | undefined): string {
    if (!raw) return "-";
    const trimmed = raw.trim();
    if (!trimmed) return "-";
    const onlyDate = trimmed.split(" ")[0];
    const parts = onlyDate.split("-");
    if (parts.length !== 3) return trimmed;
    const [y, m, d] = parts;
    if (!y || !m || !d) return trimmed;
    return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
  }

  type LhmData = {
    fddate: string;
    fcba: string;
    afdeling: string;
    kemandoran: string;
    employeecode: string;
    nama: string;
    attendance: string;
    hk: string;
    blok: string;
    tahuntanam: string;
    jjg: string;
    ha: string;
    mentahqty: string;
    mentahrp: string;
    emptybunchqty: string;
    emptybunchrp: string;
    jumlahdenda: number;
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
    total: string;
    keterangan?: string;
    mandorpanen?: string;
    keranipanen?: string;
    keranitransport?: string;
    mandor1?: string;
    asistenafdeling?: string;
    keranifdeling?: string;
  };

  const searchParams = useSearchParams();
  const fcba = searchParams.get("fcba") || "";
  const afdeling = searchParams.get("afdeling") || "";
  const tanggal = searchParams.get("tanggal") || "";
  const kemandoran = searchParams.get("kemandoran") || "";

  // Ref untuk wrapper print
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LhmData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type SignatureData = {
    mandorPanen: string;
    keraniPanen: string;
    keraniTransport: string;
    mandor1: string;
    asistenAfdeling: string;
    keraniAfdeling: string;
  };

  const [signatures, setSignatures] = useState<SignatureData>({
    mandorPanen: "-",
    keraniPanen: "-",
    keraniTransport: "-",
    mandor1: "-",
    asistenAfdeling: "-",
    keraniAfdeling: "-",
  });
  const [signaturesLoading, setSignaturesLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          fcba,
          afdeling,
          tanggal,
          kemandoran,
        });
        const res = await fetch(`/api/approval/lhm?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Filter data sesuai parameter
          const filtered = json.data.filter(
            (row: LhmData) =>
              row.fcba === fcba &&
              row.afdeling === afdeling &&
              row.kemandoran === kemandoran &&
              (row.fddate || "").split(" ")[0] === tanggal,
          );
          setData(filtered);
        } else {
          setError("Data tidak ditemukan.");
        }
      } catch {
        setError("Gagal memuat data LHM.");
      } finally {
        setLoading(false);
      }
    }
    if (fcba && tanggal && kemandoran && afdeling) fetchData();
    else setLoading(false);
  }, [fcba, tanggal, kemandoran, afdeling]);

  // Fetch signatures from API
  useEffect(() => {
    async function fetchSignatures() {
      if (!fcba || !afdeling || !kemandoran) return;

      setSignaturesLoading(true);
      try {
        const params = new URLSearchParams({
          fcba,
          afdeling,
          kemandoran,
        });
        const res = await fetch(
          `/api/approval/lhm-signatures?${params.toString()}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSignatures({
            mandorPanen: json.data.mandorPanen || "-",
            keraniPanen: json.data.keraniPanen || "-",
            keraniTransport: json.data.keraniTransport || "-",
            mandor1: json.data.mandor1 || "-",
            asistenAfdeling: json.data.asistenAfdeling || "-",
            keraniAfdeling: json.data.keraniAfdeling || "-",
          });
        }
      } catch {
        // Silent fail - keep default values
      } finally {
        setSignaturesLoading(false);
      }
    }
    fetchSignatures();
  }, [fcba, afdeling, kemandoran]);

  // Header info (dummy jika data kosong)
  const pt = "PT. SENTOSA KALIMANTAN JAYA";

  // Helper to render signature with underline or dash
  const renderSignature = (name: string) => {
    if (signaturesLoading) return <span className="animate-pulse">...</span>;
    return name !== "-" ? <span className="underline">{name}</span> : "-";
  };

  const mandorPanenEl = renderSignature(signatures.mandorPanen);
  const keraniPanenEl = renderSignature(signatures.keraniPanen);
  const keraniTransportEl = renderSignature(signatures.keraniTransport);
  const mandor1El = renderSignature(signatures.mandor1);
  const asistenAfdelingEl = renderSignature(signatures.asistenAfdeling);

  return (
    <div>
      {/* Tombol Print, hanya tampil di layar */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
        className="no-print"
      >
        <div className="tooltip tooltip-left">
          <div className="tooltip-content">
            <div className="animate-bounce text-orange-400 -rotate-9 text-xl font-black">
              Print Now!
            </div>
          </div>
          <button
            onClick={handlePrint}
            title=""
            className="btn bg-[#03C755] text-white border-[#00b544]"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              // className="text-white"
            >
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={printRef}
        className="lhm-print-wrapper"
        style={{ overflowX: "auto" }}
      >
        <div className="lhm-print-header">
          <div className="w-full">
            <div>
              <div>{pt}</div>
              <div>
                Kebun: <span>{fcba}</span>
              </div>
              <div>
                Afdeling: <span>{afdeling}</span>
              </div>
            </div>
            <div
              className="text-center"
              style={{ fontWeight: "bold", fontSize: 18 }}
            >
              LHM (LAPORAN HARIAN MANDOR) PANEN
            </div>
          </div>
        </div>
        <div className="lhm-print-info">
          <span>
            Tanggal: <span>{formatDateDMY(tanggal)}</span>
          </span>
          <span
            contentEditable
            suppressContentEditableWarning
            style={{ marginLeft: 80 }}
          >
            Mandor Panen : {mandorPanenEl}
          </span>
          <span
            contentEditable
            suppressContentEditableWarning
            style={{ marginLeft: 80 }}
          >
            Kerani Panen : {keraniPanenEl}
          </span>
          <span
            contentEditable
            suppressContentEditableWarning
            style={{ marginLeft: 80 }}
          >
            Kerani Transport : {keraniTransportEl}
          </span>
          <span
            contentEditable
            suppressContentEditableWarning
            style={{ marginLeft: 80 }}
          >
            Mandor I : {mandor1El}
          </span>
        </div>
        {error && <div style={{ color: "red", margin: "16px 0" }}>{error}</div>}
        {loading ? (
          <div>Memuat data...</div>
        ) : (
          <table className="lhm-print-table">
            <thead>
              <tr>
                <th rowSpan={3}>No</th>
                <th rowSpan={3}>NIK</th>
                <th rowSpan={3}>Nama Pemanen</th>
                <th rowSpan={3}>Absensi</th>
                <th rowSpan={3}>HK</th>
                <th rowSpan={3}>Blok</th>
                <th rowSpan={3}>Tahun Tanam</th>
                <th colSpan={2}>Hasil Kerja</th>
                <th colSpan={7}>Denda</th>
                <th rowSpan={3}>Hasil Netto (Jjg)</th>
                <th rowSpan={3}>Basis (Jjg)</th>
                <th colSpan={11}>Premi</th>
                <th rowSpan={3}>Premi Di Bayar</th>
                <th rowSpan={3}>Keterangan</th>
              </tr>
              <tr>
                <th rowSpan={2}>Jjg</th>
                <th rowSpan={2}>Ha</th>
                <th colSpan={2}>Buah Mentah (A)</th>
                <th colSpan={2}>Empty Bunch (E2)</th>
                <th colSpan={2}>Lainnya</th>
                <th rowSpan={2}>Jumlah (Rp)</th>
                <th rowSpan={2}>Siap Basis (Rp)</th>
                <th colSpan={3}>Lebih Basis 1</th>
                <th colSpan={3}>Lebih Basis 2</th>
                <th colSpan={3}>Lebih Basis 3</th>
                <th rowSpan={2}>Jumlah Premi (Rp)</th>
              </tr>
              <tr>
                <th>Janjang</th>
                <th>(Rp)</th>
                <th>Janjang</th>
                <th>(Rp)</th>
                <th>Janjang</th>
                <th>(Rp)</th>
                <th className="whitespace-nowrap">Jlh Jjg</th>
                <th>Rp/Jjg</th>
                <th>(Rp)</th>
                <th className="whitespace-nowrap">Jlh Jjg</th>
                <th>Rp/Jjg</th>
                <th>(Rp)</th>
                <th className="whitespace-nowrap">Jlh Jjg</th>
                <th>Rp/Jjg</th>
                <th>(Rp)</th>
              </tr>
              <tr>
                <th>(1)</th>
                <th>(2)</th>
                <th>(3)</th>
                <th>(4)</th>
                <th>(5)</th>
                <th>(6)</th>
                <th>(7)</th>
                <th>(8)</th>
                <th>(9)</th>
                <th>(10)</th>
                <th>(11)</th>
                <th>(12)</th>
                <th>(13)</th>
                <th>(14)</th>
                <th>(15)</th>
                <th>(16)</th>
                <th>(17)</th>
                <th>(18)</th>
                <th>(19)</th>
                <th>(20)</th>
                <th>(21)</th>
                <th>(22)</th>
                <th>(23)</th>
                <th>(24)</th>
                <th>(25)</th>
                <th>(26)</th>
                <th>(27)</th>
                <th>(28)</th>
                <th>(29)</th>
                <th>(30)</th>
                <th>(31)</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={31} style={{ textAlign: "center" }}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, idx) => (
                    <tr key={row.employeecode + idx}>
                      <td>{idx + 1}</td>
                      <td className="text-center whitespace-nowrap">
                        {row.employeecode}
                      </td>
                      <td className="whitespace-nowrap">{row.nama}</td>
                      <td className="text-center">{row.attendance}</td>
                      <td className="text-center">{row.hk}</td>
                      <td className="text-center">{row.blok}</td>
                      <td className="text-center">{row.tahuntanam}</td>
                      <td className="text-right">{formatNumber(row.jjg)}</td>
                      <td className="text-right">{formatNumber(row.ha)}</td>
                      <td className="text-right">
                        {formatNumber(row.mentahqty)}
                      </td>
                      <td className="text-right">
                        {formatNumber(row.mentahrp)}
                      </td>
                      <td className="text-right">
                        {formatNumber(row.emptybunchqty)}
                      </td>
                      <td className="text-right">
                        {formatNumber(row.emptybunchrp)}
                      </td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right">
                        {Number(row.jumlahdenda) !== 0
                          ? formatNumber(Number(row.jumlahdenda) * -1)
                          : formatNumber(row.jumlahdenda)}
                      </td>
                      <td className="text-right">
                        {formatNumber(row.totalalljjg)}
                      </td>
                      <td className="text-right">{formatNumber(row.basis)}</td>
                      <td className="text-right">
                        {formatNumber(row.rpbasis)}
                      </td>
                      <td className="text-right">
                        {formatNumber(row.premilv1)}
                      </td>
                      <td className="text-right">{formatNumber(row.rate1)}</td>
                      <td className="text-right">{formatNumber(row.rplv1)}</td>
                      <td className="text-right">
                        {formatNumber(row.premilv2)}
                      </td>
                      <td className="text-right">{formatNumber(row.rate2)}</td>
                      <td className="text-right">{formatNumber(row.rplv2)}</td>
                      <td className="text-right">
                        {formatNumber(row.premilv3)}
                      </td>
                      <td className="text-right">{formatNumber(row.rate3)}</td>
                      <td className="text-right">{formatNumber(row.rplv3)}</td>
                      <td className="text-right whitespace-nowrap">
                        {formatNumber(row.totalrppremi)}
                      </td>
                      <td className="text-right font-bold whitespace-nowrap">
                        {formatNumber(row.total)}
                      </td>
                      <td className="whitespace-nowrap">
                        {row.keterangan || ""}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal Row */}
                  <tr className="font-bold bg-gray-100">
                    <td colSpan={7} className="text-right">
                      Subtotal
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.jjg || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce((sum, row) => sum + Number(row.ha || 0), 0),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.mentahqty || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.mentahrp || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.emptybunchqty || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.emptybunchrp || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right">0</td>
                    <td className="text-right">0</td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.jumlahdenda || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.totalalljjg || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.basis || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.rpbasis || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.premilv1 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap"></td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.rplv1 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.premilv2 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap"></td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.rplv2 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.premilv3 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap"></td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.rplv3 || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.totalrppremi || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right font-bold whitespace-nowrap">
                      {formatNumber(
                        data.reduce(
                          (sum, row) => sum + Number(row.total || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
        <div className="footer flex justify-between">
          <div className="lhm-print-notes border-2 border-black p-3 rounded w-full text-sm leading-tight">
            <div>
              <span className="font-semibold">Catatan:</span>
              <ol className="list-decimal pl-4 m-0 space-y-1">
                <li>
                  Jumlah pemanen per Mandoran minimal 15 orang (3 mandoran
                  panen)
                </li>
                <li>
                  Jumlah pemanen per Mandoran minimal 16 orang (1 atau 2
                  mandoran panen)
                </li>
                <li>
                  (* Sesuai ketetapan IM Pak TA No. 27 Tahun 2023 pada point 7
                  sd. 12
                </li>
                <li>
                  Kriteria Janjang Netto ** setelah dikurangi :
                  <ul className="pl-4 m-0 space-y-0.5">
                    <li className="before:content-['-'] before:mr-1">
                      Buah Mentah (A) mentah (A, A + 1 dan A ≥ 3)
                    </li>
                    <li className="before:content-['-'] before:mr-1">
                      Buah (S) masak tinggal di pokok
                    </li>
                    <li className="before:content-['-'] before:mr-1">Denda</li>
                    <li className="before:content-['-'] before:mr-1">
                      Buah tinggal di piringan/pasar rintis/gawangan
                    </li>
                    <li className="before:content-['-'] before:mr-1">
                      Buah matahari
                    </li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>

          {/* 
            <div className="lhm-print-premi">
              <div className="premi-line text-center">
                PREMI KERANI PANEN Rp <span className="garis"></span> X 100% X IKP{" "}
                <span className="garis"></span>% = Rp{" "}
                <span className="garis"></span> s/d HI Rp{" "}
                <span className="garis"></span>
              </div>
              <div className="premi-line text-center">
                PREMI KERANI TRANSPORT Rp <span className="garis"></span> X 110% X
                IKKP <span className="garis"></span>% = Rp{" "}
                <span className="garis"></span> a/d HI Rp{" "}
                <span className="garis"></span>
              </div>
              <div className="premi-line text-center">
                PREMI MANDOR PANEN Rp <span className="garis"></span> X 125% X IKP{" "}
                <span className="garis"></span>% = Rp{" "}
                <span className="garis"></span> s/d HI Rp{" "}
                <span className="garis"></span>
              </div>
              <div className="premi-line">
                PREMI MANDOR I Rp <span className="garis"></span> X 150% X IPP{" "}
                <span className="garis"></span>% = Rp{" "}
                <span className="garis"></span> s/d HI Rp{" "}
                <span className="garis"></span>
              </div>
            </div> 
          */}

          <div className="lhm-print-sign whitespace-nowrap w-full">
            <div>
              <div className="font-bold">Dibuat,</div>
              <div
                contentEditable
                suppressContentEditableWarning
                style={{ marginTop: 48 }}
              >
                {mandorPanenEl}
              </div>
              <div>Mandor Panen</div>
            </div>
            <div>
              <div className="font-bold">Verifikasi,</div>
              <div
                contentEditable
                suppressContentEditableWarning
                style={{ marginTop: 48 }}
              >
                {mandor1El}
              </div>
              <div>Mandor I</div>
            </div>
            <div>
              <div className="font-bold">Disetujui,</div>
              <div
                contentEditable
                suppressContentEditableWarning
                style={{ marginTop: 48 }}
              >
                {asistenAfdelingEl}
              </div>
              <div>Asisten Afdeling</div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          /* Sembunyikan navbar, footer layout, dan tombol print */
          nav,
          .navbar,
          footer,
          .no-print {
            display: none !important;
          }
          /* Pastikan wrapper print tampil penuh */
          .lhm-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .lhm-print-wrapper,
          .lhm-print-wrapper * {
            visibility: visible !important;
            color: #000 !important;
          }
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
