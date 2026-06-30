import type { Metadata } from "next";
import Link from "next/link";
import MeticulousBootstrap from "@/components/MeticulousBootstrap";

export const metadata: Metadata = {
  title: "Meticulous Demo",
  description: "Sandbox app to try out the Meticulous recorder + Docker CI",
};

// Recording token from Meticulous (Setup -> Recorder). Set it in .env.local:
//   NEXT_PUBLIC_METICULOUS_RECORDING_TOKEN=xxxxxxxx
const METICULOUS_RECORDING_TOKEN =
  process.env.NEXT_PUBLIC_METICULOUS_RECORDING_TOKEN;

// Only record sessions in dev/preview — NEVER in production.
const shouldRecord =
  (process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") &&
  Boolean(METICULOUS_RECORDING_TOKEN);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Raw <script> in <head> so the recorder initializes BEFORE any other
            script -> captures every network response. The way Meticulous recommends.
            data-force-recording forces every session to record (so replay previews
            are always captured) — dev/demo only, never in production. */}
        {shouldRecord && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            data-recording-token={METICULOUS_RECORDING_TOKEN}
            data-is-production-environment="false"
            data-force-recording="true"
            src="https://snippet.meticulous.ai/v1/meticulous.js"
          />
        )}
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#1a1a2e",
        }}
      >
        <MeticulousBootstrap />
        <nav
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f8f8fb",
          }}
        >
          <Link href="/" data-testid="link-home-nav">
            Home
          </Link>
          <Link href="/login" data-testid="link-login-nav">
            Login
          </Link>
          <Link href="/dashboard" data-testid="link-dashboard-nav">
            Dashboard
          </Link>
        </nav>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
