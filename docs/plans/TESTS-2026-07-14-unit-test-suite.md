# Plan: TESTS-2026-07-14 — Unit & Integration Test Suite for All Features/APIs

- **ID:** `TESTS-2026-07-14`
- **Title:** Comprehensive unit & integration tests for every API route and pure helper
- **Date:** 2026-07-14
- **Status:** ✅ IMPLEMENTED — `npm test` runs **126 tests, 0 failures** (branch `test/unit-test-suite`).
- **Owner:** implementation by junior dev / lower-cost AI model
- **Audience:** engineer who has NOT read the codebase before. Every file path, signature, and expected status code is spelled out below.

> **Note on validated approach:** the §3.3/§9 mocking notes originally proposed Node's `mock.module`. Under `tsx` (which compiles everything to CJS) `mock.module` wraps the mock as `{ default, module.exports }` and does not surface named exports — it does not work here. The shipped implementation instead **monkeypatches the cached `require('next/headers')` export in a `--import` preload** (CJS property mutation is seen by every route, because tsx compiles `import { headers }` to a property read on the cached module object) and **closes the postgres pool in an `after(closeDb)` hook** so the runner can exit. Auth-gated routes patch `auth.api.getSession` per-file. These three mechanisms are what the code actually uses; treat the `mock.module` text below as historical context only.

---

## 1. Goal

Add automated tests for **every feature / API** in the Masjid Al-Kahfi website so regressions are caught before merge. Tests use the project's existing runner (`tsx --test`, the Node.js built-in test runner) — **no new test framework** (no Jest/Vitest).

Two test layers:

1. **Unit tests** — pure functions (`lib/slug.ts`, `lib/cms/settings.ts`, `lib/prayer-times.ts`). No DB.
2. **Integration tests** — every route handler in `app/api/**`, hit directly as functions against the real local PostgreSQL. Each scenario wipes the relevant table first so state is consistent and deterministic.

> **Mandate from stakeholder:** *"Setiap skenario, hapus datanya terlebih dahulu agar konsisten."* → Every test scenario resets (DELETE) the table(s) it touches inside a `before`/`beforeEach` hook before asserting.

---

## 2. Current State (do not re-investigate)

- **Runner:** `package.json` → `"test": "tsx --test"`. Node v24, tsx v4.23.
- **Existing tests:** `test/lib/prayer-times.test.ts` (11 tests), `test/lib/cms/settings.test.ts` (3 tests). Both use `node:test` + `node:assert/strict`. **Do not modify them; extend the same style.**
- **DB:** PostgreSQL via docker-compose, container `alkahfi_db`, host port **5433**, user/pass `postgres`/`postgres`, db `alkahfi_db`. Already running locally.
- **ORM:** Drizzle (`drizzle-orm/postgres-js`). Connection in `lib/db/index.ts`, exports `db`. Loads `.env.local` then `.env`. Reads `DATABASE_URL`.
- **Auth:** `better-auth` (NOT NextAuth). Email/password. Session read via `auth.api.getSession({ headers: await headers() })`.
- **No server actions** (`"use server"` appears nowhere). All mutations are route handlers.
- **No middleware.ts** — admin UI gating is done in `app/admin/(protected)/layout.tsx`, not at the API layer.

### 2.1 Important behavior fact (read before writing tests)

Most CRUD routes have **NO auth check** in the handler. Only these require a session:

| Route | Gate |
|---|---|
| `app/api/users/route.ts` (GET/POST) | `session.user.role === 'superadmin'` else 401 |
| `app/api/users/[id]/route.ts` (GET/PUT/DELETE) | `session.user.role === 'superadmin'` else 401 |
| `app/api/pengaturan/route.ts` (PUT only) | any session else 401 |

Everything else (`berita`, `kegiatan`, `galeri`, `pengurus`, `fasilitas`, `kontak`, `donasi`, `profil`, `upload`) is **open at the handler level** and calls `getActor()` (from `lib/audit.ts`) to stamp `createdById`/`updatedById`. With no session `getActor()` returns `null` → those columns are `null`. That is fine and expected in tests.

---

## 3. Test Architecture

### 3.1 Directory layout (new files)

