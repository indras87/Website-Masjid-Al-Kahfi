# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Run dev server:** `npm run dev`
- **Setup/Seed Database:** `npm run db:setup` (runs migrations and seeds database)
- **Run Docker:** `docker-compose up -d --build`

### Testing
- Refer to `test/` directory for any existing tests. (No specific test commands provided in README, rely on standard `npm test` if exists or manual testing).

## Architecture

- **Framework:** Next.js 15+ (App Router).
- **Structure:**
  - `app/(site)/`: Public-facing pages (Beranda, Berita, Galeri, dll).
  - `app/admin/`: Admin dashboard components and pages.
  - `lib/db/`: Database schema, Drizzle ORM configuration, and seed scripts.
  - `components/`: Reusable UI components.
- **Data Layer:** Drizzle ORM with PostgreSQL. All data operations use Drizzle.
- **Styling:** Tailwind CSS (v4).

## Development Notes
- Always use `.env.local` for local environment configuration.
- Database access is via port `5433` if using the provided `docker-compose.yml`.
