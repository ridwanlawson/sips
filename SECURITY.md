# Security Documentation — SIPS Mobile Web

> **Status:** Security Hardened
> **Last Updated:** 2026-06-10
> **Maintainer:** Security Team

---

## Security Checklist (Pre-Deployment)

### Implemented

- [x] **Rate Limiting** - Login & change-password endpoints
- [x] **CSRF Protection** - All forms require CSRF token
- [x] **Secure Cookies** - `httpOnly: true`, `secure: true`, `sameSite: strict`
- [x] **Session Timeout** - 8 hours expiry
- [x] **Input Validation** - Zod schema validation
- [x] **Password Complexity** - 8+ chars, uppercase, number, symbol
- [x] **Security Headers** - HSTS, X-XSS-Protection, X-Frame-Options, CSP
- [x] **Generic Error Messages** - Prevent information leakage
- [x] **localStorage Removed** - Prevent XSS data theft
- [x] **HTTPS Warning** - Console warning for non-HTTPS backend in production
- [x] **CORS Configuration** - Production-only, whitelist-based

### Backend Dependencies (Must be secured)

- [ ] **HTTPS Enforcement** - Backend MUST use HTTPS
- [ ] **Password Hashing** - Backend must hash passwords (bcrypt/scrypt/argon2)
- [ ] **JWT Validation** - Backend must validate tokens properly
- [ ] **Rate Limiting** - Backend should also have rate limiting
- [ ] **Input Sanitization** - Backend must sanitize all inputs (SQLi, XSS)

---

## Security Features

### 1. Rate Limiting
**File:** `lib/auth/rateLimiter.ts`  
**Purpose:** Prevent brute force attacks

| Endpoint | Limit | Duration |
|----------|-------|----------|
| `/api/auth/login` | 5 attempts | 60 seconds |
| `/api/change-password` | 3 attempts | 60 seconds |
| General API | 100 requests | 15 minutes |

**Environment Variables:**
```env
RATE_LIMIT_LOGIN_POINTS=5
RATE_LIMIT_LOGIN_DURATION=60
```

---

### 2. CSRF Protection
**File:** `lib/auth/csrf.ts`  
**Purpose:** Prevent Cross-Site Request Forgery

- CSRF token generated using `crypto.randomBytes(32)`
- Token stored in `httpOnly` cookie
- Validated using `crypto.timingSafeEqual()` (prevent timing attacks)
- Required in all `POST/PUT/DELETE` requests via `X-CSRF-Token` header

**Implementation:**
```typescript
// Middleware sets cookie automatically
// Client reads cookie and sends in header
const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
fetch('/api/auth/login', {
  headers: { 'X-CSRF-Token': csrfToken }
})
```

---

### 3. Secure Cookie Configuration
**All cookies use:**
```typescript
{
  httpOnly: true,      // Prevent JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // Prevent CSRF
  path: '/',
  expires: 8 hours      // Session timeout
}
```

**User info cookies are NOW httpOnly** (previously client-readable):
- `user_Kode`
- `user_Fcba`
- `user_Afdeling`
- `user_Gang`
- `user_FullName`
- `user_Level`
- `user_Position`
- `user_Photo`

---

### 4. Content Security Policy (CSP)
**File:** `next.config.ts`

```typescript
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://img.daisyui.com https:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
```

**Note:** `'unsafe-inline'` is required for DaisyUI. Consider migrating to non-inline styles.

---

### 5. Security Headers
**Applied in:** `next.config.ts` and `middleware.ts`

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disable dangerous APIs |
| `X-DNS-Prefetch-Control` | `on` | Control DNS prefetching |

---

### 6. Password Complexity
**File:** `app/api/change-password/route.ts` (if exists; logic may be in `lib/validations/`)

Password must contain:
- ✅ Minimum 8 characters
- ✅ Maximum 200 characters
- ✅ At least 1 uppercase letter (`[A-Z]`)
- ✅ At least 1 number (`[0-9]`)
- ✅ At least 1 special character (`!@#$%^&*()_+-=[]{};':"\|,.<>/?`)

**Error messages are specific** to help users create strong passwords.

---

### 7. HTTPS Backend Enforcement
**File:** `lib/utils/helpers.ts` (backed config logic)

```typescript
if (isProduction && backendUrl && !backendUrl.startsWith('https://')) {
  console.warn('⚠️ SECURITY WARNING: BACKEND_URL should use HTTPS in production');
}
```

