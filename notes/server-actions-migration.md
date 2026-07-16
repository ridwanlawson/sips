# Server Actions Migration Plan

## Current Architecture

```
Browser (useQuery/useMutation fetch)
  → Next.js API Route (route.ts proxy)
    → Backend API (BACKEND_URL)
```

Each data operation requires:
1. A `route.ts` file handling auth, scoping, proxying
2. A client-side hook with `useQuery`/`useMutation` calling the route
3. Shared utility functions (`getTokenFromCookie`, `authHeaders`, `applyUserDataScope`)

## Routes Analyzed

### 1. `/api/master/sips-users` (GET — list users)
- **Route**: `app/api/master/sips-users/route.ts` (48 lines)
- **Hook**: `useUsersData.ts` — `useQuery` with `fetch('/api/master/sips-users?...')`
- **Pattern**: Applies `applyUserDataScope` for role-based filtering, proxies to backend
- **SA Benefit**: Medium — eliminates proxy but the hook still handles client cache

### 2. `/api/master/user/[id]/status` (PATCH — toggle user status)
- **Route**: `app/api/master/user/[id]/status/route.ts` (57 lines)
- **Hook**: `useUsersData.ts` — `useMutation` with `fetch('/api/master/user/${id}/status', { method: 'PATCH', ... })`
- **Pattern**: Validates token, parses body, validates status value, proxies PATCH to backend
- **SA Benefit**: High — mutation with simple input/output, perfect Server Action candidate

### 3. `/api/master/sections` & `/api/master/gangs` (GET — cascading dropdown data)
- **Routes**: 53 and 42 lines respectively
- **Hook**: `useUsersData.ts` (and others) — `useQuery` with `fetchSections`/`fetchGangs`
- **Pattern**: Applies `applyUserDataScope`, filters allowed params, proxies to backend
- **SA Benefit**: Medium — eliminates proxy, but these are read-only and benefit from TanStack caching

## Recommended Migration Order

### Phase 1: Mutations (High Value, Low Risk)
Replace write operations with Server Actions first:

| Route | Action | Priority |
|---|---|---|
| `user/[id]/status` (PATCH) | Toggle user active/inactive | P0 |
| `auth/register` (POST) | Register new user | P0 |
| Attendance POST/PUT | Create/update attendance record | P1 |
| Harvest POST/PUT | Create/update harvest record | P1 |
| Transport POST/PUT | Create/update transport record | P1 |

**Pattern**: Define Server Action in `lib/actions/` that:
1. Reads auth token from `cookies()` (server-side)
2. Validates input with Zod
3. Calls `BACKEND_URL` directly
4. Returns `{ ok, data, error }`

On the client, replace `useMutation` fetch calls with `startTransition` + Server Action invocation.

### Phase 2: Read Operations (Review)
For read queries, evaluate trade-offs:

| Route | Approach | Rationale |
|---|---|---|
| `sips-users` (GET) | Keep `useQuery` + route.ts | Cache invalidation, pagination, stale-while-revalidate |
| `sections`, `gangs` (GET) | Keep `useQuery` + route.ts | Cascading dropdowns benefit from cache |
| `business-units` (GET) | Keep `useQuery` + route.ts | Used across multiple views, cache shared |

Read-heavy routes should keep the current `useQuery` + route.ts pattern because:
- TanStack Query provides caching, deduplication, and background refetching
- Server Actions don't replace client-side cache management
- The route.ts proxy is thin (~30-50 lines) and handles auth consistently

## Migration Pattern Example

```typescript
// lib/actions/user.ts
'use server';

import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/utils/auth/backendConfig';

export async function toggleUserStatus(id: number, status: 'Y' | 'N') {
  const jar = await cookies();
  const token = jar.get('auth_token')?.value;
  if (!token) return { ok: false, error: 'Unauthenticated' };

  const res = await fetch(`${BACKEND_URL}/api/user/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: 'Failed to update status' };
  return { ok: true, data };
}
```

```typescript
// Client usage in hook
import { toggleUserStatus } from '@/lib/actions/user';

const statusMutation = useMutation({
  mutationFn: ({ id, status }: { id: number; status: 'Y' | 'N' }) =>
    toggleUserStatus(id, status),
  onSuccess: () => { /* invalidate queries */ },
});
```

## Benefits
- **~50 lines** of route.ts per mutation eliminated
- Input validation moved to Zod schemas shared between client/server
- No `csrf_token` dance needed (Server Actions use CSRF-free POST by default)
- Server Action logic is directly testable without mocking Next.js route handler

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Server Actions run on every request (no caching) | Keep `useQuery` for reads; only migrate mutations |
| Error handling differs from route.ts pattern | Wrap actions in try/catch, return consistent `{ ok, data, error }` shape |
| Large FormData mutations (image uploads) | Handle via route.ts initially; migrate after proving pattern on simple cases |
