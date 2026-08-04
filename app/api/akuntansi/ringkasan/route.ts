import { NextResponse } from "next/server";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { akunKas, akuntansiTransaksi } from "@/lib/db/schema";
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

/** GET ?bulan=YYYY-MM — ringkasan pemasukan/pengeluaran/saldo per akun kas aktif + total keseluruhan. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");

    const dateConditions = [];
    if (bulan) {
      const range = parseBulanRange(bulan);
      if (!range) return NextResponse.json({ error: "Format bulan tidak valid (YYYY-MM)" }, { status: 400 });
      dateConditions.push(gte(akuntansiTransaksi.tanggal, range.start));
      dateConditions.push(lt(akuntansiTransaksi.tanggal, range.end));
    }

    const akunRows = await db
      .select()
      .from(akunKas)
      .where(eq(akunKas.aktif, true))
      .orderBy(asc(akunKas.urutan), asc(akunKas.id));

    const agg = await db
      .select({
        akunKasId: akuntansiTransaksi.akunKasId,
        pemasukan: sql<string>`coalesce(sum(case when ${akuntansiTransaksi.jenis} = 'pemasukan' then ${akuntansiTransaksi.jumlah} else 0 end), 0)`,
        pengeluaran: sql<string>`coalesce(sum(case when ${akuntansiTransaksi.jenis} = 'pengeluaran' then ${akuntansiTransaksi.jumlah} else 0 end), 0)`,
      })
      .from(akuntansiTransaksi)
      .where(dateConditions.length ? and(...dateConditions) : undefined)
      .groupBy(akuntansiTransaksi.akunKasId);

    const aggByAkun = new Map(agg.map((a) => [a.akunKasId, a]));

    const perAkun = akunRows.map((akun) => {
      const a = aggByAkun.get(akun.id);
      const pemasukan = a ? Number(a.pemasukan) : 0;
      const pengeluaran = a ? Number(a.pengeluaran) : 0;
      return {
        akunKasId: akun.id,
        akunKasNama: akun.nama,
        pemasukan,
        pengeluaran,
        saldo: pemasukan - pengeluaran,
      };
    });

    const total = perAkun.reduce(
      (acc, r) => ({
        pemasukan: acc.pemasukan + r.pemasukan,
        pengeluaran: acc.pengeluaran + r.pengeluaran,
        saldo: acc.saldo + r.saldo,
      }),
      { pemasukan: 0, pengeluaran: 0, saldo: 0 }
    );

    return NextResponse.json({ perAkun, total });
  } catch (error: any) {
    console.error("Error fetching ringkasan:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
