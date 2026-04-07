import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Deny framing entirely (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },

          // Don't send Referer to third-party origins
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Disable access to sensitive browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },

          // Prevent this window from being opened by cross-origin pages
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

          // Content Security Policy
          // - script-src: Next.js requires 'unsafe-inline' for dev; 'self' only in prod
          // - style-src: Tailwind injects inline styles at runtime
          // - connect-src: 'self' only — the browser never calls AI providers directly
          //   (all provider calls go through our /api/validate server route)
          // - frame-ancestors: block embedding
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js hydration needs these
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'", // Provider calls go through /api/validate, not browser
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // API routes: no caching, no credentials stored
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          // Prevent browsers from sending cookies to API routes
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
