# Admin Auth with Better-Auth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current open/admin access with a proper authentication system using better-auth, including role-based access control (superadmin and admin), seed data for the initial superadmin, and a user management page for superadmins.

**Architecture:** Use better-auth as the auth framework with email/password authentication. Store users in PostgreSQL via Drizzle ORM with a `role` column (`superadmin` | `admin`). Protect admin routes with a middleware/guard that checks authentication and role. Superadmins can manage other users through a dedicated admin page.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, better-auth, React, `lucide-react`.

---

### Task 1: Install and configure better-auth

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/auth-client.ts`
- Modify: `app/api/auth/[...all]/route.ts`
- Modify: `package.json`

- [ ] **Step 1: Install better-auth**

Run:
```bash
npm install better-auth
```

- [ ] **Step 2: Create server auth config**

Create `lib/auth.ts` with better-auth configuration using Drizzle adapter for PostgreSQL.

- [ ] **Step 3: Create client auth hook**

Create `lib/auth-client.ts` to export `useSession`, `signIn`, `signUp`, `signOut` from better-auth client.

- [ ] **Step 4: Create catch-all auth API route**

Create `app/api/auth/[...all]/route.ts` that delegates to better-auth handler.

- [ ] **Step 5: Verify auth routes**

Run: `npm run dev`
Expected: `POST /api/auth/sign-in` and `POST /api/auth/sign-up` return 200/400 appropriately.

- [ ] **Step 6: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b feat/admin-auth-task-1-better-auth-setup

# Stage dan commit (hanya file terkait task ini)
git add lib/auth.ts lib/auth-client.ts app/api/auth/[...all]/route.ts package.json package-lock.json
git commit -m "feat: add better-auth setup"

# Push ke origin
git push -u origin feat/admin-auth-task-1-better-auth-setup

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/feat/admin-auth-task-1-better-auth-setup"
```

---

### Task 2: Add user schema and seed data

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/seed.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add user table**

Add `users` table to Drizzle schema with columns: `id`, `email`, `password`, `name`, `role` (`superadmin` | `admin`), `createdAt`, `updatedAt`.

- [ ] **Step 2: Add seed data**

In `lib/db/seed.ts`, insert a default superadmin user with a known email and password (e.g., `superadmin@masjidalkahfi.test` / `Superadmin123!`). Document this credential in `.env.example` or a secure note.

- [ ] **Step 3: Update environment variables**

Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `.env.example`.

- [ ] **Step 4: Run database migration**

Run: `npm run db:setup`
Expected: `users` table created and seed row inserted.

- [ ] **Step 5: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b feat/admin-auth-task-2-users-schema-seed

# Stage dan commit (hanya file terkait task ini)
git add lib/db/schema.ts lib/db/seed.ts .env.example
git commit -m "feat: add users table and superadmin seed"

# Push ke origin
git push -u origin feat/admin-auth-task-2-users-schema-seed

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/feat/admin-auth-task-2-users-schema-seed"
```

---

### Task 3: Build admin login page

**Files:**
- Create: `app/admin/login/page.tsx`
- Modify: `app/admin/layout.tsx` (optional, for redirect logic)

- [ ] **Step 1: Create login form**

Build a simple login page at `/admin/login` with email, password, and submit button. Use better-auth client to call `signIn.email()`.

- [ ] **Step 2: Handle redirect**

If the user is already authenticated, redirect to `/admin`. If not authenticated, show the login form.

- [ ] **Step 3: Add logout button**

In the admin layout or sidebar, add a logout button that calls `signOut()`.

- [ ] **Step 4: Verify login flow**

Run: `npm run dev`
Expected: Navigating to `/admin` redirects to `/admin/login`. Logging in with seed credentials redirects to `/admin`.

- [ ] **Step 5: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b feat/admin-auth-task-3-admin-login

# Stage dan commit (hanya file terkait task ini)
git add app/admin/login/page.tsx app/admin/layout.tsx
git commit -m "feat: add admin login page"

# Push ke origin
git push -u origin feat/admin-auth-task-3-admin-login

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/feat/admin-auth-task-3-admin-login"
```

---

### Task 4: Protect admin routes

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `lib/auth-client.ts`

- [ ] **Step 1: Add auth guard**

In `app/admin/layout.tsx`, use `useSession` to check if the user is authenticated. If not, redirect to `/admin/login`.

- [ ] **Step 2: Add role check**

Optionally, add a role check to ensure only users with `role` of `admin` or `superadmin` can access admin pages.

- [ ] **Step 3: Verify protection**

Run: `npm run dev`
Expected: Unauthenticated users are redirected to `/admin/login` when accessing any `/admin/*` route.

- [ ] **Step 4: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b feat/admin-auth-task-4-protect-admin-routes

# Stage dan commit (hanya file terkait task ini)
git add app/admin/layout.tsx lib/auth-client.ts
git commit -m "feat: protect admin routes with auth guard"

# Push ke origin
git push -u origin feat/admin-auth-task-4-protect-admin-routes

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/feat/admin-auth-task-4-protect-admin-routes"
```

---

### Task 5: Build user management page

**Files:**
- Create: `app/admin/users/page.tsx`
- Modify: `app/admin/components/Sidebar.tsx`
- Create: `app/api/users/route.ts`
- Create: `app/api/users/[id]/route.ts`

- [ ] **Step 1: Create users API routes**

Build `GET /api/users` to list all users and `POST /api/users` to create a new user (superadmin only). Build `PUT /api/users/[id]` and `DELETE /api/users/[id]` for editing and deleting users.

- [ ] **Step 2: Create user management page**

Build `/admin/users` page with a table showing all users (email, name, role, created date). Include forms to add/edit users with role selection (`superadmin` | `admin`).

- [ ] **Step 3: Restrict to superadmin**

Only show the user management page and API routes to users with `role = 'superadmin'`.

- [ ] **Step 4: Add sidebar link**

Register `/admin/users` in the admin sidebar navigation.

- [ ] **Step 5: Verify user management**

Run: `npm run dev`
Expected: Superadmin can create new admins, edit roles, and delete users. Regular admins cannot access `/admin/users`.

- [ ] **Step 6: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b feat/admin-auth-task-5-user-management

# Stage dan commit (hanya file terkait task ini)
git add app/admin/users/page.tsx app/admin/components/Sidebar.tsx app/api/users/route.ts app/api/users/[id]/route.ts
git commit -m "feat: add user management page for superadmin"

# Push ke origin
git push -u origin feat/admin-auth-task-5-user-management

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/feat/admin-auth-task-5-user-management"
```

---

### Task 6: Update docs and verify

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Document authentication**

- Explain the new admin login system.
- Document default superadmin credentials.
- Document how to create additional admins.

- [ ] **Step 2: Verify build and seed**

Run:
```bash
npm run db:setup
npm run build
```
Expected: both commands succeed.

- [ ] **Step 3: Open Pull Request**

```bash
# Pastikan mulai dari main yang bersih
git checkout main
git pull origin main

# Buat branch baru untuk task ini
git checkout -b docs/admin-auth-task-6-readme-env

# Stage dan commit (hanya file terkait task ini)
git add README.md .env.example
git commit -m "docs: document admin auth with better-auth"

# Push ke origin
git push -u origin docs/admin-auth-task-6-readme-env

# Cetak URL PR; user buka & merge manual
echo "Buka PR: https://github.com/indras87/Website-Masjid-Al-Kahfi/pull/new/docs/admin-auth-task-6-readme-env"
```
