// Global test preload (loaded via `tsx --test --import`).
//
// Outside a real Next.js request there is no request async-storage, so
// `headers()` from next/headers throws. We monkeypatch the cached CJS export
// of `next/headers` to return an empty Headers, so that `getActor()` ->
// `auth.api.getSession()` resolves to a null session (anonymous) — the correct
// behaviour for the open CRUD routes.
//
// tsx compiles `import { headers } from 'next/headers'` to a property read on
// the cached `require('next/headers')` object, so mutating that object here is
// seen by every route handler.
const headersMod = require('next/headers');
headersMod.headers = async () => new Headers();
headersMod.cookies = async () => ({ get: () => undefined, getAll: () => [] });

// Also expose a way for auth-gated test files to control the session returned by
// `auth.api.getSession`. Default = no session (anonymous). Per-file tests can
// set `globalThis.__TEST_SESSION__` to a fake session object.
(globalThis as any).__TEST_SESSION__ = null;
