/**
 * Client-side service for harvesting upload data.
 * All requests go through Next.js API routes (never directly to backend).
 */

export type HarvestingUploadData = {
  nospb: string;
  fieldcode: string;
  receptiondate: string;
  harvestdate: string;
  cropcode: string;
  productcode: string;
  own: string;
  vehicle: string;
  driver: string;
  mill: string;
  agreementcode: string | null;
  transporttype: string;
  spb_type: string | number;
  bunch: number | string;
  bucket: number | string | null;
  pressemester_abw: number | string;
  bunch_estateweight: number | string;
  fcentry: string | null;
  fcedit: string | null;
  fcip: string | null;
  fcba: string;
  lastupdate: string;
  lasttime: string;
  chitno: string;
  mill_weight_bruto: number | string;
  mill_weight_gross: number | string;
  mill_weight_tarra: number | string;
  mill_weight_potongan: number | string;
  mill_weight_netto: number | string;
  mentah: string | null;
  tankos: string | null;
  hilang: string | null;
  keterangan: string;
  mill_weight_dtl: number | string;
  bjr_chit: number | string;
};

export type HarvestingUploadParams = {
  nospb?: string;
  tanggal?: string;
  tanggal_end?: string;
  kode_kendaraan?: string;
  kode_karyawan_driver?: string;
  mill?: string;
  fcba?: string;
  chitno?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const fetchHarvestingUpload = async (
  params: HarvestingUploadParams
): Promise<ApiResponse<HarvestingUploadData[]>> => {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) queryParams.append(key, value);
  }

  const url = `/api/harvest/upload${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, { credentials: 'include' });
  const json = await response.json();

  if (json.success && Array.isArray(json.data)) {
    return { success: true, message: json.message || 'Data berhasil dimuat', data: json.data };
  }

  return { success: false, message: json.message || 'Data tidak ditemukan' };
};

export const insertHarvestingData = async (payload: {
  data: Record<string, unknown>[];
}): Promise<ApiResponse<string[]>> => {
  const response = await fetch('/api/harvest/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (response.ok && json.success) {
    return { success: true, message: json.message || 'Data berhasil diunggah', data: json.data };
  }

  return { success: false, message: json.message || `HTTP ${response.status}` };
};
