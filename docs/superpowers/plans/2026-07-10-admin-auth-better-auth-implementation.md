# Admin Auth with Better-Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-based admin auth with proper better-auth implementation including role-based access control (superadmin + admin) and user management.

**Architecture:** Server-side session validation with better-auth, role-based access through PostgreSQL enum, protected route group with layout-based auth guard, and dedicated user management for superadmins.

**Tech Stack:** Next.js 15 (App Router), better-auth v1.6+, Drizzle ORM, PostgreSQL, bcryptjs

## Global Constraints

- better-auth v1.6.23 already installed
- Drizzle ORM with PostgreSQL (port 5433)
- Email+Password authentication only (no OAuth)
- Role: pgEnum with values "superadmin" | "admin"
- Session expiry: 7 days, update age: 24 hours
- Password hashing: bcrypt with 10 rounds
- Next.js App Router with server components by default

---

## File Structure

### New Files to Create
- `lib/auth.ts` — better-auth server configuration
- `lib/auth-client.tsx` — AuthProvider context + useAuth hook
- `app/api/auth/[...all]/route.ts` — better-auth API handler
- `app/api/users/route.ts` — User CRUD (GET list, POST create)
- `app/api/users/[id]/route.ts` — User CRUD (GET one, PUT update, DELETE)
- `app/admin/login/layout.tsx` — Bare layout for login (no sidebar)
- `app/admin/login/page.tsx` — Login form page
- `app/admin/(protected)/layout.tsx` — Auth guard + admin shell (sidebar + header)
- `app/admin/(protected)/page.tsx` — Dashboard (moved)
- `app/admin/(protected)/berita/page.tsx` — Berita management (moved)
- `app/admin/(protected)/galeri/page.tsx` — Galeri management (moved)
- `app/admin/(protected)/kegiatan/page.tsx` — Kegiatan management (moved)
- `app/admin/(protected)/kontak-donasi/page.tsx` — Kontak & Donasi (moved)
- `app/admin/(protected)/tentang/page.tsx` — Tentang management (moved)
- `app/admin/(protected)/users/page.tsx` — User management page (superadmin only)
- `app/admin/(protected)/users/_components/UserClientPage.tsx` — Client-side user table + CRUD
- `app/admin/(protected)/users/_components/UserFormModal.tsx` — Modal for add/edit user

### Files to Modify
- `lib/db/schema.ts` — Add better-auth tables (user, session, account, verification)
- `lib/db/seed.ts` — Add superadmin seed user
- `app/layout.tsx` — Wrap with AuthProvider
- `app/admin/layout.tsx` — Simplify to minimal wrapper
- `app/admin/components/Sidebar.tsx` — Update logout, add user management link
- `package.json` — Remove @auth/drizzle-adapter

### Files to Delete
- `app/admin/components/AdminGuard.tsx` — Replaced by server-side auth guard

---

## Task 1: Add better-auth Tables to Schema

**Files:**
- Modify: `lib/db/schema.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `user`, `session`, `account`, `verification` tables for better-auth

- [ ] **Step 1: Add pgEnum for user role and better-auth tables**

Add to `lib/db/schema.ts` after the imports and before existing tables:

```typescript
import { pgEnum, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User role enum
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin"]);

// Better-auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  image: text("image"),
  role: userRoleEnum("role").default("admin").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});
```

Add relations after all table definitions:

```typescript
// Relations for better-auth tables
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
```

- [ ] **Step 2: Export new tables from schema index**

Add to exports in existing `lib/db/schema.ts`:

```typescript
// In the existing exports, add these new tables:
export { user, session, account, verification, userRoleEnum };
```

- [ ] **Step 3: Push schema to database**

Run: `npm run db:push`

Expected: Tables created successfully, no errors

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add better-auth tables to schema"
```

---

## Task 2: Create better-auth Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/auth-client.tsx`

**Interfaces:**
- Consumes: `user`, `session`, `account`, `verification` tables from schema
- Produces: `auth` server instance, `authClient` for client, `AuthProvider` component

- [ ] **Step 1: Create server-side auth config**

Create `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "admin",
        required: false,
        input: false, // Users cannot set their own role
      },
    },
  },
});
```

- [ ] **Step 2: Create client-side auth context**

