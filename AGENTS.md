# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and UI. ETL routes at `app/api/etl/{woo|stripe|meta|rollup}/route.ts`.
- `src/`: shared code (`src/lib/db.ts`, `src/kpis/*`, `src/components/*`).
- `prisma/`: `schema.prisma` (Customer, AdSpend, ShippingCost, CouponUsage) and `seed.ts`.
- `tests/`: `unit/` (Vitest) and optional `e2e/` (Playwright).
- `public/`: static assets; `docs/`: architecture notes and runbooks.

## Build, Test, and Development Commands
- Dev server: `pnpm dev` (Next.js with hot reload).
- Build: `pnpm build`; start: `pnpm start`.
- Tests: `pnpm test` (Vitest) and coverage: `pnpm test -- --coverage`.
- Lint/format: `pnpm lint` and `pnpm format` (ESLint + Prettier + Tailwind plugin).
- DB: `pnpm prisma migrate dev --name <msg>`; generate: `pnpm prisma generate`; seed: `pnpm db:seed`.

## Coding Style & Naming Conventions
- TypeScript everywhere; 2-space indent; max line ~100 chars.
- Files: components `PascalCase.tsx`; utilities `kebab-case.ts`; API routes `route.ts`.
- Prisma: models `PascalCase`, fields `camelCase`; DB tables auto-snake by provider.
- React: functional components, hooks prefix `use*`; colocate component styles and tests.

## Testing Guidelines
- Unit tests: Vitest, name `*.spec.ts`/`*.spec.tsx` near source or under `tests/unit/`.
- E2E (optional): Playwright in `tests/e2e/` with basic dashboard flows.
- Coverage: target ≥85% on changed lines; include KPI math and ETL transforms.

## Commit & Pull Request Guidelines
- Conventional Commits, e.g. `feat(kpi): add repeat-rate tile`, `fix(etl): handle partial refunds`.
- Keep commits small and scoped (`etl`, `kpi`, `db`, `ui`, `docs`, `tests`).
- PRs: description, linked issues, validation steps, and screenshots/GIFs for dashboard changes.

## Security & Configuration Tips
- Env vars: `DATABASE_URL`, `NEXT_PUBLIC_*` (public), `VERCEL_CRON_SECRET` for ETL routes.
- No secrets in repo; use Vercel/Supabase env management. Provide `.env.example`.
- Nightly ETL via Vercel Cron; guard routes by secret header; log minimal PII.
