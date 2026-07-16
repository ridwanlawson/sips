import type { Page } from '@playwright/test';
import { LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT_SUCCESS, USER_PROFILE } from '../fixtures/auth';
import { BUSINESS_UNITS, SECTIONS, GANGS, KARYAWANS, TPH, FIELDS } from '../fixtures/master-data';
import { ATTENDANCE_LIST, ATTENDANCE_CREATE_SUCCESS, ATTENDANCE_UPDATE_SUCCESS, ATTENDANCE_DELETE_SUCCESS, ATTENDANCE_UPLOAD_SUCCESS } from '../fixtures/attendance';
import { HARVEST_LIST, HARVEST_CREATE_SUCCESS, HARVEST_UPDATE_SUCCESS, HARVEST_DELETE_SUCCESS, HARVEST_UPLOAD_SUCCESS } from '../fixtures/harvest';
import { TRANSPORT_LIST, TRANSPORT_CREATE_SUCCESS, TRANSPORT_UPDATE_SUCCESS, TRANSPORT_DELETE_SUCCESS } from '../fixtures/transport';
import { LHM_LIST, LHM_APPROVAL_LIST, LHM_CREATE_SUCCESS, LHM_APPROVE_SUCCESS, LHM_SIGNATURES } from '../fixtures/lhm';
import { USER_LIST, USER_CREATE_SUCCESS, USER_UPDATE_SUCCESS, USER_TOGGLE_SUCCESS, USER_BULK_SUCCESS } from '../fixtures/users';
import { DASHBOARD_STATS, DASHBOARD_ATTENDANCE_DETAIL, DASHBOARD_CHARTS } from '../fixtures/dashboard';

const api = (path: string) => new RegExp(`^http://localhost:3000${path}`);