Create `lib/auth-client.tsx`:

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { useState, useEffect, ReactNode } from "react";

// Resolve base URL for better-auth
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

// Extract hooks and utilities from authClient
export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts lib/auth-client.tsx
git commit -m "feat: create better-auth config and client context"
```

---

## Task 3: Create better-auth API Handler

**Files:**
- Create: `app/api/auth/[...all]/route.ts`

**Interfaces:**
- Consumes: `auth` from lib/auth.ts
- Produces: API endpoint for all auth operations (sign-in, session, etc.)

- [ ] **Step 1: Create API handler**

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth
git commit -m "feat: add better-auth API handler"
```

---

## Task 4: Add Superadmin Seed

**Files:**
- Modify: `lib/db/seed.ts`

**Interfaces:**
- Consumes: `user` table, bcryptjs
- Produces: Seeded superadmin user

- [ ] **Step 1: Add bcrypt hash function and superadmin seed**

Add to `lib/db/seed.ts` after imports:

```typescript
import bcrypt from "bcryptjs";
import { user } from "./schema";
```

Add before the `main()` function:

```typescript
const SUPERADMIN_USER = {
  id: "superadmin-001",
  email: "superadmin@masjidalkahfi.test",
  name: "Superadmin DKM",
  role: "superadmin" as const,
  emailVerified: new Date(),
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
```

Add inside `main()` after cleaning tables and before inserting other data:

```typescript
// Seed superadmin user
console.log("Seeding superadmin user...");
const hashedPassword = await hashPassword("Superadmin123!");
await db.insert(user).values({
  ...SUPERADMIN_USER,
  password: hashedPassword,
}).onConflictDoNothing(); // Avoid duplicate on re-seed
```

Add `user` to the imports at the top (already added above), and add to the clean section:

```typescript
// In the clean tables section, add:
await db.delete(user);
```

- [ ] **Step 2: Run seed to verify**

Run: `DATABASE_URL='postgresql://postgres:12345678@localhost:5433/alkahfi_db' npm run db:seed`

Expected: "Seeding superadmin user..." followed by "Database seeded successfully!"

- [ ] **Step 3: Commit**

```bash
git add lib/db/seed.ts
git commit -m "feat: add superadmin seed to database"
```

---

## Task 5: Create Login Page and Layout

**Files:**
- Create: `app/admin/login/layout.tsx`
- Create: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `signIn`, `useSession` from auth-client
- Produces: Login UI, redirects to /admin on success

- [ ] **Step 1: Create bare login layout**

Create `app/admin/login/layout.tsx`:

