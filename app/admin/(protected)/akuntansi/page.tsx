"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet, Settings2 } from "lucide-react";

type Jenis = "pemasukan" | "pengeluaran";

type Ringkasan = {
  perAkun: Array<{ akunKasId: number; akunKasNama: string; pemasukan: number; pengeluaran: number; saldo: number }>;
  total: { pemasukan: number; pengeluaran: number; saldo: number };
};

type KategoriStat = {
  kategoriId: number | null;
  kategoriNama: string;
  jenis: Jenis;
  total: number;
};

type BulananStat = {
  bulan: number; // 1-12
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
};

type Statistik = {
  kategori: KategoriStat[];
  bulanan: BulananStat[];
  tahun: number;
};

// Palet kategorikal tervalidasi (urutan tetap, jangan diputar/di-generate).
const CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];
const OTHER_COLOR = "#c3c2b7";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const compact = (n: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function currentBulan(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AkuntansiOverviewPage() {
  const [bulan, setBulan] = useState(currentBulan());
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [ringkasanRes, statistikRes] = await Promise.all([
          fetch(`/api/akuntansi/ringkasan?bulan=${bulan}`),
          fetch(`/api/akuntansi/statistik?bulan=${bulan}`),
        ]);
        if (!ringkasanRes.ok || !statistikRes.ok) throw new Error("Gagal memuat data akuntansi.");
        const ringkasanData = await ringkasanRes.json();
        const statistikData = await statistikRes.json();
        if (!cancelled) {
          setRingkasan(ringkasanData);
          setStatistik(statistikData);
        }
      } catch (e) {
        if (!cancelled) setError("Gagal memuat data akuntansi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bulan]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Akuntansi / Kas</h1>
          <p className="text-gray-600 text-sm">Ringkasan pembukuan pemasukan dan pengeluaran kas DKM</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
          <Link
            href="/admin/akuntansi/transaksi"
            className="flex items-center gap-1.5 bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            Transaksi <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">Memuat data...</div>
      ) : (
        <>
          {ringkasan && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Total Pemasukan" value={ringkasan.total.pemasukan} tone="emerald" />
                <SummaryCard label="Total Pengeluaran" value={ringkasan.total.pengeluaran} tone="red" />
                <SummaryCard label="Total Saldo" value={ringkasan.total.saldo} tone="gold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ringkasan.perAkun.map((r) => (
                  <div key={r.akunKasId} className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-emerald-950 mb-2 flex items-center gap-1.5">
                      <Wallet size={14} /> {r.akunKasNama}
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-emerald-700">
                        <span>Pemasukan</span>
                        <span className="font-medium">{rupiah(r.pemasukan)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Pengeluaran</span>
                        <span className="font-medium">{rupiah(r.pengeluaran)}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 border-t border-gray-100 pt-1 mt-1 font-semibold">
                        <span>Saldo</span>
                        <span>{rupiah(r.saldo)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KategoriPieChart data={statistik?.kategori || []} />
            <StatusBulananChart data={statistik?.bulanan || []} tahun={statistik?.tahun} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings2 size={16} /> Kelola akun kas &amp; kategori transaksi
            </div>
            <Link
              href="/admin/akuntansi/transaksi"
              className="text-sm font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Buka Master Data →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "red" | "gold" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-600" : "text-emerald-950";
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{rupiah(value)}</p>
    </div>
  );
}

/** Pie chart pangsa transaksi per kategori (pengeluaran diutamakan; fallback ke pemasukan bila tidak ada pengeluaran). */
function KategoriPieChart({ data }: { data: KategoriStat[] }) {
  const [jenis, setJenis] = useState<Jenis>("pengeluaran");
  const [showTable, setShowTable] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      data
        .filter((d) => d.jenis === jenis && d.total > 0)
        .sort((a, b) => b.total - a.total),
    [data, jenis]
  );

  // Cap di 7 slot + "Lainnya" agar warna kategorikal tidak digenerasi ulang.
  const MAX_SLOTS = 7;
  const top = filtered.slice(0, MAX_SLOTS);
  const rest = filtered.slice(MAX_SLOTS);
  const restTotal = rest.reduce((s, r) => s + r.total, 0);
  const slices: Array<{ label: string; value: number; color: string }> = top.map((k, i) => ({
    label: k.kategoriNama,
    value: k.total,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));
  if (restTotal > 0) slices.push({ label: "Lainnya", value: restTotal, color: OTHER_COLOR });

  const total = slices.reduce((s, x) => s + x.value, 0);

  const size = 200;
  const r = 80;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = 1.2; // celah antar-irisan (spacer)

  let angleCursor = -90; // mulai dari jam 12
  const arcs = slices.map((s) => {
    const fraction = total > 0 ? s.value / total : 0;
    const sweep = fraction * 360;
    const start = angleCursor + gapDeg / 2;
    const end = angleCursor + sweep - gapDeg / 2;
    angleCursor += sweep;
    return { ...s, start, end, fraction };
  });

  const toXY = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const arcPath = (start: number, end: number) => {
    if (end <= start) return "";
    const [x1, y1] = toXY(start);
    const [x2, y2] = toXY(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-emerald-950">Pangsa per Kategori</h3>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setJenis("pengeluaran")}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              jenis === "pengeluaran" ? "bg-emerald-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setJenis("pemasukan")}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              jenis === "pemasukan" ? "bg-emerald-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">Belum ada data pada periode ini.</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            {arcs.map((a, i) => (
              <path
                key={a.label}
                d={arcPath(a.start, a.end)}
                fill={a.color}
                stroke="#fcfcfb"
                strokeWidth={hoverIdx === i ? 3 : 2}
                opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.55}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="transition-opacity cursor-pointer"
              >
                <title>{`${a.label}: ${rupiah(a.value)} (${(a.fraction * 100).toFixed(1)}%)`}</title>
              </path>
            ))}
          </svg>

          <div className="flex-1 w-full space-y-1.5">
            {arcs.map((a, i) => (
              <div
                key={a.label}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className={`flex items-center justify-between text-xs px-1.5 py-1 rounded transition ${
                  hoverIdx === i ? "bg-gray-50" : ""
                }`}
              >
                <span className="flex items-center gap-2 text-gray-700 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="truncate">{a.label}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 text-gray-900 font-medium">
                  {rupiah(a.value)}
                  <span className="text-gray-400 font-normal w-10 text-right">
                    {(a.fraction * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slices.length > 0 && (
        <button
          onClick={() => setShowTable((v) => !v)}
          className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
        >
          {showTable ? "Sembunyikan tabel" : "Lihat sebagai tabel"}
        </button>
      )}

      {showTable && slices.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1.5 pr-2 font-semibold">Kategori</th>
                <th className="py-1.5 px-2 font-semibold text-right">Jumlah</th>
                <th className="py-1.5 pl-2 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {arcs.map((a) => (
                <tr key={a.label} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2 text-gray-800">{a.label}</td>
                  <td className="py-1.5 px-2 text-right text-gray-900">{rupiah(a.value)}</td>
                  <td className="py-1.5 pl-2 text-right text-gray-500">{(a.fraction * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Grafik batang status bulanan (pemasukan vs pengeluaran) sepanjang tahun berjalan. */
function StatusBulananChart({ data, tahun }: { data: BulananStat[]; tahun?: number }) {
  const [showTable, setShowTable] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxVal = Math.max(1, ...data.flatMap((d) => [d.pemasukan, d.pengeluaran]));
  const niceMax = Math.ceil(maxVal / Math.pow(10, Math.floor(Math.log10(maxVal || 1)))) * Math.pow(10, Math.floor(Math.log10(maxVal || 1)));

  const chartH = 180;
  const barW = 10;
  const gap = 4;
  const groupW = barW * 2 + gap;

  const PEMASUKAN_COLOR = CATEGORICAL[0]; // blue
  const PENGELUARAN_COLOR = CATEGORICAL[1]; // orange

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-emerald-950">Status Perbulan {tahun ? `(${tahun})` : ""}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PEMASUKAN_COLOR }} /> Pemasukan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PENGELUARAN_COLOR }} /> Pengeluaran
          </span>
        </div>
      </div>

      {data.every((d) => d.pemasukan === 0 && d.pengeluaran === 0) ? (
        <div className="py-12 text-center text-sm text-gray-500">Belum ada data pada tahun ini.</div>
      ) : (
        <div className="overflow-x-auto">
          <svg
            width={Math.max(320, data.length * (groupW + 10))}
            height={chartH + 40}
            viewBox={`0 0 ${Math.max(320, data.length * (groupW + 10))} ${chartH + 40}`}
          >
            {/* gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1={0}
                x2={Math.max(320, data.length * (groupW + 10))}
                y1={chartH - chartH * f}
                y2={chartH - chartH * f}
                stroke="#e1e0d9"
                strokeWidth={1}
              />
            ))}
            {data.map((d, i) => {
              const x = i * (groupW + 10) + 10;
              const hPemasukan = niceMax > 0 ? (d.pemasukan / niceMax) * chartH : 0;
              const hPengeluaran = niceMax > 0 ? (d.pengeluaran / niceMax) * chartH : 0;
              const isHover = hoverIdx === i;
              return (
                <g
                  key={d.bulan}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  opacity={hoverIdx === null || isHover ? 1 : 0.6}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={chartH - hPemasukan}
                    width={barW}
                    height={hPemasukan}
                    rx={3}
                    fill={PEMASUKAN_COLOR}
                  >
                    <title>{`${BULAN_LABEL[d.bulan - 1]}: Pemasukan ${rupiah(d.pemasukan)}`}</title>
                  </rect>
                  <rect
                    x={x + barW + gap}
                    y={chartH - hPengeluaran}
                    width={barW}
                    height={hPengeluaran}
                    rx={3}
                    fill={PENGELUARAN_COLOR}
                  >
                    <title>{`${BULAN_LABEL[d.bulan - 1]}: Pengeluaran ${rupiah(d.pengeluaran)}`}</title>
                  </rect>
                  <text
                    x={x + barW + gap / 2}
                    y={chartH + 16}
                    fontSize={10}
                    textAnchor="middle"
                    fill="#52514e"
                  >
                    {BULAN_LABEL[d.bulan - 1]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <button
        onClick={() => setShowTable((v) => !v)}
        className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
      >
        {showTable ? "Sembunyikan tabel" : "Lihat sebagai tabel"}
      </button>

      {showTable && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1.5 pr-2 font-semibold">Bulan</th>
                <th className="py-1.5 px-2 font-semibold text-right">Pemasukan</th>
                <th className="py-1.5 px-2 font-semibold text-right">Pengeluaran</th>
                <th className="py-1.5 pl-2 font-semibold text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.bulan} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2 text-gray-800">{BULAN_LABEL[d.bulan - 1]}</td>
                  <td className="py-1.5 px-2 text-right text-emerald-700">{rupiah(d.pemasukan)}</td>
                  <td className="py-1.5 px-2 text-right text-red-600">{rupiah(d.pengeluaran)}</td>
                  <td className="py-1.5 pl-2 text-right text-gray-900 font-medium">{rupiah(d.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
