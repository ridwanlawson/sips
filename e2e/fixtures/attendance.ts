export const ATTENDANCE_LIST = {
  ok: true,
  data: [
    {
      id: 'ATT001',
      tanggal: '2026-07-01 07:30:00',
      attendance: 'KJ',
      total_late_time: '00:00',
      go_home_early: null,
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      mandor: 'Budi Santoso',
      foto: null,
    },
    {
      id: 'ATT002',
      tanggal: '2026-07-01 08:15:00',
      attendance: 'WH',
      total_late_time: '00:45',
      go_home_early: null,
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      mandor: 'Budi Santoso',
      foto: null,
    },
    {
      id: 'ATT003',
      tanggal: '2026-07-02 06:50:00',
      attendance: 'KJ',
      total_late_time: null,
      go_home_early: '01:30',
      fcba: 'FCBA02',
      section: 'SEC03',
      gang: 'GANG03',
      mandor: 'Ahmad Hidayat',
      foto: null,
    },
  ],
};

export const ATTENDANCE_DETAIL = {
  ok: true,
  data: {
    id: 'ATT001',
    tanggal: '2026-07-01 07:30:00',
    attendance: 'KJ',
    total_late_time: '00:00',
    go_home_early: null,
    fcba: 'FCBA01',
    section: 'SEC01',
    gang: 'GANG01',
    mandor_kode: 'KRY001',
    mandor: 'Budi Santoso',
    foto: null,
    keterangan: 'Hadir tepat waktu',
  },
};

export const ATTENDANCE_CREATE_SUCCESS = {
  ok: true,
  data: { id: 'ATT004' },
};

export const ATTENDANCE_UPDATE_SUCCESS = {
  ok: true,
  data: { id: 'ATT001' },
};

export const ATTENDANCE_DELETE_SUCCESS = {
  ok: true,
  message: 'Deleted successfully',
};

export const ATTENDANCE_UPLOAD_SUCCESS = {
  ok: true,
  message: 'Upload successful',
};

export const ATTENDANCE_EMPTY = {
  ok: true,
  data: [],
};

export const ATTENDANCE_ERROR = {
  ok: false,
  error: 'Failed to fetch attendance data',
};

export const ATTENDANCE_FILTERED = {
  ok: true,
  data: [
    {
      id: 'ATT001',
      tanggal: '2026-07-01 07:30:00',
      attendance: 'KJ',
      total_late_time: '00:00',
      go_home_early: null,
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      mandor: 'Budi Santoso',
      foto: null,
    },
  ],
};
