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
  tanggal: string;
  tanggal_end: string;
  kode_kendaraan: string;
  kode_karyawan_driver: string;
  mill: string;
  fcba: string;
  chitno: string;
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

export const fetchHarvestingUpload = async (
  params: HarvestingUploadParams,
): Promise<ApiResponse<HarvestingUploadData[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.nospb?.trim()) queryParams.append("nospb", params.nospb);
    if (params.tanggal?.trim()) queryParams.append("tanggal", params.tanggal);
    if (params.tanggal_end?.trim())
      queryParams.append("tanggal_end", params.tanggal_end);
    if (params.kode_kendaraan?.trim())
      queryParams.append("kode_kendaraan", params.kode_kendaraan);
    if (params.kode_karyawan_driver?.trim())
      queryParams.append("kode_karyawan_driver", params.kode_karyawan_driver);
    if (params.mill?.trim()) queryParams.append("mill", params.mill);
    if (params.fcba?.trim()) queryParams.append("fcba", params.fcba);
    if (params.chitno?.trim()) queryParams.append("chitno", params.chitno);

    const url = `${API_BASE_URL}/report/upload-harvesting${queryParams.toString() ? `?${queryParams}` : ""}`;

    console.log("HARVESTING UPLOAD DEBUG - URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    });

    console.log("HARVESTING UPLOAD DEBUG - Response Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("HARVESTING UPLOAD DEBUG - Error:", errorData);
      return {
        success: false,
        message:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const json = await response.json();
    console.log("HARVESTING UPLOAD DEBUG - Success:", json);

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
    console.error("HARVESTING UPLOAD DEBUG - Exception:", message);
    return {
      success: false,
      message,
    };
  }
};

export const insertHarvestingData = async (
  payload: { data: Record<string, unknown>[] },
): Promise<ApiResponse<string[]>> => {
  try {
    const url = `${API_BASE_URL}/uploads/harvesting`;

    console.log("HARVESTING UPLOAD DEBUG - POST URL:", url);
    console.log("HARVESTING UPLOAD DEBUG - Payload:", payload);

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

    console.log("HARVESTING UPLOAD DEBUG - POST Response Status:", response.status);

    const json = await response.json();
    console.log("HARVESTING UPLOAD DEBUG - POST Response:", json);

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
    console.error("HARVESTING UPLOAD DEBUG - POST Exception:", message);
    return {
      success: false,
      message,
    };
  }
};
