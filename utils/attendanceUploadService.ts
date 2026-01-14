export interface AttendanceUploadData {
  totalcount: number;
  id: number;
  afdeling: string;
  gangcode: string;
  fddate: string;
  supervision_1: string | null;
  supervision_2: string | null;
  supervision_3: string | null;
  supervision_4: string | null;
  supervision_5: string | null;
  employeecode: string;
  attendance: string;
  jobcode: string;
  locationtype: string;
  locationcode: string;
  mandays: number;
  othrs: number;
  rate: number;
  unit: number;
  output: number;
  reference: string | null;
  remarks: string;
  fcentry: string;
  fcedit: string;
  fcip: string | null;
  fcba: string;
  lastupdate: string;
  lasttime: string;
  linenokey: number;
  overtime_hours: number;
  type_overtime: number;
  chargejob: string | null;
  chargetype: string | null;
  chargecode: string | null;
  bucket: string | null;
  spbno: string | null;
  kg_brondolan: number;
  rowstate: string;
  document_classification: number;
  basis_bm: number;
  kg_janjang: number;
  bjr: number;
  documentno: number;
  sourcetime: string;
  fieldcode: string;
}

export interface AttendanceUploadResponse {
  success: boolean;
  message: string;
  data: AttendanceUploadData[];
}

export interface AttendanceUploadParams {
  tanggal?: string;
  tanggal_end?: string;
  fcba?: string;
  afdeling?: string;
  gangcode?: string;
}

export async function fetchAttendanceUpload(
  params: AttendanceUploadParams
): Promise<AttendanceUploadResponse> {
  const url = new URL("/api/attendance/upload", window.location.origin);

  // Add query parameters
  Object.keys(params).forEach((key) => {
    const value = params[key as keyof AttendanceUploadParams];
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  console.log("Fetching from:", url.toString());

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    credentials: "include",
  });

  console.log("Response status:", response.status);

  // Parse response JSON terlebih dahulu
  const data = await response.json();
  console.log("Response data:", data);

  // Jika tidak ok tapi bukan karena data kosong, baru throw error
  if (!response.ok) {
    // Jika success: true dengan data kosong (dari backend kita yang sudah dimodifikasi)
    // atau message berisi "tidak ditemukan", don't throw error
    if (data.success || (data.message && data.message.toLowerCase().includes("tidak ditemukan"))) {
      return data;
    }
    // Untuk error lainnya, tetap throw
    const errorText = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`Failed to fetch attendance upload data: ${response.status} - ${errorText}`);
  }

  return data;
}

export interface UpdateAttendanceResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export async function updateAttendanceRecord(
  recordId: number,
  updates: {
    mandays?: number;
    rate?: number;
    unit?: number;
    output?: number;
  }
): Promise<UpdateAttendanceResponse> {
  // Use local proxy endpoint
  const url = `/api/attendance/upload?id=${recordId}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(url, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update attendance record: ${response.status}`);
  }

  return response.json();
}

// Interface untuk insert attendance data
export interface InsertAttendanceItem {
  data: string[];
  gangcode: string;
  fddate: string;
  supervision_1?: string | null;
  supervision_2?: string | null;
  supervision_3?: string | null;
  supervision_4?: string | null;
  supervision_5?: string | null;
  employeecode: string;
  attendance: string;
  jobcode?: string | null;
  locationtype?: string | null;
  locationcode?: string | null;
  mandays?: number;
  othrs?: number;
  rate?: number;
  unit?: number;
  output?: number;
  reference?: string | null;
  remarks?: string;
  fcentry?: string;
  fcedit?: string | null;
  fcip?: string | null;
  fcba: string;
  lastupdate?: string;
  lasttime?: string;
  linenokey: number;
  overtime_hours?: number;
  type_overtime?: number;
  chargejob?: string | null;
  chargetype?: string | null;
  chargecode?: string | null;
  bucket?: string | null;
  spbno?: string | null;
  kg_janjang?: number;
  kg_brondolan?: number;
  rowstate?: string | null;
  document_classification?: number;
  basis_bm?: number;
  bjr?: number;
  documentno: number;
  sourcetime?: string;
  janjang?: number;
  generate?: string;
  generatetime?: string;
  fieldcode?: string | null;
}

export interface InsertAttendanceResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export async function insertAttendanceData(
  payload: { data: Record<string, unknown>[] }
): Promise<InsertAttendanceResponse> {
  const url = `/api/attendance/submit`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Failed to insert attendance records: ${response.status} - ${data.message || "Unknown error"}`
    );
  }

  return data;
}
