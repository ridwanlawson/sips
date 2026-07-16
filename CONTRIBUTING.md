# Contributing

## Development Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set backend URLs.
3. Start the app with `npm run dev`.
4. Run `npm run lint`, `npm run test`, and `npm run format:check` before submitting changes.

## Code Style

- TypeScript is required for application code.
- Use **named exports** (no default exports) for consistency.
- Keep **comments to an absolute minimum**. Code should be self-documenting.
- Shared constants go in `lib/constants/`.
- Reusable domain types go in `types/domain.ts`.
- Use `QueryKeys` from `utils/queryKeys.ts` — never inline query key strings.
- Use Prettier for formatting and ESLint for static checks.
- Keep API proxy behavior server-side unless there is a clear client requirement.

## Adding New Features

Follow the **hook + service + types** pattern:

1. **Types** — Add domain types in `types/domain.ts` (e.g., `export type NewFeature = { ... }`).
2. **Service** — Create an API service in `utils/services/` (e.g., `newFeatureService.ts` with `fetchAll`, `create`, `update`, `delete`).
3. **Query Keys** — Add entries to `utils/queryKeys.ts` (e.g., `NEW_FEATURE: (filters) => ['new-feature', filters]`).
4. **Hook** — Create a data hook in `hooks/` using the service and query keys (e.g., `useNewFeatureData.ts`).
5. **View** — Compose the hook with shared UI components in `app/(views)/`.

## Commit Messages

Use concise, imperative commit messages:

```text
Add LHM approval error handling
Fix attendance filter date parsing
Update dashboard loading state
Refactor attendance service into utils/services/
```

## Pull Request Process

- Describe the problem and the implemented change.
- Include testing evidence (unit + E2E).
- Call out environment, migration, or deployment changes.
- Keep PRs focused; split unrelated refactors into separate changes.

## Testing Requirements

### Unit Tests (Vitest)
- Add or update Vitest tests for changed utilities and business logic.
- Run `npm run test` (or `npm run test:coverage`) to verify.

### E2E Tests (Playwright)
- E2E specs live in `e2e/specs/` (auth, attendance, harvest, transport, lhm, dashboard, users).
- Run all E2E tests with `npx playwright test`.
- Run with a single worker to avoid flakiness: `npx playwright test --workers=1`.
- Run with `--headed` to watch browser interactions during development.
- Run with `--debug` to use the Playwright inspector.
- Ensure the dev server is running before executing E2E tests.
- Add or update E2E specs when modifying feature workflows.

### Pre-Submission Checklist
```text
npm run lint
npm run test
npx playwright test --workers=1
npm run format:check
```
