export const LHM_LIST = {
  ok: true,
  data: [
    {
      id: 'LHM001',
      nodokumen: 'LHM-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      status: 'Open',
      total_janjang: 100,
      total_brondol: 15,
    },
    {
      id: 'LHM002',
      nodokumen: 'LHM-002',
      tanggal: '2026-07-02',
      fcba: 'FCBA01',
      section: 'SEC02',
      gang: 'GANG02',
      status: 'Approved',
      total_janjang: 80,
      total_brondol: 10,
    },
  ],
};

export const LHM_OPEN_LIST = {
  ok: true,
  data: [
    {
      id: 'LHM001',
      nodokumen: 'LHM-001',
      tanggal: '2026-07-01',
      fcba: 'FCBA01',
      section: 'SEC01',
      gang: 'GANG01',
      status: 'Open',
      total_janjang: 100,
      total_brondol: 15,
    },
  ],
};

export const LHM_APPROVAL_LIST = {
  ok: true,
  data: [
    {
      id: 'LHM002',
      nodokumen: 'LHM-002',
      tanggal: '2026-07-02',
      fcba: 'FCBA01',
      section: 'SEC02',
      gang: 'GANG02',
      status: 'Open',
      total_janjang: 80,
      total_brondol: 10,
    },
  ],
};

export const LHM_CREATE_SUCCESS = {
  ok: true,
  data: { id: 'LHM003' },
};

export const LHM_APPROVE_SUCCESS = {
  ok: true,
  message: 'Approved successfully',
};

export const LHM_SIGNATURES = {
  ok: true,
  data: [
    { name: 'Manager 1', jabatan: 'Manager', tanggal: '2026-07-02' },
    { name: 'Asisten 1', jabatan: 'Asisten', tanggal: '2026-07-01' },
  ],
};
