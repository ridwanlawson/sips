import { installSerwist } from '@serwist/sw';

const swManifest = (self as unknown as { __SW_MANIFEST: (string | { url: string; revision?: string })[] })
  .__SW_MANIFEST;

installSerwist({
  precacheEntries: swManifest,
  skipWaiting: true,
  clientsClaim: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        revision: '1',
        matcher: ({ event }: { event: { request: { mode: string } } }) => event.request.mode === 'navigate',
      },
    ],
  },
});
