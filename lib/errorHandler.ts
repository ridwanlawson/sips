import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  console.error('[UNHANDLED_ERROR]', error);
  return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}
