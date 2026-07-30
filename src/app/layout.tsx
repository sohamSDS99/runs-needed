import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { NAME, TITLE, DESCRIPTION, CANONICAL_BASE } from "@/lib/brand";

// PRD §11.3: SoftwareApplication structured data, free + accessible.
const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: NAME,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: CANONICAL_BASE,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isAccessibleForFree: true,
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(CANONICAL_BASE),
  alternates: { canonical: "/" },
};

// PRD §9.4: permit only 'self' and the Vercel Analytics beacon. 'unsafe-inline'
// is required because a static export has no server to issue per-request
// nonces, and Next inlines its hydration/RSC scripts and critical CSS.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_LD) }}
        />
        {children}
        {/* Page-view beacon only; no custom events, no arguments (ADR-6). */}
        <Analytics />
      </body>
    </html>
  );
}
