# Kontak & Donasi CMS Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CMS-backed CRUD editing for the public `Kontak` and `Donasi / Infaq` sections.

**Architecture:** Use two singleton settings tables, one for contact data and one for donation data. Expose each table through a small `GET`/`PUT` API pair, then build a single admin page that edits both records. Public pages continue to render with fallback content when the database is empty.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, React, `motion`, `lucide-react`.

---

### Task 1: Add failing DB/API coverage

**Files:**
- Create: `app/api/kontak/route.test.ts`
- Create: `app/api/donasi/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

describe('kontak API', () => {
  it('returns a default empty contact shape', async () => {
    expect(true).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test app/api/kontak/route.test.ts`
Expected: fail because the test file is placeholder and the project has no implementation yet.

- [ ] **Step 3: Write minimal implementation**

Add a tiny test harness if needed, or replace the placeholder with a focused smoke test after the feature code exists.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test app/api/kontak/route.test.ts`
Expected: PASS once the API returns the correct default shape.

- [ ] **Step 5: Commit**

```bash
git add app/api/kontak/route.test.ts app/api/donasi/route.test.ts
git commit -m "test: cover contact and donation settings APIs"
```

### Task 2: Add singleton settings schema and APIs

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/seed.ts`
- Modify: `lib/db/index.ts`
- Create: `app/api/kontak/route.ts`
- Create: `app/api/donasi/route.ts`
- Create: `app/api/kontak/route.ts`
- Create: `app/api/donasi/route.ts`

- [ ] **Step 1: Add schema rows**
  - Add `kontak` and `donasi` singleton tables with `updated_at` timestamps.

- [ ] **Step 2: Seed default rows**
  - Insert one row for each table so fresh installs have working public content.

- [ ] **Step 3: Implement GET/PUT routes**
  - `GET` returns the single record or defaults.
  - `PUT` upserts the singleton record.

- [ ] **Step 4: Verify with `db:setup`**

Run: `npm run db:setup`
Expected: tables created and seed succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts lib/db/seed.ts app/api/kontak/route.ts app/api/donasi/route.ts
git commit -m "feat: add contact and donation settings APIs"
```

### Task 3: Build admin CMS page

**Files:**
- Create: `app/admin/kontak-donasi/page.tsx`
- Modify: `app/admin/components/Sidebar.tsx`
- Modify: `app/admin/layout.tsx` if navigation styling needs consistency

- [ ] **Step 1: Create admin form**
  - Add two sections: `Kontak` and `Donasi / Infaq`.
  - Use existing admin form patterns and image upload component for QRIS.

- [ ] **Step 2: Add sidebar link**
  - Register `/admin/kontak-donasi` in the admin navigation.

- [ ] **Step 3: Verify admin page loads**

Run: `npm run dev`
Expected: `/admin/kontak-donasi` opens and loads/saves both sections.

- [ ] **Step 4: Commit**

```bash
git add app/admin/kontak-donasi/page.tsx app/admin/components/Sidebar.tsx
git commit -m "feat: add contact and donation admin page"
```

### Task 4: Wire public pages to CMS data

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Load CMS data**
  - Fetch contact and donation records on the client side or via existing data flow.

- [ ] **Step 2: Replace hardcoded content**
  - Contact section uses CMS values.
  - Donation section uses rekening and QRIS from CMS.

- [ ] **Step 3: Keep fallbacks**
  - Preserve the current hardcoded content when API data is missing.

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Expected: `/` still renders, and `kontak`/`donasi` show CMS values.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire contact and donation CMS into homepage"
```

### Task 5: Update docs and verify

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Document the new CMS**
  - Explain how to edit contact and donation settings from admin.
  - Document required env/database setup.

- [ ] **Step 2: Verify build and DB setup**

Run:
```bash
npm run db:setup
npm run build
```
Expected: both commands succeed.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: document contact and donation cms"
```
