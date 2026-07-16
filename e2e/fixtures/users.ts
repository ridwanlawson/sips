export const USER_LIST = {
  ok: true,
  data: [
    { id: 1, username: 'admin', fullname: 'Administrator', email: 'admin@skj.my.id', phone: '081234567890', fcba: 'FCBA01', afdeling: 'AFD01', gangcode: 'GANG01', level: 'ADM', position: 'EM', idkaryawan: 'KRY001', status: 'active' },
    { id: 2, username: 'mandor1', fullname: 'Budi Santoso', email: 'budi@skj.my.id', phone: '081234567891', fcba: 'FCBA01', afdeling: 'AFD01', gangcode: 'GANG01', level: 'MD1', position: 'MANDOR1', idkaryawan: 'KRY002', status: 'active' },
    { id: 3, username: 'kerani', fullname: 'Siti Rahayu', email: 'siti@skj.my.id', phone: null, fcba: 'FCBA01', afdeling: 'AFD02', gangcode: 'GANG02', level: 'KRT', position: 'KR.TRANS', idkaryawan: 'KRY003', status: 'inactive' },
  ],
};

export const USER_CREATE_SUCCESS = {
  ok: true,
  data: { id: 4 },
};

export const USER_UPDATE_SUCCESS = {
  ok: true,
  message: 'User updated successfully',
};

export const USER_TOGGLE_SUCCESS = {
  ok: true,
  message: 'User status changed',
};

export const USER_BULK_SUCCESS = {
  ok: true,
  data: { created: 2 },
};

export const USER_EMPTY = {
  ok: true,
  data: [],
};

export const USER_ERROR = {
  ok: false,
  error: 'Failed to fetch users',
};

export const USER_FILTERED = {
  ok: true,
  data: [
    { id: 1, username: 'admin', fullname: 'Administrator', email: 'admin@skj.my.id', phone: '081234567890', fcba: 'FCBA01', afdeling: 'AFD01', gangcode: 'GANG01', level: 'ADM', position: 'EM', idkaryawan: 'KRY001', status: 'active' },
  ],
};
