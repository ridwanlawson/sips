export const LOGIN_SUCCESS = {
  ok: true,
  data: {
    user: {
      id: 1,
      username: 'testuser',
      fullname: 'Test User',
      level: 'ADMIN',
      fcba: 'FCBA01',
      afdeling: 'AFD01',
      section: 'SECTION01',
      gang: 'GANG01',
    },
    token: 'mock-token-12345',
  },
};

export const LOGIN_FAILURE = {
  ok: false,
  error: 'Invalid credentials',
};

export const LOGOUT_SUCCESS = { ok: true };

export const TOKEN_REFRESH = {
  ok: true,
  data: { token: 'mock-token-refreshed' },
};

export const USER_PROFILE = {
  ok: true,
  data: {
    id: 1,
    username: 'testuser',
    fullname: 'Test User',
    level: 'ADMIN',
    fcba: 'FCBA01',
    afdeling: 'AFD01',
    section: 'SECTION01',
    gang: 'GANG01',
  },
};

export const COOKIES_MAP: Record<string, string> = {
  auth_token: 'mock-valid-token',
  user_Level: 'ADMIN',
  SECURE_USER_LEVEL: 'ADMIN',
  user_Kode: 'USR001',
  user_Fcba: 'FCBA01',
  user_Afdeling: 'AFD01',
  user_Gang: 'GANG01',
  user_FullName: 'Test User',
  user_Photo: '',
  csrf_token: 'mock-csrf-token',
  NEXT_LOCALE: 'id',
};
