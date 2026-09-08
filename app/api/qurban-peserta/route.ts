import { NextResponse } from "next/server";
import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from "@/lib/db/schema";
import { getActor, withActorNames } from "@/lib/audit";
import { normalizeWa, parseShohibulList, validatePeserta } from "@/lib/qurban";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "aktif", "selesai", "berhenti"];

/** GET admin: daftar peserta + saldo agregat + daftar nama shohibul. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode");
    const status = searchParams.get("status");

    const conds = [];
    if (periode) conds.push(eq(qurbanPeserta.periode, periode));
    if (status && STATUS_VALID.includes(status)) conds.push(eq(qurbanPeserta.status, status as any));

    const rows = await db
      .select({
        ...getTableColumns(qurbanPeserta),
        saldo: sql<string>`coalesce(sum(${qurbanSetoran.jumlah}), 0)`,
      })
      .from(qurbanPeserta)
      .leftJoin(qurbanSetoran, eq(qurbanSetoran.pesertaId, qurbanPeserta.id))
      .where(conds.length ? and(...conds) : undefined)
      .groupBy(qurbanPeserta.id)
      .orderBy(desc(qurbanPeserta.createdAt));

    // Daftar shohibul per peserta (query kedua, digroup di JS)
    const ids = rows.map((r) => r.id);
    const shohibulRows = ids.length
      ? await db
          .select({ pesertaId: qurbanShohibul.pesertaId, nama: qurbanShohibul.nama })
          .from(qurbanShohibul)
          .where(inArray(qurbanShohibul.pesertaId, ids))
          .orderBy(qurbanShohibul.urutan, qurbanShohibul.id)
      : [];
    const shohibulByPeserta = new Map<number, string[]>();
    shohibulRows.forEach((s) => {
      const arr = shohibulByPeserta.get(s.pesertaId) ?? [];
      arr.push(s.nama);
      shohibulByPeserta.set(s.pesertaId, arr);
    });

    const enriched = await withActorNames(
      rows.map((r) => ({ ...r, saldo: Number(r.saldo), shohibul: shohibulByPeserta.get(r.id) ?? [] }))
    );
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Error fetching peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST publik: pendaftaran mandiri peserta + shohibul. */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const peserta = {
      namaPeserta: String(body?.namaPeserta ?? "").trim(),
      alamat: String(body?.alamat ?? "").trim(),
      whatsapp: normalizeWa(String(body?.whatsapp ?? "").trim()),
      namaBank: String(body?.namaBank ?? "").trim(),
      nomorRekening: String(body?.nomorRekening ?? "").replace(/\s+/g, ""),
      namaPemilikRekening: String(body?.namaPemilikRekening ?? "").trim(),
      periode: String(body?.periode ?? "").trim(),
    };

    const invalid = validatePeserta(peserta);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const { list: shohibulList, error: shohibulError } = parseShohibulList(body?.shohibul);
    if (shohibulError) return NextResponse.json({ error: shohibulError }, { status: 400 });

    const [created] = await db
      .insert(qurbanPeserta)
      .values({ ...peserta, status: "baru", createdById: null, updatedById: null })
      .returning({ id: qurbanPeserta.id });

    await db.insert(qurbanShohibul).values(
      shohibulList.map((nama, i) => ({ pesertaId: created.id, nama, urutan: i }))
    );

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