```
test/
  helpers/
    db.ts              # table-reset + shared db import
    request.ts         # build Request + call handler + parse JSON/status
    auth-mock.ts       # mock next/headers + optionally @/lib/auth for superadmin
  lib/
    prayer-times.test.ts        # EXISTS — leave alone
    cms/settings.test.ts        # EXISTS — leave alone
    slug.test.ts                # NEW — unit
    audit.test.ts               # NEW — integration (withActorNames against DB)
    dashboard.test.ts           # NEW — integration
  api/
    berita.test.ts              # GET/POST + [id] GET/PUT/DELETE
    kegiatan.test.ts
    galeri.test.ts
    pengurus.test.ts
    fasilitas.test.ts
    kontak.test.ts
    donasi.test.ts
    profil.test.ts
    pengaturan.test.ts          # incl. 401 + authenticated PUT
    users.test.ts               # incl. 401 + superadmin CRUD + role rules
    upload.test.ts              # validation + happy path with file cleanup
```

### 3.2 package.json change

Update the test script so the `next/headers` mock preload is always applied, and so only the `test/` tree runs:

```jsonc
"test": "tsx --test --test-name-pattern='.*' --import ./test/helpers/register-mocks.ts test/**/*.test.ts"
```

Minimal, robust form (Node 24 glob is supported by `tsx --test`):

```jsonc
"test": "tsx --test --import ./test/helpers/register-mocks.ts \"test/**/*.test.ts\""
```

Also add `tsx` to `devDependencies` explicitly (it currently resolves transitively) so CI/local installs are hermetic:

```jsonc
"devDependencies": { ... "tsx": "^4.23.0" }
```

### 3.3 Mocking strategy — the one hard part

Route handlers internally call `next/headers` (`headers()`) and `@/lib/auth` (`auth.api.getSession`). Outside a real Next.js request there is **no request async-storage**, so `headers()` throws. We must stub it.

**`test/helpers/register-mocks.ts`** (loaded via `--import` before any test file):

```ts
import { mock } from 'node:test';

// next/headers has no request context in the test runner.
// Stub it to an empty Headers() so getActor() -> getSession() -> null session.
mock.module('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
```

This makes every public route behave as "anonymous" (actor = null) by default — exactly what the open CRUD routes need.

**For the auth-gated routes (`users`, `pengaturan` PUT)** we additionally need an *authenticated* path. Because `mock.module` is global per test-file in the Node runner, handle auth scenarios **inside the same file** with a file-scoped mock of `@/lib/auth`:

```ts
// top of test/api/users.test.ts — before importing the route
import { mock } from 'node:test';

const SESSION = { user: { id: 'superadmin-001', role: 'superadmin', name: 'Superadmin' } };

mock.module('@/lib/auth', () => ({
  auth: { api: { getSession: async () => SESSION } },
}));
```

To also test the **401 / non-superadmin** path in the same file, swap `SESSION` to `null` or `{ user: { role: 'admin' } }` inside a nested `test()` and re-import is not needed — just mutate a `let currentSession` variable the mock closure reads. (See §6 `users.test.ts` skeleton.)

> If `mock.module('@/lib/auth', ...)` does not resolve the `@/` alias in your tsx version, fall back to mocking the relative path the route imports (`'@/lib/auth'` is what the route uses, so alias should resolve identically to `lib/db`). If it still fails, create a thin wrapper: temporarily set `process.env`-driven flag — but try the direct mock first; tsx 4.23 resolves tsconfig `paths`.

### 3.4 Calling a route handler in a test

Route handlers are plain exported async functions. We call them directly with a synthetic `Request`. Helper:

**`test/helpers/request.ts`**

```ts
type Handler = (req: Request, ctx?: { params: Promise<Record<string, string>> }) => Promise<Response>;

const BASE = 'http://localhost/api';

export async function call(
  handler: Handler,
  { method = 'GET', body, params }: { method?: string; body?: unknown; params?: Record<string, string> } = {},
) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const url = params ? `${BASE}/x/${Object.values(params).join('/')}` : `${BASE}/x`;
  const req = new Request(url, init);
  const res = await handler(req, params ? { params: Promise.resolve(params) } : undefined);
  let json: any = undefined;
  const text = await res.text();
  try { json = text ? JSON.parse(text) : undefined; } catch { /* non-json */ }
  return { status: res.status, body: json, raw: text };
}
```

Usage examples:

```ts
// GET /api/berita
const { status, body } = await call(GET);
// POST /api/berita
await call(POST, { method: 'POST', body: { title: 'X', desc: 'Y' } });
// DELETE /api/berita/5  (route reads params.id)
await call(DELETE, { method: 'DELETE', params: { id: '5' } });
```

> `[id]` routes receive `{ params }: { params: Promise<{ id: string }> }`. Always pass `params` through the helper so it resolves.