```typescript
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create login page with themed design**

Create `app/admin/login/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { Lock, LogIn, AlertCircle, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
      router.push("/admin");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login gagal. Periksa email dan kata sandi Anda.");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 opacity-10 islamic-pattern bg-repeat"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl"></div>

      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-md border-t-4 border-gold-500 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-900 border-2 border-gold-500 rounded-full flex items-center justify-center mx-auto text-gold-300 text-3xl shadow-lg">
            🕌
          </div>
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mt-4">Panel Kontrol DKM</h2>
          <p className="text-xs text-gold-600 font-semibold uppercase tracking-widest">Masjid Al-Kahfi Cikoneng</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Login untuk mengakses sistem manajemen konten.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@masjidalkahfi.test"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Kata Sandi</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2.5 items-start text-xs leading-relaxed animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-950 text-gold-100 font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold-100 border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={16} /> Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        <div className="text-center border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400">
            Gunakan akun superadmin yang telah dibuat untuk login.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/login
git commit -m "feat: create login page and layout"
```

---

## Task 6: Wrap Root Layout with AuthProvider

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `AuthProvider` from lib/auth-client.tsx
- Produces: Auth context available throughout app

- [ ] **Step 1: Add AuthProvider to root layout**

Read `app/layout.tsx` first to see current structure, then update:

```typescript
// Add import at top:
import { AuthProvider } from "@/lib/auth-client";

// Wrap the existing children with AuthProvider:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap root layout with AuthProvider"
```

---

## Task 7: Refactor Admin Layout to Minimal Wrapper

**Files:**
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: Minimal wrapper, sidebar/header moved to protected layout

- [ ] **Step 1: Simplify admin layout**

Replace `app/admin/layout.tsx` content with:

```typescript
export const metadata = {
  title: 'Admin Dashboard - Masjid Al-Kahfi',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "refactor: simplify admin layout to minimal wrapper"
```

---

## Task 8: Create Protected Route Group with Auth Guard

**Files:**
- Create: `app/admin/(protected)/layout.tsx`
- Move: `app/admin/page.tsx` → `app/admin/(protected)/page.tsx`
- Move: `app/admin/berita/page.tsx` → `app/admin/(protected)/berita/page.tsx`
- Move: `app/admin/galeri/page.tsx` → `app/admin/(protected)/galeri/page.tsx`
- Move: `app/admin/kegiatan/page.tsx` → `app/admin/(protected)/kegiatan/page.tsx`
- Move: `app/admin/kontak-donasi/page.tsx` → `app/admin/(protected)/kontak-donasi/page.tsx`
- Move: `app/admin/tentang/page.tsx` → `app/admin/(protected)/tentang/page.tsx`

**Interfaces:**
- Consumes: `auth` from lib/auth.ts, session data via headers
- Produces: Auth guard + admin shell with sidebar/header

- [ ] **Step 1: Create protected layout with auth guard**

Create `app/admin/(protected)/layout.tsx`:

```typescript
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Sidebar from "@/app/admin/components/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col md:h-screen overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
            Sistem Manajemen Konten
          </h1>
          <h1 className="text-xl font-semibold text-gray-800 sm:hidden">CMS</h1>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user.name || "Admin"}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold border-2 border-emerald-500 shadow-sm">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Move existing admin pages to protected route group**

```bash
# Create the protected directory
mkdir -p app/admin/\(protected\)/berita
mkdir -p app/admin/\(protected\)/galeri
mkdir -p app/admin/\(protected\)/kegiatan
mkdir -p app/admin/\(protected\)/kontak-donasi
mkdir -p app/admin/\(protected\)/tentang

# Move pages
git mv app/admin/page.tsx app/admin/\(protected\)/page.tsx
git mv app/admin/berita/page.tsx app/admin/\(protected\)/berita/page.tsx
git mv app/admin/galeri/page.tsx app/admin/\(protected\)/galeri/page.tsx
git mv app/admin/kegiatan/page.tsx app/admin/\(protected\)/kegiatan/page.tsx
git mv app/admin/kontak-donasi/page.tsx app/admin/\(protected\)/kontak-donasi/page.tsx
git mv app/admin/tentang/page.tsx app/admin/\(protected\)/tentang/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(protected\)
git commit -m "feat: create protected route group with auth guard"
```

---

## Task 9: Update Sidebar with Real Session Data

**Files:**
- Modify: `app/admin/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `user` prop from protected layout, `signOut` from auth-client
- Produces: Updated sidebar with logout and user management link

- [ ] **Step 1: Update Sidebar to accept user prop and use signOut**

Modify `app/admin/components/Sidebar.tsx`:

```typescript
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bell,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Info,
  HandCoins,
  Users,
} from "lucide-react";

interface User {
  name?: string | null;
  role?: string;
}

