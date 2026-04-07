import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { getSession } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: "TruthToken — API Key Validator",
  description:
    "Instantly verify your API keys across 10+ AI providers. Privacy-first: keys are never stored.",
  keywords: ["API key validator", "OpenAI key check", "Anthropic key test", "AI API testing"],
  manifest: "/manifest.json",
  openGraph: {
    title: "TruthToken — API Key Validator",
    description: "Instantly verify your API keys across 10+ AI providers.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruthToken — API Key Validator",
    description: "Instantly verify your API keys across 10+ AI providers.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider session={session}>
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/10 py-4">
              <p className="text-center text-xs text-muted-foreground">
                TruthToken · Keys are{" "}
                <span className="text-foreground font-medium">never stored</span> · Open source
              </p>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
