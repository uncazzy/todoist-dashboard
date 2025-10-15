# Repository Guidelines

## Project Structure & Module Organization
- Next.js (pages router) with TypeScript and Tailwind.
- Key folders:
  - `pages/` route entries (e.g., `pages/index.tsx`, `pages/sign-in.tsx`).
  - `components/` React components in PascalCase (e.g., `Dashboard.tsx`).
  - `utils/` pure helpers in camelCase (e.g., `calculateLeadTimeStats.ts`).
  - `hooks/` React hooks prefixed with `use` (e.g., `useDashboardData.ts`).
  - `styles/` global, print, and export CSS.
  - `types/` shared TypeScript types (e.g., `next-auth.d.ts`).
  - `test/` data and scripts for local experimentation (not a JS test runner).

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server on `http://localhost:3000`.
- `npm run build` — Production build via Next.js.
- `npm start` — Run the compiled production server.
- `npm run lint` — Lint with `next/core-web-vitals` rules.

## Coding Style & Naming Conventions
- Language: TypeScript. Prefer explicit types on public APIs.
- Components: PascalCase files in `components/` (`ProjectVelocity.tsx`).
- Utilities: camelCase in `utils/` (`exportService.ts`).
- Hooks: `useX.ts` in `hooks/`.
- Pages: route files in `pages/` using simple or kebab-case (`sign-in.tsx`).
- Formatting: follow ESLint; 2-space indentation; avoid unused exports; keep helpers pure.
- Styling: prefer Tailwind classes and `styles/globals.css`; avoid inline styles when possible.

## Testing Guidelines
- No JavaScript test runner is configured.
- For changes without tests, include manual QA steps and, where useful, small data samples under `test/`.
- Keep logic in `utils/` small and pure to enable easy unit testing.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject (e.g., "feat: add recurring task insight").
- PRs must include: summary, rationale, screenshots/GIFs for UI, steps to verify, and any env/config changes.
- Ensure `npm run lint` and `npm run build` pass before requesting review.

## Security & Configuration
- Copy `.env.example` to `.env.local` and set: `TODOIST_CLIENT_ID`, `TODOIST_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- Do not commit secrets. Use environment variables for local and deployment.

## Agent-Specific Instructions
- Match existing patterns and file locations; do not introduce new dependencies unless necessary.
- Keep diffs minimal and focused; avoid unrelated refactors.
- Prefer adding utilities to `utils/` and components to `components/` with the conventions above.

