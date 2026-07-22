/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCascadingPicker } from './useCascadingPicker';
import { useQuery } from '@tanstack/react-query';

// Mock TanStack React Query's useQuery
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock master data services to prevent real fetch queries during tests
vi.mock('@/utils/services/masterDataService', () => ({
  fetchSections: vi.fn(),
  fetchGangs: vi.fn(),
}));
vi.mock('@/utils/services/businessUnitService', () => ({
  fetchBusinessUnits: vi.fn(),
}));

describe('useCascadingPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly maps and deduplicates businessUnits into fcbaOptions', () => {
    vi.mocked(useQuery).mockImplementation((options: any) => {
      const queryKey = options.queryKey;
      if (queryKey[0] === 'business-units') {
        return {
          data: [
            { fcba: 'BU01', fccode: 'BU01' },
            { fcba: 'BU01', fccode: 'BU01' }, // Duplicate code, should be filtered
            { fcba: 'BU02', fccode: 'BU02' },
            { fcba: '', fccode: '' }, // Invalid code, should be ignored
          ],
          isLoading: false,
        } as any;
      }
      return { data: undefined, isLoading: false } as any;
    });

    const { result } = renderHook(() => useCascadingPicker());

    expect(result.current.fcbaOptions).toEqual([
      { value: 'BU01', label: 'BU01' },
      { value: 'BU02', label: 'BU02' },
    ]);
  });

  it('correctly formats and returns sectionOptions', () => {
    vi.mocked(useQuery).mockImplementation((options: any) => {
      const queryKey = options.queryKey;
      if (queryKey[0] === 'sections') {
        return {
          data: [
            { fccode: 'SEC01', fcname: 'Section One' },
            { fccode: 'SEC02', fcname: 'SEC02' }, // fcname is same as fccode, format is simplified
          ],
          isLoading: false,
        } as any;
      }
      return { data: undefined, isLoading: false } as any;
    });

    const { result } = renderHook(() => useCascadingPicker('BU01'));

    expect(result.current.sectionOptions).toEqual([
      { value: 'SEC01', label: 'SEC01 - Section One' },
      { value: 'SEC02', label: 'SEC02' },
    ]);
  });

  it('correctly formats gangOptions and deduplicates/filters kemandoranOptions', () => {
    vi.mocked(useQuery).mockImplementation((options: any) => {
      const queryKey = options.queryKey;
      if (queryKey[0] === 'gangs') {
        return {
          data: [
            { fccode: 'G01', fcname: 'Gang One', kemandoran: 'MD01' },
            { fccode: 'G02', fcname: 'G02', kemandoran: 'MD01' }, // Duplicate kemandoran MD01
            { fccode: 'G03', fcname: 'Gang Three', kemandoran: 'MD02' },
            { fccode: 'G04', fcname: 'Gang Four', kemandoran: 'OTHER' }, // Does not start with MD
          ],
          isLoading: false,
        } as any;
      }
      return { data: undefined, isLoading: false } as any;
    });

    const { result } = renderHook(() => useCascadingPicker('BU01', 'SEC01'));

    expect(result.current.gangOptions).toEqual([
      { value: 'G01', label: 'G01 - Gang One' },
      { value: 'G02', label: 'G02' },
      { value: 'G03', label: 'G03 - Gang Three' },
      { value: 'G04', label: 'G04 - Gang Four' },
    ]);

    expect(result.current.kemandoranOptions).toEqual([
      { value: 'MD01', label: 'MD01' },
      { value: 'MD02', label: 'MD02' },
    ]);
  });
});
