export const HARVEST_LIST = {
  ok: true,
  data: [
    {
      id: 'HRV001',
      nodokumen: 'DOC-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      output: 1500,
      mentah: 200,
      busuk: 50,
      busuk2: 10,
      kecil: 30,
      parteno: 20,
      brondol: 15,
      janjang: 100,
    },
    {
      id: 'HRV002',
      nodokumen: 'DOC-002',
      tanggal: '2026-07-02',
      fcba: 'FCBA01',
      section: 'SEC02',
      gang: 'GANG02',
      output: 1200,
      mentah: 150,
      busuk: 30,
      busuk2: 5,
      kecil: 20,
      parteno: 10,
      brondol: 8,
      janjang: 80,
    },
  ],
};

export const HARVEST_CREATE_SUCCESS = {
  ok: true,
  data: { id: 'HRV003' },
};

export const HARVEST_UPDATE_SUCCESS = {
  ok: true,
  data: { id: 'HRV001' },
};

export const HARVEST_DELETE_SUCCESS = {
  ok: true,
  message: 'Deleted successfully',
};

export const HARVEST_UPLOAD_SUCCESS = {
  ok: true,
  message: 'Upload successful',
};

export const HARVEST_EMPTY = {
  ok: true,
  data: [],
};

export const HARVEST_ERROR = {
  ok: false,
  error: 'Failed to fetch harvest data',
};

export const HARVEST_FILTERED = {
  ok: true,
  data: [
    {
      id: 'HRV001',
      nodokumen: 'DOC-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      output: 1500,
      mentah: 200,
      busuk: 50,
      busuk2: 10,
      kecil: 30,
      parteno: 20,
      brondol: 15,
      janjang: 100,
    },
  ],
};
