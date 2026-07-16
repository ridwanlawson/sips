export const BUSINESS_UNITS = {
  ok: true,
  data: [
    { fccode: 'FCBA01', fcname: 'Kebun Sejahtera', fcba: 'FCBA01' },
    { fccode: 'FCBA02', fcname: 'Kebun Makmur', fcba: 'FCBA02' },
  ],
};

export const SECTIONS = {
  ok: true,
  data: [
    { fccode: 'SEC01', fcname: 'Seksi A', fcba: 'FCBA01' },
    { fccode: 'SEC02', fcname: 'Seksi B', fcba: 'FCBA01' },
    { fccode: 'SEC03', fcname: 'Seksi C', fcba: 'FCBA02' },
  ],
};

export const GANGS = {
  ok: true,
  data: [
    { fccode: 'GANG01', fcname: 'Gang 1', afdeling: 'AFD01', fcba: 'FCBA01' },
    { fccode: 'GANG02', fcname: 'Gang 2', afdeling: 'AFD01', fcba: 'FCBA01' },
    { fccode: 'GANG03', fcname: 'Gang 3', afdeling: 'AFD02', fcba: 'FCBA01' },
  ],
};

export const KARYAWANS = {
  ok: true,
  data: [
    { fccode: 'KRY001', fcname: 'Budi Santoso', fcba: 'FCBA01', section: 'SEC01', gangcode: 'GANG01' },
    { fccode: 'KRY002', fcname: 'Siti Rahayu', fcba: 'FCBA01', section: 'SEC01', gangcode: 'GANG01' },
    { fccode: 'KRY003', fcname: 'Ahmad Hidayat', fcba: 'FCBA01', section: 'SEC02', gangcode: 'GANG02' },
    { fccode: 'KRY004', fcname: 'Dewi Lestari', fcba: 'FCBA02', section: 'SEC03', gangcode: 'GANG03' },
  ],
};

export const TPH = {
  ok: true,
  data: [
    { fccode: 'TPH01', fcname: 'TPH 1', fcba: 'FCBA01', section: 'SEC01' },
    { fccode: 'TPH02', fcname: 'TPH 2', fcba: 'FCBA01', section: 'SEC02' },
  ],
};

export const FIELDS = {
  ok: true,
  data: [
    { fccode: 'FLD01', fcname: 'Field 1', fcba: 'FCBA01' },
    { fccode: 'FLD02', fcname: 'Field 2', fcba: 'FCBA02' },
  ],
};
