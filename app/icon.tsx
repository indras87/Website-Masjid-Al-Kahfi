import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ background: "#064e3b", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, borderRadius: 8 }}>
        <span style={{ color: "#d4af37" }}>🕌</span>
      </div>
    ),
    { ...size }
  );
}