export async function setupApiMocks(page: Page): Promise<void> {
  await page.route(api('/api/auth/login'), async (route) => {
    const postBody = route.request().postData();
    let isError = false;
    if (postBody) {
      try {
        const parsed = JSON.parse(postBody);
        if (parsed.username !== 'testuser' || parsed.password !== 'password123') {
          isError = true;
        }
      } catch { isError = true; }
    }
    if (isError) {
      await route.fulfill({ status: 401, json: LOGIN_FAILURE });
    } else {
      const reqPage = route.request().frame().page();
      await reqPage.context().addCookies([
        { name: 'auth_token', value: 'mock-jwt-token', domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict' },
        { name: 'log_id', value: '1', domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict' },
        { name: 'user_Level', value: 'ADMIN', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'SECURE_USER_LEVEL', value: 'ADMIN', domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict' },
        { name: 'user_Kode', value: 'USR001', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'user_Fcba', value: 'FCBA01', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'user_Afdeling', value: 'AFD01', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'user_Gang', value: 'GANG01', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'user_FullName', value: 'Test User', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'csrf_token', value: 'mock-csrf-token', domain: 'localhost', path: '/', sameSite: 'Strict' },
        { name: 'NEXT_LOCALE', value: 'id', domain: 'localhost', path: '/', sameSite: 'Strict' },
      ]);
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, json: LOGIN_SUCCESS });
    }
  });

  await page.route(api('/api/auth/logout'), async (route) => {
    await route.fulfill({ json: LOGOUT_SUCCESS });
  });

  await page.route(api('/api/auth/token'), async (route) => {
    await route.fulfill({ json: { ok: true, data: { token: 'mock-token-refreshed' } } });
  });

  await page.route(api('/api/auth/change-password'), async (route) => {
    await route.fulfill({ json: { ok: true, message: 'Password changed' } });
  });

  await page.route(api('/api/master/user/profile'), async (route) => {
    await route.fulfill({ json: USER_PROFILE });
  });

  await page.route(api('/api/master/business-units'), async (route) => {
    await route.fulfill({ json: BUSINESS_UNITS });
  });

  await page.route(api('/api/master/sections'), async (route) => {
    await route.fulfill({ json: SECTIONS });
  });

  await page.route(api('/api/master/gangs'), async (route) => {
    await route.fulfill({ json: GANGS });
  });

  await page.route(api('/api/master/karyawans'), async (route) => {
    await route.fulfill({ json: KARYAWANS });
  });

  await page.route(api('/api/master/tph'), async (route) => {
    await route.fulfill({ json: TPH });
  });

  await page.route(api('/api/master/fields'), async (route) => {
    await route.fulfill({ json: FIELDS });
  });

  // Dashboard
  await page.route(api('/api/dashboard'), async (route) => {
    await route.fulfill({ json: DASHBOARD_STATS });
  });

  await page.route(api('/api/dashboard/attendance-detail'), async (route) => {
    await route.fulfill({ json: DASHBOARD_ATTENDANCE_DETAIL });
  });

  await page.route(api('/api/dashboard/charts'), async (route) => {
    await route.fulfill({ json: DASHBOARD_CHARTS });
  });

  // Attendance
  await page.route(api('/api/attendance'), async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: ATTENDANCE_LIST });
    } else {
      await route.fulfill({ json: ATTENDANCE_CREATE_SUCCESS });
    }
  });

  await page.route(api('/api/attendance/submit'), async (route) => {
    await route.fulfill({ json: ATTENDANCE_CREATE_SUCCESS });
  });

  await page.route(api('/api/attendance/upload'), async (route) => {
    await route.fulfill({ json: ATTENDANCE_UPLOAD_SUCCESS });
  });

  await page.route(/^http:\/\/localhost:3000\/api\/attendance\//, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: ATTENDANCE_UPDATE_SUCCESS });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: ATTENDANCE_DELETE_SUCCESS });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ json: ATTENDANCE_CREATE_SUCCESS });
    } else {
      await route.fulfill({ json: ATTENDANCE_LIST });
    }
  });

  // Harvest
  await page.route(api('/api/harvest'), async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: HARVEST_LIST });
    } else {
      await route.fulfill({ json: HARVEST_CREATE_SUCCESS });
    }
  });

  await page.route(api('/api/harvest/submit'), async (route) => {
    await route.fulfill({ json: HARVEST_CREATE_SUCCESS });
  });

  await page.route(api('/api/harvest/upload'), async (route) => {
    await route.fulfill({ json: HARVEST_UPLOAD_SUCCESS });
  });

  await page.route(/^http:\/\/localhost:3000\/api\/harvest\//, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: HARVEST_UPDATE_SUCCESS });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: HARVEST_DELETE_SUCCESS });
    } else {
      await route.fulfill({ json: HARVEST_LIST });
    }
  });

  // Transport
  await page.route(/^http:\/\/localhost:3000\/api\/transport(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: TRANSPORT_LIST });
    } else {
      await route.fulfill({ json: TRANSPORT_CREATE_SUCCESS });
    }
  });

  await page.route(/^http:\/\/localhost:3000\/api\/transport\//, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: TRANSPORT_UPDATE_SUCCESS });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: TRANSPORT_DELETE_SUCCESS });
    } else {
      await route.fulfill({ json: TRANSPORT_LIST });
    }
  });

  // LHM
  await page.route(api('/api/lhm'), async (route) => {
    await route.fulfill({ json: LHM_LIST });
  });

  await page.route(api('/api/lhm/approval/submit'), async (route) => {
    await route.fulfill({ json: LHM_APPROVE_SUCCESS });
  });

  await page.route(api('/api/lhm/approval/signatures'), async (route) => {
    await route.fulfill({ json: LHM_SIGNATURES });
  });

  await page.route(api('/api/lhm/approval'), async (route) => {
    await route.fulfill({ json: LHM_APPROVAL_LIST });
  });

  await page.route(api('/api/lhm/open/submit'), async (route) => {
    await route.fulfill({ json: LHM_CREATE_SUCCESS });
  });

  // Users
  await page.route(api('/api/master/sips-users'), async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: USER_LIST });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, json: USER_CREATE_SUCCESS });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 200, json: USER_UPDATE_SUCCESS });
    } else {
      await route.fulfill({ status: 200, json: { ok: true, data: [] } });
    }
  });

  await page.route(api('/api/master/sips-users/bulk'), async (route) => {
    await route.fulfill({ status: 200, json: USER_BULK_SUCCESS });
  });

  await page.route(/^http:\/\/localhost:3000\/api\/master\/sips-users\/toggle/, async (route) => {
    await route.fulfill({ status: 200, json: USER_TOGGLE_SUCCESS });
  });

  // Master data kendaraan
  await page.route(api('/api/master/sips-kendaraan'), async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        ok: true,
        data: [
          { fccode: 'DT001', fcname: 'Dump Truck 001', registrationno: 'B 1234 ABC', vehiclegroupcode: 'DT' },
          { fccode: 'TR001', fcname: 'Traktor 001', registrationno: 'B 5678 DEF', vehiclegroupcode: 'TR' },
          { fccode: 'MB001', fcname: 'Mobil 001', registrationno: 'B 9012 GHI', vehiclegroupcode: 'MB' },
        ],
      },
    });
  });
}
