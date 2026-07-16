import { describe, it, expect } from 'vitest';
import { QueryKeys } from './queryKeys';

describe('QueryKeys', () => {
  it('ATTENDANCE returns correct array structure', () => {
    expect(QueryKeys.ATTENDANCE()).toEqual(['attendance']);
    expect(QueryKeys.ATTENDANCE({ status: 'active' })).toEqual(['attendance', { status: 'active' }]);
  });

  it('ATTENDANCE_DETAIL returns correct array structure', () => {
    expect(QueryKeys.ATTENDANCE_DETAIL('123')).toEqual(['attendance', '123']);
  });

  it('HARVEST returns correct array structure', () => {
    expect(QueryKeys.HARVEST()).toEqual(['harvest']);
    expect(QueryKeys.HARVEST({ year: '2024' })).toEqual(['harvest', { year: '2024' }]);
  });

  it('HARVEST_DOCUMENT_NO returns correct array structure', () => {
    expect(QueryKeys.HARVEST_DOCUMENT_NO()).toEqual(['harvest-document-no']);
    expect(QueryKeys.HARVEST_DOCUMENT_NO('2024-01-01', 'FCBA01')).toEqual(['harvest-document-no', '2024-01-01', 'FCBA01']);
  });

  it('TRANSPORT returns correct array structure', () => {
    expect(QueryKeys.TRANSPORT()).toEqual(['pengangkutan']);
    expect(QueryKeys.TRANSPORT({ vehicle: 'A' })).toEqual(['pengangkutan', { vehicle: 'A' }]);
  });

  it('USERS returns correct array structure', () => {
    expect(QueryKeys.USERS()).toEqual(['sips-users']);
    expect(QueryKeys.USERS({ role: 'admin' })).toEqual(['sips-users', { role: 'admin' }]);
  });

  it('BUSINESS_UNITS returns correct array', () => {
    expect(QueryKeys.BUSINESS_UNITS()).toEqual(['businessUnits']);
  });

  it('MASTER_SECTIONS returns correct array structure', () => {
    expect(QueryKeys.MASTER_SECTIONS()).toEqual(['masterSections']);
    expect(QueryKeys.MASTER_SECTIONS('FCBA01')).toEqual(['masterSections', 'FCBA01']);
  });

  it('MASTER_GANGS returns correct array structure', () => {
    expect(QueryKeys.MASTER_GANGS()).toEqual(['masterGangs']);
    expect(QueryKeys.MASTER_GANGS('FCBA01', 'S01')).toEqual(['masterGangs', 'FCBA01', 'S01']);
  });

  it('EMPLOYEES returns correct array structure', () => {
    expect(QueryKeys.EMPLOYEES()).toEqual(['employees']);
    expect(QueryKeys.EMPLOYEES('ADM', 'FCBA01', 'S01')).toEqual(['employees', 'ADM', 'FCBA01', 'S01']);
  });

  it('TRIPLETS returns correct array', () => {
    expect(QueryKeys.TRIPLETS()).toEqual(['triplets']);
  });

  it('USER_PROFILE returns correct array', () => {
    expect(QueryKeys.USER_PROFILE()).toEqual(['userProfile']);
  });

  it('HARVESTING returns correct array structure', () => {
    expect(QueryKeys.HARVESTING()).toEqual(['harvesting']);
    expect(QueryKeys.HARVESTING({ date: '2024-01-01' })).toEqual(['harvesting', { date: '2024-01-01' }]);
  });

  it('PENGANGKUTANS returns correct array structure', () => {
    expect(QueryKeys.PENGANGKUTANS()).toEqual(['pengangkutans']);
    expect(QueryKeys.PENGANGKUTANS({ area: 'A' })).toEqual(['pengangkutans', { area: 'A' }]);
  });

  it('KERANI_OPTIONS returns correct array structure', () => {
    expect(QueryKeys.KERANI_OPTIONS()).toEqual(['kerani-options']);
    expect(QueryKeys.KERANI_OPTIONS('FCBA01')).toEqual(['kerani-options', 'FCBA01']);
  });

  it('SIPS_KENDARAAN returns correct array', () => {
    expect(QueryKeys.SIPS_KENDARAAN()).toEqual(['sips-kendaraan']);
  });

  it('TPH_FIELDCODES returns correct array structure', () => {
    expect(QueryKeys.TPH_FIELDCODES()).toEqual(['tph-fieldcodes']);
    expect(QueryKeys.TPH_FIELDCODES('FCBA01', 'S01')).toEqual(['tph-fieldcodes', 'FCBA01', 'S01']);
  });

  it('TPH_DETAIL returns correct array structure', () => {
    expect(QueryKeys.TPH_DETAIL()).toEqual(['tph-detail']);
    expect(QueryKeys.TPH_DETAIL('FCBA01', 'S01', 'FC001')).toEqual(['tph-detail', 'FCBA01', 'S01', 'FC001']);
  });

  it('EMPLOYEES_ABSENSI returns correct array structure', () => {
    expect(QueryKeys.EMPLOYEES_ABSENSI()).toEqual(['employees-absensi']);
    expect(QueryKeys.EMPLOYEES_ABSENSI('2024-01-01')).toEqual(['employees-absensi', '2024-01-01']);
  });

  it('handles empty/undefined filters correctly', () => {
    expect(QueryKeys.ATTENDANCE(undefined)).toEqual(['attendance']);
    expect(QueryKeys.HARVEST(undefined)).toEqual(['harvest']);
    expect(QueryKeys.TRANSPORT(undefined)).toEqual(['pengangkutan']);
    expect(QueryKeys.USERS(undefined)).toEqual(['sips-users']);
    expect(QueryKeys.HARVESTING(undefined)).toEqual(['harvesting']);
    expect(QueryKeys.PENGANGKUTANS(undefined)).toEqual(['pengangkutans']);
  });

  it('handles empty string parameters correctly', () => {
    expect(QueryKeys.ATTENDANCE_DETAIL('')).toEqual(['attendance', '']);
    expect(QueryKeys.HARVEST_DOCUMENT_NO('')).toEqual(['harvest-document-no']);
    expect(QueryKeys.MASTER_SECTIONS('')).toEqual(['masterSections']);
    expect(QueryKeys.EMPLOYEES_ABSENSI('')).toEqual(['employees-absensi']);
  });
});
