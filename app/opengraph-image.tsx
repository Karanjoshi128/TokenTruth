import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Indigo glow blob */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(79,70,229,0.15)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#4f46e5",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            marginBottom: "32px",
            boxShadow: "0 0 60px rgba(79,70,229,0.5)",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 6.5V12c0 5.25 3.8 10.15 9 11.35 5.2-1.2 9-6.1 9-11.35V6.5L12 2z"
              fill="white"
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

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: "700",
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            Truth
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: "700",
              color: "#818cf8",
              letterSpacing: "-2px",
            }}
          >
            Token
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "#a1a1aa",
            margin: "0",
            letterSpacing: "-0.3px",
            maxWidth: "620px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Instantly verify your API keys across 10+ AI providers
        </p>

        {/* Provider pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "48px",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "800px",
          }}
        >
          {["OpenAI", "Anthropic", "Google", "Cohere", "Mistral", "Groq", "HuggingFace"].map(
            (name) => (
              <div
                key={name}
                style={{
                  padding: "8px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#a1a1aa",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                {name}
              </div>
            )
          )}
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#52525b",
            fontSize: "15px",
          }}
        >
          <span style={{ color: "#22c55e", fontSize: "13px" }}>●</span>
          Keys are never stored · 100% private
        </div>
      </div>
    ),
    { ...size }
  );
}