**⚠️ PENGECUALIAN:**
- Di **development** (`NODE_ENV !== 'production'`), HTTP diizinkan
- Di **production**, warning muncul di console tapi aplikasi tetap berjalan
- **Rekomendasi:** Set `BACKEND_URL=https://...` di production

---

### 8. Input Sanitization
**Status:** Partial ✅

| Area | Status | Notes |
|------|--------|-------|
| Login form | ✅ | Zod validation |
| Change password | ✅ | Zod validation + complexity |
| Other forms | ⚠️ | **TODO: Tambahkan sanitization** |

**Rekomendasi:** Gunakan `DOMPurify` untuk sanitize HTML input:
```typescript
import DOMPurify from 'dompurify';
const cleanInput = DOMPurify.sanitize(userInput);
```

---

## Known Limitations & Future Improvements

### Current Limitations

1. **Backend Trust Assumption**
   - Frontend **100% trust** backend security
   - Jika backend bocor, frontend ikut terpengaruh
   - **Action:** Audit backend security

2. **HTTPS Backend Not Enforced**
   - Hanya warning, tidak error
   - **Action:** Ubah ke `throw new Error()` di production

3. **CSP `unsafe-inline`**
   - Diperlukan untuk DaisyUI
   - **Action:** Migrate to CSS-in-JS atau remove inline styles

4. **No 2FA**
   - Hanya password-based auth
   - **Action:** Implement TOTP (Google Authenticator)

5. **Rate Limiting In-Memory**
   - `rate-limiter-flexible` menggunakan memory storage
   - **Action:** Gunakan Redis untuk production

---

### Future Improvements

| Priority | Feature | Benefit |
|----------|---------|---------|
| High | **2FA (TOTP)** | Extra security layer |
| High | **Redis Rate Limiter** | Persistent rate limiting |
| Medium | **Input Sanitization (DOMPurify)** | Prevent XSS |
| Medium | **Security Logging** | Audit trail |
| Medium | **JWT Validation** | Client-side token validation |
| Low | **Password Strength Meter** | User feedback |
| Low | **Session Activity Tracking** | Detect suspicious activity |

---

## Security Testing

### Manual Tests

```bash
# 1. Test Rate Limiting
for i in {1..6}; do 
  curl -X POST http://localhost:3000/api/auth/login 
    -H "Content-Type: application/json" 
    -d '{"username":"test","password":"wrong"}'
done
# Expected: 5 requests succeed, 6th returns 429

# 2. Test CSRF Protection
# Remove CSRF token from request
curl -X POST http://localhost:3000/api/auth/login 
  -H "Content-Type: application/json" 
  -d '{"username":"test","password":"test"}'
# Expected: 403 Forbidden

# 3. Test Password Complexity
curl -X POST http://localhost:3000/api/change-password 
  -H "Content-Type: application/json" 
  -H "Authorization: Bearer YOUR_TOKEN" 
  -d '{"current_password":"old","new_password":"weak"}'
# Expected: 400 Bad Request (password complexity error)

# 4. Test Secure Headers
curl -I http://localhost:3000
# Expected: See HSTS, X-Frame-Options, CSP headers
```

### Automated Tests

```bash
# Run security audit
npm run security:audit

# Run with auto-fix
npm run security:audit-fix

# Lint code
npm run lint

# Run E2E tests (Playwright)
npx playwright test
```

---

## Security Configuration Reference

### Environment Variables

```env
# Required
BACKEND_URL=https://your-backend-api.com
NEXT_PUBLIC_SITE_URL=https://your-site-url

# Security
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (optional)
RATE_LIMIT_LOGIN_POINTS=5
RATE_LIMIT_LOGIN_DURATION=60
```

---

## Incident Response

### If Compromised

1. **Rotate all secrets**
   - Backend API keys
   - Database credentials
   - Session secrets

2. **Force password reset** for all users

3. **Revoke all active sessions**

4. **Audit logs** for suspicious activity

5. **Deploy fix** and monitor

### Reporting Vulnerabilities

If you find a security vulnerability:
1. **DO NOT** open a public GitHub issue
2. Email: [security@your-company.com](mailto:security@your-company.com)
3. Include: Steps to reproduce, impact assessment, suggested fix

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Rate Limiter Flexible](https://github.com/animir/node-rate-limiter-flexible)

---

**DISCLAIMER:** Security is an ongoing process. Regular audits and updates are required to maintain security posture.
