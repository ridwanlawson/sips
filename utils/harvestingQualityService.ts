/**
 * Client-side service for harvesting quality data.
 * All requests go through Next.js API routes (never directly to backend).
 */
'use client';

export type HarvestingQualityData = {
  empcode: string;
  fddate: string;
  fieldcode: string;
  under_ripe: string | number;
  overripe: string | number;
  abnormal: string | number;
  long_stalk: string | number;
  eaten_by_rat: string | number;
  unharvest_ffb: string | number;
  uncollect_lf_circle: string | number;
  uncollect_lf_piece: string | number;
  unarrange_ffb: string | number;
  unprune_frond: string | number;
  qe_1_pelepah_tidak_disusun: string | number;
  qe_2_buah_matahari: string | number;
  qe_3_buah_busuk: string | number;
  qe_4_buah_mentah_diperam: string | number;
  qe_5_over_pruning: string | number;
  qe_6_brondolan_tidak_dialas: string | number;
  qe_7_brondolan_kotor_sampah: string | number;
  qe_8_buah_dibelah: string | number;
  qe_9: string | number;
  qe_10: string | number;
  qe_11_buah_mentah_a1: string | number;
  qe_12_buah_tinggal_s: string | number;
  qe_13_b_ggng_pjg_t_dipotong: string | number;
  qe_14: string | number;
  qe_15: string | number;
  qe_16_buah_mentah_kerani: string | number;
  qe_17_buah_mentah_mandor: string | number;
  fcentry: string | null;
  fcedit: string | null;
  fcip: string | null;
  fcba: string;
  lastupdate: string;
  lasttime: string;
  documentno: string;
};

export type HarvestingQualityParams = {
  empcode?: string;
  fddate?: string;
  fddate_end?: string;
  fieldcode?: string;
  fcba?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const fetchHarvestingQuality = async (
  params: HarvestingQualityParams
): Promise<ApiResponse<HarvestingQualityData[]>> => {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) queryParams.append(key, value);
  }

  const url = `/api/harvesting-quality/upload${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, { credentials: 'include' });
  const json = await response.json();

  if (json.success && Array.isArray(json.data)) {
    return { success: true, message: json.message || 'Data berhasil dimuat', data: json.data };
  }

  return { success: false, message: json.message || 'Data tidak ditemukan' };
};

export const insertHarvestingQualityData = async (payload: {
  data: Record<string, unknown>[];
}): Promise<ApiResponse<string[]>> => {
  const response = await fetch('/api/harvesting-quality/submit', {
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
