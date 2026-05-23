# SIPS Mobile Web

SIPS Mobile Web is a Next.js application for operational attendance, harvest, transport, LHM, and approval workflows. It uses server-side API route proxies, cookie-based authentication, role-aware navigation, and dashboard views for operational monitoring.

## Tech Stack

- Next.js App Router with TypeScript
- React 19
- Tailwind CSS and DaisyUI
- TanStack Query
- next-intl
- Vitest
- ESLint and Prettier

## Active Features

- Dashboard analytics
- Attendance data monitoring
- Harvest data monitoring
- Transport data monitoring
- LHM reports
- LHM approval
- User authentication, logout, force logout, and change password
- Image proxy support for backend-hosted media
- English and Indonesian translations

## Project Structure

```text
app/
  (views)/
    approval/          LHM approval views
    attendance/        Attendance views
    change-password/   Password management
    dashboard/         Analytics dashboard
    harvest/           Harvest views
    lhm/               LHM views
    pengangkutan/      Transport views
  api/                 Server-side API proxies
  components/          Shared React components
  types/               Shared application types
config/                Shared configuration
hooks/                 React hooks
i18n/                  next-intl routing and request setup
lib/                   Constants, validation, and shared library utilities
messages/              Locale message files
utils/                 Client and server utilities
```

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Required environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url
BACKEND_URL=http://your-backend-url
ABSENSI_BASE=http://your-backend-url/api/apps/absensis
```

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:coverage
npm run format:check
```

## Architecture

```text
Browser
  |
  | cookies, locale, UI requests
  v
Next.js App Router
  |
  | server-side route handlers proxy backend requests
  v
Backend API
  |
  | operational data, auth, media
  v
Data services
```

The middleware handles public-route redirects, locale defaults, authentication checks, and LHM approval role protection. API handlers should keep backend credentials and server-only behavior on the server side.

## Troubleshooting

- `Missing backend URL`: set `NEXT_PUBLIC_BACKEND_URL` or `BACKEND_URL` in `.env.local`.
- Login redirects back to `/`: confirm the backend login response sets the expected auth cookies.
- Backend images do not render: confirm `BACKEND_URL` is configured and reachable.
- PowerShell blocks `npm`: run commands through `npm.cmd`.
- Tests fail with browser globals missing: confirm Vitest is using the configured `jsdom` environment.

## Quality Standards

- Keep shared constants in `lib/constants.ts`.
- Use shared types from `app/types`.
- Use centralized error helpers for route-handler failures.
- Keep comments in English.
- Run lint, tests, and format checks before opening a PR.
