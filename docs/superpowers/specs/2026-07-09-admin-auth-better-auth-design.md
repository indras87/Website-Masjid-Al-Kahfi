# Admin Auth with Better-Auth — Design Spec

## Context

The admin panel currently uses a simple localStorage-based password guard (`AdminGuard`) with a hardcoded password `dkmalkahfi`. This is insecure and lacks user management. We will replace it with proper authentication using better-auth, including role-based access control (superadmin + admin), a user management page for superadmins, and server-side session validation.

Core better-auth infrastructure already exists (lib/auth.ts, schema, seed, login page) but is not integrated with the admin pages.

## Goals

- Replace localStorage auth with better-auth server-side sessions
- Role-based access: superadmin (full access) and admin (content management only)
- Superadmin can manage users (CRUD) via dedicated admin page
- Clean up old auth code (AdminGuard, localStorage patterns)

## Architecture

### Route Structure

```
app/
  layout.tsx                         ← wrap with AuthProvider
  admin/
    layout.tsx                       ← outer layout (sidebar, header, session-aware)
    login/
      layout.tsx                     ← bare layout (no sidebar)
      page.tsx                       ← login form (themed, email+password)
    (protected)/
      layout.tsx                     ← server-side auth guard → redirect /admin/login
      page.tsx                       ← dashboard
      berita/page.tsx
      galeri/page.tsx
      kegiatan/page.tsx
      kontak-donasi/page.tsx
      tentang/page.tsx
      users/
        page.tsx                     ← user management (superadmin only)
        _components/
          UserClientPage.tsx         ← client: table + CRUD buttons
          UserFormModal.tsx          ← modal form: add/edit user
```

### Layout Nesting

In Next.js App Router, `app/admin/layout.tsx` renders for ALL `/admin/*` routes, including `/admin/login`. Therefore:

- **`app/admin/layout.tsx`** — minimal wrapper, renders only `{children}`. No sidebar, no header.
- **`app/admin/(protected)/layout.tsx`** — contains sidebar + header + session-aware UI. Auth guard checks session, redirects to login if missing.
- **`app/admin/login/layout.tsx`** — bare layout, no sidebar. Login page renders its own full-screen form.

This ensures login pages never see the sidebar, and protected pages always have it.

### Auth Flow

1. User accesses `/admin/*` → `app/admin/layout.tsx` renders `{children}`
2. If route is in `(protected)/` → `(protected)/layout.tsx` checks session server-side via `auth.api.getSession({ headers })`
3. No session → `redirect('/admin/login')`
4. Session exists → renders sidebar + header + `{children}`, passes user data to UI
5. Login → `signIn.email({ email, password })` → redirect `/admin`
6. Logout → `signOut()` → redirect `/admin/login`