### 3.5 DB reset helper

**`test/helpers/db.ts`**

```ts
import 'dotenv/config'; // ensure DATABASE_URL available even if run raw
import { db } from '../../../lib/db';
import {
  berita, kegiatan, galeri, pengurus, fasilitas, kontak, donasi,
  profilMasjid, pengaturan, user, account, session,
} from '../../../lib/db/schema';

// Wipe ONE table.
export async function reset(...tables: any[]) {
  for (const t of tables) await db.delete(t);
}

// Wipe all CMS content (leave user/session tables intact unless requested).
export async function resetContent() {
  await reset(berita, kegiatan, galeri, pengurus, fasilitas, kontak, donasi, profilMasjid, pengaturan);
}

export { db };
```

Importing `lib/db` directly (relative path, matching existing tests) avoids any alias ambiguity in the test files themselves. Route handlers still use `@/lib/db` internally; that resolves fine under tsx.

> **NOTE:** `db.delete(table)` with no `where` deletes all rows. Safe for tests. Always reset in a `before()` hook at the top of each `describe`/test group so scenarios are independent.

---

## 4. Conventions (follow exactly)

1. **Imports at top of every test file:**
   ```ts
   import assert from 'node:assert/strict';
   import { test, before, beforeEach } from 'node:test';
   ```
2. **Reset before each scenario.** Put `before(async () => { await reset(<table>); })` (or `beforeEach` when a group creates+deletes repeatedly) at the start of each test group. Never rely on leftover data.
3. **Assertion style:** `assert.equal(status, 201)`, `assert.ok(Array.isArray(body))`, `assert.deepEqual(...)`. Match the two existing test files.
4. **No console noise.** Routes `console.error` on caught exceptions; that is expected for 500-path tests. Do not silence.
5. **Names:** file `test/api/<feature>.test.ts`; tests titled in English, e.g. `'POST /api/berita returns 201 and a unique slug'`.
6. **Never call the real HTTP server.** Always invoke the handler function directly via `call()`.
7. **Each test file is independent** — the Node runner gives each file its own module registry, so file-scoped `mock.module` calls do not leak.

---

## 5. Scope — Complete Test Matrix

For every entity below, cover: **list empty**, **list with seeded rows**, **create success**, **create validation failure (400)**, **update success**, **update not-found (404)**, **delete success**, **delete not-found (404)**, plus any entity-specific behavior (slugs, enums, defaults, upsert).

### 5.1 `test/lib/slug.test.ts` (NEW — unit, no DB)

Import from `../../lib/slug`: `slugify`, `generateSlug`, `uniqueSlug`.

| # | Scenario | Expectation |
|---|---|---|
| 1 | `slugify('Kajian Akbar! Keluarga')` | `'kajian-akbar-keluarga'` |
| 2 | `slugify('  Hello   World  ')` | `'hello-world'` |
| 3 | `slugify('a@b#c$d')` | `'abcd'` (symbols stripped) |
| 4 | `slugify('foo--bar  baz')` | `'foo-bar-baz'` (collapse repeats) |
| 5 | `generateSlug('Judul', 9)` | equals `slugify('Judul')` (id ignored) |
| 6 | `uniqueSlug('base', [])` | `'base'` |
| 7 | `uniqueSlug('base', ['base'])` | `'base-2'` |
| 8 | `uniqueSlug('base', ['base','base-2'])` | `'base-3'` |
| 9 | `uniqueSlug('base', ['', null as any])` | `'base'` (falsy filtered) |

### 5.2 `test/lib/audit.test.ts` (NEW — integration)

Reset `user`, `berita` first. Seed one `user` row (raw insert), then insert a `berita` row whose `createdById`/`updatedById` = that user id. Call `withActorNames(rows)` → assert `createdByName`/`updatedByName` equal the seeded name. Also test rows with `null` actor → names are `null`. Test `getActor()` returns `null` under the mocked (no-session) environment.

### 5.3 `test/lib/dashboard.test.ts` (NEW — integration)

- `resetContent()` then `getDashboardStats()` → all four counts `0`.
- Insert 2 berita, 1 kegiatan → counts reflect exactly.
- `getRecentActivity(8)`: insert rows across entities with distinct `updatedAt`; assert ordering by `updatedAt DESC`, limit respected, `action` field = `'create'` when `updatedById===createdById` and timestamps within 1s, else `'update'`.

### 5.4 `test/api/berita.test.ts`

