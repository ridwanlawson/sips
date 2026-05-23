# Deployment

## Environment Variables

Set these values in the deployment environment:

```env
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url
BACKEND_URL=http://your-backend-url
ABSENSI_BASE=http://your-backend-url/api/apps/absensis
```

`NEXT_PUBLIC_BACKEND_URL` is available to client-side bundles. `BACKEND_URL` is used by server-side routes and configuration.

## Build Process

```bash
npm ci
npm run lint
npm run test
npm run build
```

## Node or VM Deployment

```bash
npm ci --omit=dev
npm run build
npm run start
```

Run the application behind HTTPS and a reverse proxy that forwards standard headers.

## Vercel Deployment

1. Connect the repository.
2. Configure the required environment variables.
3. Use the default Next.js build command.
4. Verify image proxy and backend API access after deployment.

## Container Deployment

1. Install dependencies with `npm ci`.
2. Build with `npm run build`.
3. Start with `npm run start`.
4. Expose the configured application port.

## Post-Deployment Checks

- Login succeeds and redirects to the dashboard.
- LHM approval access matches role requirements.
- Attendance, harvest, transport, and LHM API pages load data.
- Backend-hosted images render through the image proxy.
- Security and cache headers are present in responses.
