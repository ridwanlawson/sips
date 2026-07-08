import { extractArray } from '@/lib/helpers';

export interface BusinessUnit {
  fccode: string;
  fcname: string;
  fccompanycode: string;
  fctype: string;
  central: string;
  // additional fields may exist; use unknown to avoid lint complaints
  [key: string]: unknown;
}

export interface FetchBusinessUnitParams {
  fccode?: string;
  fcname?: string;
  fccompanycode?: string;
  fctype?: string;
  central?: string;
}

/**
 * Retrieve master business unit data from the external SKJ API.
 * This mirrors the example snippet provided by the user but follows
 * the project's coding conventions (async/await, URL object, typed
 * parameters, and error handling).
 */
export async function fetchBusinessUnits(
  params: FetchBusinessUnitParams = {}
): Promise<BusinessUnit[]> {
  // build URL with search params for local API route
  const url = new URL('/api/business-units', window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    credentials: 'include', // include cookies for authentication
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch business units (${res.status}): ${txt}`);
  }

  const json = await res.json();
  return extractArray<BusinessUnit>(json);
}