Import `{ GET, POST }` from `../../app/api/berita/route` and `{ GET as GET_ID, PUT, DELETE }` from `../../app/api/berita/[id]/route`. Reset `berita` in `before`.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200, `[]` |
| 2 | POST missing title+desc | 400, `error` set |
| 3 | POST valid | 201, has `slug`, persisted (GET shows 1 row) |
| 4 | POST twice same title | second slug ends `-2` (uniqueSlug) |
| 5 | GET by numeric id | 200, returns that row |
| 6 | GET by exact slug | 200 |
| 7 | GET by legacy `title-<id>` slug | 200 (resolves trailing id) |
| 8 | GET unknown id | 404 |
| 9 | PUT valid (numeric id) | 200, fields updated |
| 10 | PUT non-numeric id | 400 `'Invalid ID'` |
| 11 | PUT missing id | 404 |
| 12 | DELETE existing | 200, `{ message, deleted }` |
| 13 | DELETE non-numeric | 400 |
| 14 | DELETE missing | 404 |
| 15 | (audit) row created via POST has `createdByName: null` (anonymous) | ok |

### 5.5 `test/api/kegiatan.test.ts`

Import list + `[id]`. Reset `kegiatan`.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200 `[]` |
| 2 | POST missing required (`title`/`type`/`time`/`ust`) | 400 |
| 3 | POST valid `type:'Harian'` | 201, icon defaults `'CircleUser'`, color defaults `'bg-emerald-50 text-emerald-800'`, status `'Aktif'`, featured `false` |
| 4 | POST `type:"Jum'at"` | icon `'Mic'` |
| 5 | POST `type:'Hari Besar'` | icon `'Gift'` |
| 6 | GET ordered by id ASC | order matches insert order |
| 7 | PUT valid | 200 updated |
| 8 | PUT non-numeric id | 400 `'Invalid ID'` |
| 9 | PUT missing | 404 |
| 10 | DELETE existing | 200 `{ message, deleted }` |
| 11 | DELETE missing | 404 |

### 5.6 `test/api/galeri.test.ts`

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200 `[]` |
| 2 | POST missing title | 400 |
| 3 | POST valid with img | 201, img stored as given |
| 4 | POST valid without img | 201, img is one of the 3 default Unsplash URLs |
| 5 | GET ordered id DESC | newest first |
| 6 | DELETE existing | 200 `{ message, deleted }` |
| 7 | DELETE non-numeric | 400 |
| 8 | DELETE missing | 404 |

(Note: galeri `[id]` exports only `DELETE`.)

### 5.7 `test/api/pengurus.test.ts`

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200 `[]` |
| 2 | POST missing `nama`/`foto`/`tingkat` | 400 |
| 3 | POST invalid `tingkat` (e.g. `'boss'`) | 400 `'Tingkat tidak valid'` |
| 4 | POST valid `tingkat:'pimpinan'` | 201, `urutan` defaults 0, `jabatan`/`subBidang` null when omitted |
| 5 | GET ordering: insert `riayah` then `pembina` → returned `pembina` first (tingkat ASC) | ok |
| 6 | PUT valid | 200 |
| 7 | PUT invalid tingkat | 400 |
| 8 | PUT missing | 404 `'Data pengurus tidak ditemukan'` |
| 9 | DELETE existing | 200 `{ message }` |
| 10 | DELETE missing | 404 |

### 5.8 `test/api/fasilitas.test.ts`

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200 `[]` |
| 2 | POST missing title/desc/icon | 400 |
| 3 | POST valid | 201 |
| 4 | PUT valid | 200 |
| 5 | PUT missing | 404 `'Fasilitas tidak ditemukan'` |
| 6 | DELETE existing | 200 `{ message }` |
| 7 | DELETE missing | 404 |

### 5.9 `test/api/kontak.test.ts` (singleton)

Reset `kontak`.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200, deepEqual `getDefaultContactSettings()` (import from `lib/cms/settings`) |
| 2 | PUT missing any field | 400 |
| 3 | PUT valid (first time) | 200, row created, 1 row in table |
| 4 | PUT valid (second time) | 200, **upsert** — still 1 row, fields updated |
| 5 | GET after upsert | returns the updated row |
| 6 | DELETE | 200 `{ ok: true }`, table empty |

### 5.10 `test/api/donasi.test.ts` (singleton)

Same shape as kontak, fields `namaRekening/nomorRekening/atasNamaRekening/qrisImage`, default = `getDefaultDonationSettings()`.

### 5.11 `test/api/profil.test.ts` (singleton)

