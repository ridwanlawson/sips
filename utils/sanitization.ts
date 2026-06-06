export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeNumericInput(input: string): string {
  return input.replace(/[^0-9.-]/g, '');
}

/**
 * Validates that a redirect path is safe to use.
 * Prevents Open Redirect vulnerabilities (CWE-601).
 * Safe paths must start with a single '/' and not be protocol-relative.
 */
export function isValidRedirect(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}