### API Routes

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/[...all]` | GET/POST | Public | better-auth handler (sign-in, sign-up, session, etc.) |
| `/api/users` | GET | superadmin | List all users |
| `/api/users` | POST | superadmin | Create user (name, email, password, role) |
| `/api/users/[id]` | GET | superadmin | Get single user |
| `/api/users/[id]` | PUT | superadmin | Update user (name, email, role, optional password) |
| `/api/users/[id]` | DELETE | superadmin | Delete user (cannot delete self) |

## Data Model

### Existing Tables (no changes)

**user** — `id` (text PK), `email` (unique, not null), `password` (text), `name` (text), `image` (text), `role` (pgEnum: superadmin|admin, default: admin), `emailVerified` (timestamp), `createdAt`, `updatedAt`

**session** — `id` (text PK), `userId` (text FK → user.id, cascade), `expiresAt` (timestamp), `createdAt`, `updatedAt`

**account** — `id` (text PK), `userId` (text FK → user.id, cascade), `provider`, `providerAccountId`, `createdAt`, `updatedAt`

**verification** — `id` (text PK), `identifier`, `token`, `expiresAt`

### Seed Data

- Email: `superadmin@masjidalkahfi.test`
- Password: `Superadmin123!` (bcrypt hashed)
- Role: `superadmin`
- Email verified: set at seed time

### Auth Configuration

- **lib/auth.ts**: `betterAuth()` with `drizzleAdapter(db, { provider: "pg" })`, `emailAndPassword: { enabled: true, autoSignIn: true }`, custom `role` field (type: string, default: "admin", input: false), session expiry 7 days, update age 24 hours
- **lib/auth-client.tsx**: `AuthProvider` context + `useAuth()` hook. `getBaseUrl()` resolves: `window.location.origin` > `NEXT_PUBLIC_VERCEL_URL` > `NEXT_PUBLIC_APP_URL` > `localhost:3000`

## UI Components

### Login Page (`app/admin/login/page.tsx`)

- Adopts AdminGuard design: emerald/gold mosque theme, decorative background, card with mosque icon
- Form fields: email + password
- Error display from better-auth responses
- Redirect to `/admin` if already authenticated
- No sidebar (uses bare login layout)

### Outer Admin Layout (`app/admin/layout.tsx`)

- Minimal wrapper: renders only `{children}`
- No sidebar, no header — these live in the protected layout
- Exists so login pages bypass the admin shell

### Protected Layout (`app/admin/(protected)/layout.tsx`) — Auth Guard + Shell

- Server component
- Calls `auth.api.getSession({ headers: new Headers(await headers()) })`
- If no session: `redirect('/admin/login')`
- If session exists: renders full admin shell (sidebar + header) around `{children}`
- Sidebar navigation: Dashboard, Berita, Kegiatan, Galeri, Profil & Kontak, Donasi & QRIS
- "Manajemen User" menu item: visible only when `user.role === 'superadmin'`
- Header shows real user name, role, and initials avatar
- Logout button calls `signOut()` from better-auth client

### User Management Page (`app/admin/(protected)/users/page.tsx`)

- Server component: checks `session.user.role === 'superadmin'`, redirects to `/admin` if not
- Fetches all users from DB, passes to `UserClientPage`
- `UserClientPage` (client): table with Name, Email, Role, Created At, Actions columns. Buttons: Tambah User, Edit (per row), Hapus (per row)
- `UserFormModal` (client): modal with fields — Name, Email, Password (required on create, optional on edit), Role dropdown (superadmin/admin)
- Delete confirmation dialog
- Superadmin cannot delete their own account

## Security

- Server-side session validation on all `(protected)` routes and API endpoints
- API routes check both session existence and `role === 'superadmin'` for user management
- Passwords hashed with bcrypt (10 rounds)
- Superadmin self-deletion prevention
- `role` field has `input: false` in better-auth config — users cannot set their own role via sign-up
- Drizzle pgEnum constrains role values at database level

## Cleanup

### Delete
- `app/admin/components/AdminGuard.tsx` — replaced by `(protected)` route group guard

### Move/Restructure
- Admin pages (berita, galeri, kegiatan, kontak-donasi, tentang, dashboard) → move into `(protected)/`
- Sidebar + header from `app/admin/layout.tsx` → move into `(protected)/layout.tsx`
- `app/admin/layout.tsx` becomes minimal `{children}` wrapper

### Update
- `app/layout.tsx` — wrap children with `<AuthProvider>`
- `app/admin/layout.tsx` — use real session data instead of placeholder
- `app/admin/components/Sidebar.tsx` — replace `localStorage.removeItem("admin_logged_in")` with `signOut()`
- `package.json` — remove `@auth/drizzle-adapter` (unused NextAuth leftover)

## Verification

1. `npm run db:setup` — migrations run, superadmin seeded
2. `npm run dev` → navigate to `/admin` → redirects to `/admin/login`
3. Login with `superadmin@masjidalkahfi.test` / `Superadmin123!` → redirects to `/admin`
4. Sidebar shows real user name and role
5. "Manajemen User" visible in sidebar for superadmin
6. Logout → redirects to `/admin/login`
7. `/admin/users` — can add, edit, delete users
8. Create a new admin user → login with that account → "Manajemen User" not visible
9. `npm run build` succeeds