Reset `profilMasjid`.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200 `{ visi:'', misi:'', history:'' }` |
| 2 | PUT missing visi or misi | 400 |
| 3 | PUT valid first | 200 created |
| 4 | PUT valid second | 200 upsert (1 row) |
| 5 | history defaults `''` when omitted | ok |

(No DELETE on profil.)

### 5.12 `test/api/pengaturan.test.ts`

Reset `pengaturan`. Mock `@/lib/auth` per §3.3 with a mutable session.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET empty | 200, `running_text === DEFAULT_RUNNING_TEXT`, `updatedAt null`, `updatedByName null` |
| 2 | GET after error fallback | (hard to force; optional) returns defaults |
| 3 | PUT with **no session** (session=null) | 401 `'Unauthorized'` |
| 4 | PUT empty/whitespace `running_text` | 400 `'Teks berjalan tidak boleh kosong'` |
| 5 | PUT valid (session set) first | 200, `running_text` stored |
| 6 | PUT valid second (upsert) | 200, 1 row, value updated |
| 7 | GET after PUT returns updater name | `updatedByName === session.user.name` |

### 5.13 `test/api/users.test.ts`

Reset `user` + `account`. Mock `@/lib/auth` per §3.3. Superadmin id used in mock = `'superadmin-001'`.

| # | Scenario | Expect |
|---|---|---|
| 1 | GET with **no session** | 401 |
| 2 | GET with `role:'admin'` | 401 |
| 3 | GET with superadmin, empty table | 200 `[]` |
| 4 | POST superadmin missing field | 400 `'Missing required fields'` |
| 5 | POST invalid role | 400 `'Invalid role'` |
| 6 | POST duplicate email | 400 `'Email already exists'` |
| 7 | POST valid | 201, returns sanitized user (no password field), row persisted |
| 8 | GET by id found / not found | 200 / 404 |
| 9 | PUT valid, password optional | 200, password re-hashed only when provided |
| 10 | PUT change **own** role away from superadmin | 400 `'Cannot change your own role'` |
| 11 | PUT missing user | 404 |
| 12 | DELETE other user | 200 `{ success: true }` |
| 13 | DELETE **self** | 400 `'Cannot delete your own account'` |
| 14 | DELETE missing | 404 |

> For #10/#13 the mocked session user id must equal the id passed in `params`. Use `'superadmin-001'` as the target id.

### 5.14 `test/api/upload.test.ts`

Reset: after each successful upload test, delete files created under `public/uploads/` during the test (filter by a known prefix). Use a marker prefix in the filename? The route controls the name (`<timestamp>_<sanitized>`). Instead, snapshot `fs.readdirSync('public/uploads')` before and after, delete the diff in an `afterEach`.

| # | Scenario | Expect |
|---|---|---|
| 1 | POST with no file | 400 `'Tidak ada file yang diunggah'` |
| 2 | POST file > 2MB | 400 `'Ukuran file melebihi batas 2MB'` |
| 3 | POST wrong mime (e.g. `application/pdf`) | 400 `'Tipe file tidak valid...'` |
| 4 | POST valid 1×1 PNG | 200, `{ url }` startsWith `/uploads/`, file exists on disk |
| 5 | filename sanitization | special chars in `file.name` replaced with `_` |

Build a `File` from a Buffer: `new File([buffer], 'a.png', { type: 'image/png' })`. Send via `FormData`: `fd.append('file', file)`. The `call()` helper is JSON-oriented, so for upload write a small local variant that builds `new Request(url, { method:'POST', body: formData })` (do **not** set content-type; the browser/Node sets the multipart boundary). Use a real 1×1 PNG byte sequence as fixture (a constant `Buffer`).

---

## 6. Skeletons (copy-paste starting points)

### 6.1 Generic CRUD test file skeleton (e.g. fasilitas)

```ts
import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import { GET, POST } from '../../app/api/fasilitas/route';
import { PUT, DELETE } from '../../app/api/fasilitas/[id]/route';
import { reset, db } from '../helpers/db';
import { call } from '../helpers/request';
import { fasilitas } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

before(async () => { await reset(fasilitas); });

test('GET /api/fasilitas empty -> 200 []', async () => {
  await reset(fasilitas);
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('POST /api/fasilitas valid -> 201', async () => {
  await reset(fasilitas);
  const { status, body } = await call(POST, { method: 'POST', body: { title: 'AC', desc: 'Dingin', icon: 'Snowflake' } });
  assert.equal(status, 201);
  assert.equal(body.title, 'AC');
});
// ... continue per matrix
```

