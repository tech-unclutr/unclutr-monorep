import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://joinsquareup.com";
const siteName = "SquareUp";
const title = "SquareUp: Customer Understanding for Consumer Companies";
const description =
  "SquareUp turns customer insights into clarity your team can act on. AI-powered research interviews, real-time analysis, and actionable priorities — at the pace of change.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "customer research",
    "consumer insights",
    "user interviews",
    "customer understanding",
    "AI research",
    "product research",
    "consumer companies",
    "customer feedback",
    "research automation",
    "voice of customer",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SquareUp — Customer Understanding for Consumer Companies",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "theme-color": "#FF6B00",
    "msapplication-TileColor": "#FF6B00",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteName,
              url: siteUrl,
              logo: `${siteUrl}/su_logo_transparent.svg`,
              description,
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales",
                url: `${siteUrl}`,
              },
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
