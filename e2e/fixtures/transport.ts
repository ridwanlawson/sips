export const TRANSPORT_LIST = {
  ok: true,
  data: [
    {
      id: 'TRP001',
      nodokumen: 'TR-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      status_pengangkutan: 'Approved',
      type_pengangkutan: 'Panen',
      nopol: 'B 1234 ABC',
      output: 5000,
      janjang: 200,
    },
    {
      id: 'TRP002',
      nodokumen: 'TR-002',
      tanggal: '2026-07-02',
      fcba: 'FCBA01',
      section: 'SEC02',
      gang: 'GANG02',
      status_pengangkutan: 'Planned',
      type_pengangkutan: 'Pupuk',
      nopol: 'B 5678 DEF',
      output: 3000,
      janjang: 120,
    },
  ],
};

export const TRANSPORT_CREATE_SUCCESS = {
  ok: true,
  data: { id: 'TRP003' },
};

export const TRANSPORT_UPDATE_SUCCESS = {
  ok: true,
  data: { id: 'TRP001' },
};

export const TRANSPORT_DELETE_SUCCESS = {
  ok: true,
  message: 'Deleted successfully',
};

export const TRANSPORT_EMPTY = {
  ok: true,
  data: [],
};

export const TRANSPORT_ERROR = {
  ok: false,
  error: 'Failed to fetch transport data',
};

export const TRANSPORT_FILTERED = {
  ok: true,
  data: [
    {
      id: 'TRP001',
      nodokumen: 'TR-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      status_pengangkutan: 'Approved',
      type_pengangkutan: 'Panen',
      nopol: 'B 1234 ABC',
      output: 5000,
      janjang: 200,
    },
  ],
};