### 6.2 Auth-gated file skeleton (users)

```ts
import assert from 'node:assert/strict';
import { test, before, beforeEach } from 'node:test';
import { mock } from 'node:test';

let currentSession: any = { user: { id: 'superadmin-001', role: 'superadmin', name: 'Super' } };

mock.module('@/lib/auth', () => ({
  auth: { api: { getSession: async () => currentSession } },
}));

// IMPORTANT: import routes AFTER mock.module is registered.
const { GET, POST } = await import('../../app/api/users/route');
const { GET: GET_ID, PUT, DELETE } = await import('../../app/api/users/[id]/route');

import { reset } from '../helpers/db';
import { call } from '../helpers/request';
import { user, account } from '../../lib/db/schema';

beforeEach(async () => { currentSession = { user: { id: 'superadmin-001', role: 'superadmin', name: 'Super' } }; await reset(account, user); });

test('GET /api/users without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(GET);
  assert.equal(status, 401);
});
// ... matrix §5.13
```

> Dynamic `await import(...)` after `mock.module` guarantees the mock is installed before the route module (and its `@/lib/auth` import) is evaluated.

---

## 7. Implementation Steps (in order)

1. **Branch:** `git checkout -b test/unit-test-suite` from `main`.
2. Add `tsx` to `devDependencies` in `package.json`; update `test` script per §3.2.
3. Create `test/helpers/register-mocks.ts`, `test/helpers/db.ts`, `test/helpers/request.ts`.
4. Sanity check: run `npm test` — existing 14 tests still pass with the new `--import` preload.
5. Add unit tests: `slug.test.ts`. Run.
6. Add `audit.test.ts`, `dashboard.test.ts`. Run.
7. Add API tests **one file at a time**, running after each: `berita → kegiatan → galeri → pengurus → fasilitas → kontak → donasi → profil → pengaturan → users → upload`. Fix issues as they surface (most likely the auth mock for pengaturan/users).
8. Run full suite green: `npm test`.
9. Commit (may be multiple commits). Push branch.
10. Open PR titled `test: comprehensive unit & integration test suite (TESTS-2026-07-14)`. PR body references this plan id and lists coverage.
11. Do **not** merge without the stakeholder's review step — but the stakeholder has waived review, so once CI/tests are green, the PR is ready for merge by the owner. (Implementation proceeds without mid-step review per stakeholder instruction.)

---

## 8. Acceptance Criteria

- [ ] `npm test` passes with **zero** failures from a clean DB.
- [ ] Every route in §5 has a test file with all listed scenarios.
- [ ] Every scenario resets its table(s) first (grep: each `test/api/*.test.ts` calls `reset(...)` in a `before`/`beforeEach`).
- [ ] No new runtime dependency added except `tsx` (already present transitively) to devDependencies.
- [ ] Existing `test/lib/prayer-times.test.ts` and `test/lib/cms/settings.test.ts` unchanged and still passing.
- [ ] `lib/` source code is **not modified** — tests only. (If a genuine bug is found, note it in the PR but do not fix in this branch unless trivial.)
- [ ] PR opened against `main` from a feature branch.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `mock.module('@/lib/auth')` doesn't resolve `@/` alias | Use dynamic `await import(...)` after mock registration (§6.2). If still failing, import route via relative path in the test (handlers don't care how they're imported). |
| `headers()` throws despite the global mock | Confirm `register-mocks.ts` is loaded via `--import`; the mock must register before any route module evaluates. |
| Tests pollute the dev DB | Acceptable per stakeholder (local docker DB). Document in PR that `npm test` wipes content tables. Optionally set `DATABASE_URL` to a throwaway db in `.env.test`. |
| `NextResponse.json` behaves oddly outside Next | It extends the standard `Response`; `res.status` + `res.text()` work. Verified pattern. |
| `upload` happy path leaves files on disk | Snapshot `public/uploads/` dir before/after; delete diff in `afterEach`. |
| Parallel test files reset the same table concurrently | Node test runner runs files concurrently by default. **Mitigation:** run with `--test-concurrency=1` if cross-file flake appears. Add to script only if needed. |

---

## 10. Out of Scope

- E2E / browser tests (Playwright).
- Testing admin React pages / components.
- Testing `better-auth` internal endpoints (`/api/auth/[...all]`) beyond the handler existing.
- Performance/load tests.
- Fixing the "open CRUD API" security gap (separate task; flagged in §2.1).
