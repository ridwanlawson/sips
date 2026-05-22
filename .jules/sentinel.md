# Sentinel's Journal - Security Learnings

## 2025-05-15 - [Sensitive Data Exposure in /api/auth/token]
**Vulnerability:** The `/api/auth/token` endpoint was returning the raw JWT authentication token to any authenticated user without verifying their role. This exposed the token to client-side scripts (CWE-312 / CWE-602).
**Learning:** Even if a token is stored in an `HttpOnly` cookie for general application use, creating a proxy endpoint that returns that token as JSON effectively nullifies the protection against XSS-based token theft for any user that can access the endpoint.
**Prevention:** Always implement server-side Role-Based Access Control (RBAC) on endpoints that expose sensitive credentials or tokens. Verify the user's role against a trusted backend service or secure session store rather than relying on client-provided info.