interface SidebarProps {
  user?: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSuperadmin = user?.role === "superadmin";

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kegiatan", label: "Kegiatan", icon: CalendarDays },
    { href: "/admin/berita", label: "Berita", icon: FileText },
    { href: "/admin/galeri", label: "Galeri", icon: ImageIcon },
    { href: "/admin/tentang", label: "Tentang", icon: Info },
    { href: "/admin/kontak-donasi", label: "Kontak & Donasi", icon: HandCoins },
    ...(isSuperadmin
      ? [{ href: "/admin/users", label: "Manajemen User", icon: Users }]
      : []),
  ];

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari panel admin?")) {
      setIsLoggingOut(true);
      try {
        await signOut();
        router.push("/admin/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback: force reload
        window.location.href = "/admin/login";
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden bg-emerald-950 text-white p-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold font-serif text-gold-400">
          Admin Al-Kahfi
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-gold-300 transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside
        className={`w-64 bg-emerald-950 text-white flex-col absolute md:relative z-50 h-[calc(100vh-68px)] md:h-screen transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex shrink-0`}
      >
        <div className="hidden md:flex p-6 border-b border-emerald-900 items-center justify-center shrink-0">
          <h2 className="text-2xl font-bold font-serif text-gold-400">
            Admin CMS
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-emerald-900 text-gold-300 font-semibold shadow-inner" : "text-emerald-100 hover:bg-emerald-800"}`}
              >
                <Icon size={18} /> <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-emerald-900 shrink-0 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-colors font-medium text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={18} /> <span>{isLoggingOut ? "Keluar..." : "Keluar / Logout"}</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-colors font-medium text-sm"
          >
            <LogOut size={18} className="rotate-180" />{" "}
            <span>Kembali ke Web</span>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/components/Sidebar.tsx
git commit -m "feat: update sidebar with real session data and signOut"
```

---

## Task 10: Create User Management API Routes

**Files:**
- Create: `app/api/users/route.ts`
- Create: `app/api/users/[id]/route.ts`

**Interfaces:**
- Consumes: `auth` from lib/auth.ts, `db` from lib/db, `user` table
- Produces: CRUD endpoints for user management (superadmin only)

- [ ] **Step 1: Create users list and create endpoint**

Create `app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// GET /api/users - List all users (superadmin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await db.query.user.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create user (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["superadmin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUser = await db
      .insert(user)
      .values({
        id: userId,
        email,
        password: hashedPassword,
        name,
        role,
      })
      .returning({
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      });

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create user detail, update, delete endpoint**

Create `app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// GET /api/users/[id] - Get single user (superadmin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(foundUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (superadmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, name, role, password } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["superadmin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-role-change (optional, but safe)
    if (id === session.user.id && role !== "superadmin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updateData: any = {
      email,
      name,
      role,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning({
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      });

    if (!updated[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (superadmin only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const deleted = await db.delete(user).where(eq(user.id, id)).returning({ id: true });

    if (!deleted[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/users
git commit -m "feat: add user management API endpoints"
```

---

## Task 11: Create User Management Page Components

**Files:**
- Create: `app/admin/(protected)/users/page.tsx`
- Create: `app/admin/(protected)/users/_components/UserClientPage.tsx`
- Create: `app/admin/(protected)/users/_components/UserFormModal.tsx`

**Interfaces:**
- Consumes: API endpoints from /api/users, session data
- Produces: User management UI (superadmin only)

- [ ] **Step 1: Create UserFormModal component**

Create `app/admin/(protected)/users/_components/UserFormModal.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
  createdAt: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserData) => Promise<void>;
  user?: User;
}

export type UserData = {
  email: string;
  name: string;
  role: "superadmin" | "admin";
  password: string;
};

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
}: UserFormModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"superadmin" | "admin">("admin");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
      setRole(user.role);
      setPassword("");
    } else {
      setEmail("");
      setName("");
      setRole("admin");
      setPassword("");
    }
    setError("");
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !name || !role) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (!isEdit && !password) {
      setError("Kata sandi wajib diisi untuk pengguna baru.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, name, role, password });
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </h2>
          <button
            onClick={onClose}
            className="text-gold-300 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2 items-start text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama pengguna"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "superadmin" | "admin")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white"
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Kata Sandi {isEdit && "(kosakkan jika tidak ingin mengubah)"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Kosakkan untuk tidak mengubah" : "Masukkan kata sandi"}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Menyimpan...
                </>
              ) : (
                isEdit ? "Simpan" : "Tambah"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create UserClientPage component**

Create `app/admin/(protected)/users/_components/UserClientPage.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Shield, User } from "lucide-react";
import UserFormModal, { UserData } from "./UserFormModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
  createdAt: string;
}

