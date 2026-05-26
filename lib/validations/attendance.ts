import { z } from 'zod';

export const attendanceFilterSchema = z.object({
  tanggal: z.string().optional(),
  tanggal_end: z.string().optional(),
  fcba: z.string().optional(),
  afdeling: z.string().optional(),
  gang: z.string().optional(),
  employeecode: z.string().optional(),
});

export type AttendanceFilter = z.infer<typeof attendanceFilterSchema>;

export const attendanceRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    tanggal: z.string().nullable().optional(),
    kode_karyawan_mandor: z.string().nullable().optional(),
    kode_karyawan: z.string().nullable().optional(),
    time_in: z.string().nullable().optional(),
    time_out: z.string().nullable().optional(),
    location_in: z.string().nullable().optional(),
    location_out: z.string().nullable().optional(),
    pengancakan: z.string().nullable().optional(),
    total_late_time: z.string().nullable().optional(),
    go_home_early: z.string().nullable().optional(),
    attendance_type: z.string().nullable().optional(),
    attendance: z.string().nullable().optional(),
    exception_case: z.string().nullable().optional(),
    no_ba_exca: z.string().nullable().optional(),
    fcba: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    gang: z.string().nullable().optional(),
    fcba_destination: z.string().nullable().optional(),
    id_device: z.string().nullable().optional(),
    mac_address: z.string().nullable().optional(),
    images: z.string().nullable().optional(),
    status_attendance: z.string().nullable().optional(),
    mandays: z.union([z.string(), z.number()]).nullable().optional(),
    namakaryawan: z.string().nullable().optional(),
  })
  .passthrough();

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const attendanceApiResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(attendanceRecordSchema).optional().default([]),
  message: z.string().optional(),
});
