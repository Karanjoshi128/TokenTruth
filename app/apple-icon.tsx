import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
        }}
      >
        <div
          style={{
            background: "#4f46e5",
            width: "120px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "28px",
            boxShadow: "0 0 40px rgba(79,70,229,0.4)",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 6.5V12c0 5.25 3.8 10.15 9 11.35 5.2-1.2 9-6.1 9-11.35V6.5L12 2z"
              fill="white"
              fillOpacity="0.95"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
