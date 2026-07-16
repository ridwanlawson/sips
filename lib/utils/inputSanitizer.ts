/**
 * Input Sanitization Utilities
 * Melindungi dari XSS, SQL Injection, dan input berbahaya lainnya
 */

import { z } from 'zod';

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML/Script content
 * Menghapus script tags, event handlers, dan konten berbahaya
 */
export function sanitizeHtml(input: string): string {
  return (
    input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers (onclick, onerror, etc.)
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove HTML tags (kecuali yang diizinkan)
      .replace(/<[^>]*>/g, '')
      // Remove SQL injection patterns
      .replace(/'\s*OR\s+'/gi, '')
      .replace(/'\s*UNION\s+SELECT/gi, '')
      .replace(/--\s*/g, '')
      .replace(/;\s*DROP\s+TABLE/gi, '')
      .replace(/\bEXEC\s+\w+/gi, '')
      .replace(/\bINSERT\s+INTO/gi, '')
      .replace(/\bDELETE\s+FROM/gi, '')
  );
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = String(key)
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim();
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Sanitize filename untuk mencegah path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_\-\.\s]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .replace(/\/$/, '')
    .trim();
}

/**
 * Sanitize URL untuk mencegah XSS
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}

/**
 * Validate href attribute untuk mencegah javascript: XSS (CWE-79).
 * Mengizinkan http, https, mailto, tel, dan relative paths.
 */
export function isSafeHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const trimmed = href.trim().toLowerCase();
  return !dangerous.some(prefix => trimmed.startsWith(prefix));
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const num = Number(input.replace(/[^0-9\-.]/g, ''));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

// ============================================================================
// ZOD SCHEMAS UNTUK INPUT VALIDASI
// ============================================================================

// Schema untuk ID (harus numeric string)
export const idSchema = z.string().regex(/^[0-9]+$/, 'ID harus berupa angka');

// Schema untuk tanggal (format: YYYY-MM-DD)
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

// Schema untuk waktu (format: HH:mm:ss)
export const timeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format waktu harus HH:mm:ss');

// Schema untuk kode (huruf besar, angka, strip)
export const codeSchema = z
  .string()
  .regex(/^[A-Z0-9\-]+$/, 'Kode hanya boleh mengandung huruf besar, angka, dan strip');

// Schema untuk nama (tanpa karakter berbahaya)
export const nameSchema = z
  .string()
  .min(1, 'Nama tidak boleh kosong')
  .max(200, 'Nama maksimal 200 karakter')
  .regex(/^[a-zA-Z0-9\s\-\.,()']+$/, 'Nama mengandung karakter yang tidak diizinkan');

// Schema untuk deskripsi/keterangan
export const descriptionSchema = z
  .string()
  .min(1, 'Deskripsi tidak boleh kosong')
  .max(1000, 'Deskripsi maksimal 1000 karakter')
  .transform(sanitizeHtml);

// ============================================================================
// SCHEMAS UNTUK MODULE SPESIFIK
// ============================================================================

// Attendance Schema
export const attendanceSubmitSchema = z.object({
  data: z.array(
    z.object({
      tanggal: dateSchema,
      kode_karyawan: codeSchema,
      fcba: codeSchema.optional(),
      afdeling: codeSchema.optional(),
      gang: codeSchema.optional(),
      jenis_kehadiran: z.string().min(1),
      keterangan: descriptionSchema.optional(),
      jam_masuk: timeSchema.optional(),
      jam_keluar: timeSchema.optional(),
    })
  ),
});

// Harvest Schema
export const harvestSubmitSchema = z.object({
  data: z.array(
    z.object({
      tanggal: dateSchema,
      kode_karyawan: codeSchema,
      fcba: codeSchema.optional(),
      afdeling: codeSchema.optional(),
      gang: codeSchema.optional(),
      tph: codeSchema.optional(),
      jenis_panen: codeSchema,
      jumlah_janjang: z.number().min(0),
      bobot: z.number().min(0),
      keterangan: descriptionSchema.optional(),
    })
  ),
});

// Upload Schema (untuk file upload metadata)
export const uploadSubmitSchema = z.object({
  data: z.array(
    z.object({
      tanggal: dateSchema.optional(),
      kode_karyawan: codeSchema.optional(),
      fcba: codeSchema.optional(),
      afdeling: codeSchema.optional(),
      gang: codeSchema.optional(),
      file_name: z.string().transform(sanitizeFilename),
      file_size: z.number().min(0),
      file_type: z.string().max(100),
      keterangan: descriptionSchema.optional(),
    })
  ),
});

// LHM Data Schema (untuk Open & Approval LHM)
export const lhmSubmitSchema = z.object({
  data: z.array(
    z.object({
      ID: z.string(),
      ROWDATA: z.string(),
      HA: z.string().optional(),
      BASIS_HA: z.string().optional(),
      FCBA: z.string().optional(),
      FDDATE: z.string().optional(),
    })
  ),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate dan sanitize input dengan schema
 */
export function validateInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): {
  success: boolean;
  data?: T;
  error?: string;
  issues?: Array<{ code: string; path: (string | number)[]; message: string }>;
} {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0].message,
    issues: result.error.issues.map(issue => ({
      code:
        'code' in issue ? String((issue as unknown as Record<string, unknown>).code) : 'unknown',
      path: (issue.path || []).filter(
        (p): p is string | number => typeof p === 'string' || typeof p === 'number'
      ),
      message: issue.message,
    })),
  };
}

/**
 * Validate array input dengan schema
 */
export function validateArrayInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T[]; error?: string } {
  const result = z.array(schema).safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0].message,
  };
}


