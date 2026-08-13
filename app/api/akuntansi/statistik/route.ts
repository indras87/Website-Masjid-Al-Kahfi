import { NextResponse } from "next/server";
import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { akuntansiKategori, akuntansiTransaksi } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const BULAN_REGEX = /^\d{4}-\d{2}$/;

/** Parse "YYYY-MM" menjadi rentang [awal bulan, awal bulan berikutnya). */
function parseBulanRange(bulan: string): { start: Date; end: Date } | null {
  if (!BULAN_REGEX.test(bulan)) return null;
  const [y, m] = bulan.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

/**
 * GET ?bulan=YYYY-MM&tahun=YYYY
 * - kategori: breakdown pengeluaran & pemasukan per kategori pada bulan terpilih (untuk pie chart).
 * - bulanan: total pemasukan/pengeluaran/saldo per bulan pada tahun terpilih (untuk status perbulan).
 */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");
    const tahunParam = searchParams.get("tahun");

    if (!bulan) return NextResponse.json({ error: "Parameter bulan wajib diisi (YYYY-MM)" }, { status: 400 });
    const range = parseBulanRange(bulan);
    if (!range) return NextResponse.json({ error: "Format bulan tidak valid (YYYY-MM)" }, { status: 400 });

    const tahun = tahunParam ? Number(tahunParam) : Number(bulan.split("-")[0]);
    if (!Number.isInteger(tahun)) return NextResponse.json({ error: "Parameter tahun tidak valid" }, { status: 400 });

    const kategoriRows = await db
      .select({
        kategoriId: akuntansiTransaksi.kategoriId,
        kategoriNama: akuntansiKategori.nama,
        jenis: akuntansiTransaksi.jenis,
        total: sql<string>`coalesce(sum(${akuntansiTransaksi.jumlah}), 0)`,
      })
      .from(akuntansiTransaksi)
      .leftJoin(akuntansiKategori, sql`${akuntansiTransaksi.kategoriId} = ${akuntansiKategori.id}`)
      .where(and(gte(akuntansiTransaksi.tanggal, range.start), lt(akuntansiTransaksi.tanggal, range.end)))
      .groupBy(akuntansiTransaksi.kategoriId, akuntansiKategori.nama, akuntansiTransaksi.jenis);

    const kategori = kategoriRows.map((r) => ({
      kategoriId: r.kategoriId,
      kategoriNama: r.kategoriNama || "Tanpa kategori",
      jenis: r.jenis,
      total: Number(r.total),
    }));

    const tahunStart = new Date(Date.UTC(tahun, 0, 1));
    const tahunEnd = new Date(Date.UTC(tahun + 1, 0, 1));

    const bulananRows = await db
      .select({
        bulan: sql<number>`extract(month from ${akuntansiTransaksi.tanggal})`,
        jenis: akuntansiTransaksi.jenis,
        total: sql<string>`coalesce(sum(${akuntansiTransaksi.jumlah}), 0)`,
      })
      .from(akuntansiTransaksi)
      .where(and(gte(akuntansiTransaksi.tanggal, tahunStart), lt(akuntansiTransaksi.tanggal, tahunEnd)))
      .groupBy(sql`extract(month from ${akuntansiTransaksi.tanggal})`, akuntansiTransaksi.jenis);

    const bulananMap = new Map<number, { pemasukan: number; pengeluaran: number }>();
    for (let i = 1; i <= 12; i++) bulananMap.set(i, { pemasukan: 0, pengeluaran: 0 });
    for (const r of bulananRows) {
      const entry = bulananMap.get(Number(r.bulan));
      if (!entry) continue;
      if (r.jenis === "pemasukan") entry.pemasukan = Number(r.total);
      else entry.pengeluaran = Number(r.total);
    }

    const bulanan = Array.from(bulananMap.entries()).map(([b, v]) => ({
      bulan: b,
      pemasukan: v.pemasukan,
      pengeluaran: v.pengeluaran,
      saldo: v.pemasukan - v.pengeluaran,
    }));

    return NextResponse.json({ kategori, bulanan, tahun });
  } catch (error: any) {
    console.error("Error fetching statistik akuntansi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
