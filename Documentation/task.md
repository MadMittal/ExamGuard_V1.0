# ExamGuard Cloud — Sprint 0 Tasks

## Sprint 0: Foundation (Setup + Infrastructure)

- `[x]` 0.1 — Create Supabase migration SQL file (all tables, indexes, RLS, functions, seed)
- `[x]` 0.2 — Install dependencies (supabase-js, zod, lucide, sonner, date-fns, uuid)
- `[x]` 0.3 — Set up Supabase client (browser + server) in `lib/supabase/`
- `[x]` 0.4 — Create TypeScript type definitions + validation schemas + shared interfaces
- `[x]` 0.5 — Set up design system (globals.css with CSS custom properties, dark mode, animations)
- `[/]` 0.6 — Create reusable UI components — **3/5 done** (Button ✅, Card ✅, Input ✅, Badge ✅, Modal ✅)
- `[ ]` 0.7 — Set up page routing structure (`(student)/exam`, `(admin)/dashboard`, etc.)
- `[ ]` 0.8 — Configure Next.js middleware for auth redirects
- `[ ]` 0.9 — Update root layout.tsx with fonts, metadata, and providers
- `[ ]` 0.10 — Set up monitoring engine core (engine.ts, batcher.ts, scorer.ts)

## Files Created So Far

### Supabase / Backend
- `supabase/migrations/001_initial_schema.sql` — Full schema (8 tables, indexes, RLS, 4 functions)
- `supabase/seed.sql` — 34 default config settings
- `src/lib/supabase/types.ts` — Database type definitions + Supabase type map
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client + admin client

### Utilities
- `src/lib/utils/constants.ts` — Event metadata, thresholds, aliases, shortcuts
- `src/lib/utils/validation.ts` — Zod schemas for all API inputs
- `src/lib/utils/dates.ts` — Date formatting helpers

### Types
- `src/types/exam.ts` — Shared app interfaces (ExamInfo, ClientSettings, MonitoringState, etc.)

### Design System & UI
- `src/app/globals.css` — CSS custom properties, dark mode, animations, skeleton loading
- `src/components/ui/Button.tsx` — 4 variants, 3 sizes, loading state
- `src/components/ui/Card.tsx` — Card + CardHeader
- `src/components/ui/Input.tsx` — With label, error, helper text
- `src/components/ui/Badge.tsx` — 5 variants with optional dot
- `src/components/ui/Modal.tsx` — Native dialog, focus trap, overlay dismiss

### Config
- `.env.example` — Environment variables template

## To Resume
Say **"continue Sprint 0"** to pick up from task 0.7 (page routing).
Or say **"start Sprint 1"** to jump to building the student portal.
