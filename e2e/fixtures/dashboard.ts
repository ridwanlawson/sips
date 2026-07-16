export const DASHBOARD_STATS = {
  ok: true,
  data: {
    harvest: {
      total: 2700,
      panen_jjg: 180,
      approved: 2,
      planned: 1,
    },
    transport: {
      total: 8000,
      jjg: 320,
      approved: 1,
      planned: 1,
    },
    attendance: {
      hadir: 10,
      tepat_waktu: 7,
      telat: 2,
      pulang_awal: 1,
    },
  },
};

export const DASHBOARD_ATTENDANCE_DETAIL = {
  ok: true,
  data: {
    perHari: [
      { tanggal: '2026-07-01', hadir: 3, tepat_waktu: 2, telat: 1, pulang_awal: 0, alpha: 0 },
      { tanggal: '2026-07-02', hadir: 3, tepat_waktu: 2, telat: 0, pulang_awal: 1, alpha: 0 },
    ],
    perBaris: [
      { tanggal: '2026-07-01', kode: 'KRY001', status: 'TELAT', telat: '00:15', pulang_awal: null },
      { tanggal: '2026-07-01', kode: 'KRY002', status: 'HADIR', telat: null, pulang_awal: null },
    ],
  },
};

export const DASHBOARD_CHARTS = {
  ok: true,
  data: {
    komposisi: [
      { name: 'TEPAT WAKTU', value: 70, color: '#22c55e' },
      { name: 'TELAT', value: 15, color: '#eab308' },
      { name: 'PULANG AWAL', value: 10, color: '#f97316' },
      { name: 'ALPHA', value: 5, color: '#ef4444' },
    ],
    ringkasan: [
      { bulan: 'Jan', hadir: 85, telat: 10, alpha: 5 },
      { bulan: 'Feb', hadir: 90, telat: 5, alpha: 5 },
    ],
    tren: [
      { tanggal: '2026-07-01', total: 50, hadir: 45, persentase: 90 },
      { tanggal: '2026-07-02', total: 50, hadir: 48, persentase: 96 },
    ],
  },
};

export const DASHBOARD_EMPTY = {
  ok: true,
  data: {
    harvest: { total: 0, panen_jjg: 0, approved: 0, planned: 0 },
    transport: { total: 0, jjg: 0, approved: 0, planned: 0 },
    attendance: { hadir: 0, tepat_waktu: 0, telat: 0, pulang_awal: 0 },
  },
};

export const DASHBOARD_ERROR = {
  ok: false,
  error: 'Failed to load dashboard',
};

export const DASHBOARD_FILTERED = {
  ok: true,
  data: {
    harvest: { total: 1500, panen_jjg: 100, approved: 1, planned: 1 },
    transport: { total: 5000, jjg: 200, approved: 1, planned: 0 },
    attendance: { hadir: 5, tepat_waktu: 4, telat: 1, pulang_awal: 0 },
  },
};
