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

const API_BASE_URL = "http://dev.skj.my.id:82/api";

const getAuthToken = (): string => {
  if (typeof window === "undefined") return "";
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  return cookieValue || "";
};

export const fetchHarvestingQuality = async (
  params: HarvestingQualityParams,
): Promise<ApiResponse<HarvestingQualityData[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.empcode?.trim()) queryParams.append("empcode", params.empcode);
    if (params.fddate?.trim()) queryParams.append("fddate", params.fddate);
    if (params.fddate_end?.trim())
      queryParams.append("fddate_end", params.fddate_end);
    if (params.fieldcode?.trim()) queryParams.append("fieldcode", params.fieldcode);
    if (params.fcba?.trim()) queryParams.append("fcba", params.fcba);

    const url = `${API_BASE_URL}/report/upload-harvesting-quality${queryParams.toString() ? `?${queryParams}` : ""}`;

    console.log("HARVESTING QUALITY DEBUG - URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    });

    console.log("HARVESTING QUALITY DEBUG - Response Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("HARVESTING QUALITY DEBUG - Error:", errorData);
      return {
        success: false,
        message:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const json = await response.json();
    console.log("HARVESTING QUALITY DEBUG - Success:", json);

    if (json.success && json.data && Array.isArray(json.data)) {
      return {
        success: true,
        message: json.message || "Data berhasil dimuat",
        data: json.data,
      };
    }

    return {
      success: false,
      message: json.message || "Data tidak ditemukan",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";
    console.error("HARVESTING QUALITY DEBUG - Exception:", message);
    return {
      success: false,
      message,
    };
  }
};

export const insertHarvestingQualityData = async (
  payload: { data: Record<string, unknown>[] },
): Promise<ApiResponse<string[]>> => {
  try {
    const url = `${API_BASE_URL}/uploads/harvestingquality`;

    console.log("HARVESTING QUALITY DEBUG - POST URL:", url);
    console.log("HARVESTING QUALITY DEBUG - Payload:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    console.log("HARVESTING QUALITY DEBUG - POST Response Status:", response.status);

    const json = await response.json();
    console.log("HARVESTING QUALITY DEBUG - POST Response:", json);

    if (response.ok && json.success) {
      return {
        success: true,
        message: json.message || "Data berhasil diunggah",
        data: json.data,
      };
    }

    return {
      success: false,
      message: json.message || `HTTP ${response.status}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";
    console.error("HARVESTING QUALITY DEBUG - POST Exception:", message);
    return {
      success: false,
      message,
    };
  }
};
