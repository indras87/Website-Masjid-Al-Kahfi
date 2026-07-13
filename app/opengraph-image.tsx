import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const alt = "Masjid Al-Kahfi Cikoneng";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 60 }}>
        <div style={{ fontSize: 90, marginBottom: 20 }}>🕌</div>
        <div style={{ fontSize: 64, fontWeight: 700, display: "flex" }}>Masjid Al-Kahfi</div>
        <div style={{ fontSize: 32, color: "#d4af37", marginTop: 12 }}>Cikoneng • Kab. Bandung</div>
        <div style={{ fontSize: 24, marginTop: 32, opacity: 0.85 }}>Jadwal Sholat • Kajian • Infaq & Zakat</div>
      </div>
    ),
    { ...size }
  );
}
