# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start the database (required first)
```bash
docker compose up -d
```

### Backend (port 4000)
```bash
cd backend
npm install
npm run db:seed       # seed categories + admin user (admin@local.dev / admin123)
npm run dev           # uses tsx watch
npm run build         # tsc compile to dist/
npm run db:generate   # generate Drizzle migrations from schema changes
npm run db:migrate    # run pending migrations
npm run db:studio     # open Drizzle Studio
```

### Frontend (port 3000)
```bash
cd frontend
npm install --legacy-peer-deps   # required due to react-leaflet peer dep
npm run dev
npm run build
npm run lint
```

## Architecture

### Backend (`/backend/src`)

Fastify server with a layered architecture: `routes → services → db`.

- **`server.ts`** — Fastify app bootstrap, plugin registration (CORS, multipart, static files), route prefix registration, `/upload` endpoint, graceful shutdown
- **`routes/`** — Thin route handlers: parse/validate input with Zod `.safeParse()`, call service layer, return `{ success, data }` or `{ error, message, statusCode }`
- **`services/`** — All business logic and DB queries using Drizzle ORM
- **`db/schema.ts`** — Single source of truth for all table definitions, enums, and inferred TypeScript types
- **`db/index.ts`** — Exports `db` (Drizzle instance) and `pool` (pg Pool)
- **`middleware/auth.middleware.ts`** — Exports `authenticate`, `requireModerator`, `requireAdmin` as Fastify `preHandler` hooks; attaches `request.user: TokenPayload` when valid
- **`schemas/`** — Zod schemas only (no business logic); types are inferred with `z.infer<>`
- **`utils/jwt.ts`** — `generateToken` / `verifyToken` using `jsonwebtoken` (not `@fastify/jwt`)

**API response format:**
- Success: `{ success: true, data: T, message?: string }`
- List: `{ success: true, data: T[], pagination: { total, limit, offset } }`
- Error: `{ error: string, message: string, statusCode: number }`

**Authorization rules:**
- Public: `GET /reports` (verified only), `GET /reports/:id`, `GET /categories`
- Authenticated: `POST /reports`, `POST /reports/:id/flag`, user profile endpoints
- Moderator/Admin: verify, reject reports; see all statuses on `GET /reports`
- Admin only: `DELETE /reports/:id`, category management

### Frontend (`/frontend`)

Next.js 14 App Router. All pages are in `app/`, shared components in `components/`.

**Critical constraint:** Leaflet requires `window` — all map components (`MapView`, `LocationPicker`, `CrimeMarker`, `MapFilters`) must be imported with `dynamic(..., { ssr: false })`.

- **`lib/api.ts`** — Single axios instance with base URL `NEXT_PUBLIC_API_URL`. Interceptors: attach Bearer token from localStorage on requests, redirect to `/login` on 401. All API types (`User`, `Report`, `Category`, etc.) are defined here.
- **`lib/hooks/useAuth.ts`** — Client-side auth state; reads from localStorage on mount. `login()` and `signup()` store token + user to localStorage.
- **`app/layout.tsx`** — Imports `leaflet/dist/leaflet.css` globally (required for map tiles to render)
- **`components/forms/ReportForm.tsx`** — Multi-step form (location → details → review). Uploads photos first via `/upload`, then creates report with returned paths.

### Database

PostgreSQL with PostGIS (`postgis/postgis:15-3.3`). The `location` geography column is managed via raw SQL (`ST_SetSRID`, `ST_MakePoint`) rather than Drizzle types, since Drizzle lacks native PostGIS support. Bounding box queries use decimal comparisons on `latitude`/`longitude` columns rather than PostGIS for simplicity.

Tables: `users`, `crime_categories`, `crime_reports`, `report_flags`.

### Environment

- **`backend/.env`** — `DATABASE_URL`, `JWT_SECRET`, `PORT=4000`, `UPLOAD_DIR=./uploads`, `ALLOWED_ORIGINS`
- **`frontend/.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:4000`, default map center/zoom

## Key Constraints

- `next.config.mjs` must stay as `.mjs` — Next.js 14.2.4 does not support `.ts` config files
- Use `npm install --legacy-peer-deps` in the frontend (react-leaflet peer dep conflict)
- Backend uses `tsx` (not `ts-node`) for development
- Drizzle migrations live in `backend/src/db/migrations/` — run `db:generate` after schema changes, then `db:migrate`
