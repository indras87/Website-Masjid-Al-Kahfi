import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { akunKas, akuntansiKategori, akuntansiTransaksi } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const JENIS_VALID = ["pemasukan", "pengeluaran"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(akuntansiTransaksi).where(eq(akuntansiTransaksi.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Error get transaksi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body?.tanggal !== undefined) {
      const tanggal = new Date(String(body.tanggal));
      if (Number.isNaN(tanggal.getTime())) {
        return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
      }
      updates.tanggal = tanggal;
    }
    if (body?.akunKasId !== undefined) {
      const akunKasId = Number(body.akunKasId);
      if (!Number.isInteger(akunKasId)) {
        return NextResponse.json({ error: "Akun kas tidak valid" }, { status: 400 });
      }
      const akunRows = await db.select().from(akunKas).where(eq(akunKas.id, akunKasId)).limit(1);
      if (!akunRows.length) {
        return NextResponse.json({ error: "Akun kas tidak ditemukan" }, { status: 400 });
      }
      updates.akunKasId = akunKasId;
    }
    if (body?.kategoriId !== undefined) {
      if (body.kategoriId === null) {
        updates.kategoriId = null;
      } else {
        const kategoriId = Number(body.kategoriId);
        if (!Number.isInteger(kategoriId)) {
          return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
        }
        const katRows = await db.select().from(akuntansiKategori).where(eq(akuntansiKategori.id, kategoriId)).limit(1);
        if (!katRows.length) {
          return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
        }
        updates.kategoriId = kategoriId;
      }
    }
    if (body?.keterangan !== undefined) {
      const keterangan = String(body.keterangan).trim();
      if (keterangan.length < 3 || keterangan.length > 500) {
        return NextResponse.json({ error: "Keterangan wajib diisi (3–500 karakter)" }, { status: 400 });
      }
      updates.keterangan = keterangan;
    }
    if (body?.jenis !== undefined) {
      if (!JENIS_VALID.includes(body.jenis)) {
        return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 });
      }
      updates.jenis = body.jenis;
    }
    if (body?.jumlah !== undefined) {
      const jumlah = Number(body.jumlah);
      if (!Number.isInteger(jumlah) || jumlah <= 0) {
        return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
      }
      updates.jumlah = jumlah;
    }
    if (body?.buktiUrl !== undefined) {
      updates.buktiUrl = body.buktiUrl ? String(body.buktiUrl).trim() : null;
    }

    const updated = await db
      .update(akuntansiTransaksi)
      .set({ ...updates, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(akuntansiTransaksi.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch transaksi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db
      .delete(akuntansiTransaksi)
      .where(eq(akuntansiTransaksi.id, numId))
      .returning({ id: akuntansiTransaksi.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete transaksi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
