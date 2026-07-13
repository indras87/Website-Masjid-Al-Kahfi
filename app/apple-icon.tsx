import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ background: "#064e3b", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, borderRadius: 38 }}>
        <span style={{ color: "#d4af37" }}>🕌</span>
      </div>
    ),
    { ...size }
  );
}
