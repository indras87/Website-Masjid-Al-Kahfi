import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { headers } from "next/headers";

export type Actor = { id: string; name: string | null } | null;

/** Resolve current logged-in admin from the request session. Returns null if no session. */
export async function getActor(): Promise<Actor> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? null };
}

/** Batch-resolve user names; attach createdByName/updatedByName to each row. */
export async function withActorNames<T extends { createdById?: string | null; updatedById?: string | null }>(
  rows: T[]
): Promise<(T & { createdByName: string | null; updatedByName: string | null })[]> {
  const ids = Array.from(
    new Set(rows.flatMap((r) => [r.createdById, r.updatedById]).filter(Boolean) as string[])
  );
  const nameById = new Map<string, string | null>();
  if (ids.length) {
    const users = await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, ids));
    users.forEach((u) => nameById.set(u.id, u.name ?? null));
  }
  return rows.map((r) => ({
    ...r,
    createdByName: (r.createdById && nameById.get(r.createdById)) ?? null,
    updatedByName: (r.updatedById && nameById.get(r.updatedById)) ?? null,
  }));
}