interface UserClientPageProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UserClientPage({ initialUsers, currentUserId }: UserClientPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async (data: UserData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menambah pengguna");
    }

    const newUser = await res.json();
    setUsers([...users, newUser]);
    showMessage("success", "Pengguna berhasil ditambahkan");
  };

  const handleEdit = async (data: UserData) => {
    if (!editingUser) return;

    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengupdate pengguna");
    }

    const updated = await res.json();
    setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
    showMessage("success", "Pengguna berhasil diupdate");
  };

  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      showMessage("error", "Tidak bisa menghapus akun sendiri");
      return;
    }

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus pengguna");
      }

      setUsers(users.filter((u) => u.id !== id));
      showMessage("success", "Pengguna berhasil dihapus");
    } catch (err: any) {
      showMessage("error", err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl hover:bg-emerald-800 transition font-medium"
        >
          <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                        {(u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{u.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        u.role === "superadmin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <Shield size={12} />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pengguna "${u.name}"?`)) {
                            handleDelete(u.id);
                          }
                        }}
                        disabled={isDeleting === u.id || u.id === currentUserId}
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <User size={32} className="text-gray-300" />
                      <span>Belum ada pengguna</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingUser ? handleEdit : handleCreate}
        user={editingUser}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create users page (server component)**

Create `app/admin/(protected)/users/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import UserClientPage from "./_components/UserClientPage";

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  // Only superadmin can access
  if (session.user.role !== "superadmin") {
    redirect("/admin");
  }

  const users = await db.query.user.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <UserClientPage
      initialUsers={users}
      currentUserId={session.user.id}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(protected\)/users
git commit -m "feat: add user management page and components"
```

---

## Task 12: Cleanup - Remove Old Auth Code and Dependencies

**Files:**
- Delete: `app/admin/components/AdminGuard.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: Clean codebase without old auth

- [ ] **Step 1: Remove AdminGuard component**

```bash
git rm app/admin/components/AdminGuard.tsx
```

- [ ] **Step 2: Remove unused @auth/drizzle-adapter dependency**

Check if `@auth/drizzle-adapter` is actually unused (grep for imports):

```bash
grep -r "@auth/drizzle-adapter" /mnt/c/ai_workspace/website_masjid_alkahfi --include="*.ts" --include="*.tsx"
```

If no results (should be none since we're using better-auth), remove from package.json:

```bash
npm uninstall @auth/drizzle-adapter
```

Or manually remove from package.json if npm fails:
- Remove `"@auth/drizzle-adapter": "^1.11.2",` from dependencies

- [ ] **Step 3: Commit**

```bash
git add app/admin/components/AdminGuard.tsx package.json package-lock.json
git commit -m "chore: remove old AdminGuard and unused dependencies"
```

---

## Task 13: Verification - End-to-End Testing

**Files:**
- (test only) - No code changes

- [ ] **Step 1: Reset and seed database**

Run: `npm run db:setup`

Expected: "Seeding superadmin user..." followed by "Database seeded successfully!"

- [ ] **Step 2: Start dev server**

Run: `npm run dev`

Expected: Server starts at http://localhost:3000

- [ ] **Step 3: Test redirect to login**

Navigate to: http://localhost:3000/admin

Expected: Redirects to /admin/login, shows login page

- [ ] **Step 4: Test login with superadmin**

Use credentials:
- Email: `superadmin@masjidalkahfi.test`
- Password: `Superadmin123!`

Expected: Redirects to /admin, shows sidebar with user name and "Manajemen User" link

- [ ] **Step 5: Test logout**

Click "Keluar / Logout" button

Expected: Redirects to /admin/login

- [ ] **Step 6: Test user management**

Login as superadmin, navigate to /admin/users

Expected: Shows user table with at least the superadmin user. Can add new user.

- [ ] **Step 7: Test admin role (non-superadmin)**

Create a new admin user via user management, logout, login as admin

Expected: Sidebar does NOT show "Manajemen User" link. Accessing /admin/users directly redirects to /admin

- [ ] **Step 8: Test build**

Run: `npm run build`

Expected: Build succeeds with no errors

- [ ] **Step 9: Final commit (if any fixes needed during testing)**

```bash
git add .
git commit -m "fix: any issues found during verification"
```

---

## Summary Checklist

After completing all tasks, verify:

- [ ] better-auth tables exist in database
- [ ] Superadmin user seeded successfully
- [ ] Login page works with email+password
- [ ] Protected routes redirect to login if not authenticated
- [ ] Sidebar shows real user name and role
- [ ] Superadmin sees "Manajemen User" in sidebar
- [ ] Admin does NOT see "Manajemen User" in sidebar
- [ ] User CRUD works (create, edit, delete)
- [ ] Superadmin cannot delete own account
- [ ] Logout redirects to login page
- [ ] Build succeeds with no errors
- [ ] AdminGuard component removed
- [ ] @auth/drizzle-adapter removed

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-10-admin-auth-better-auth-implementation.md`.**
