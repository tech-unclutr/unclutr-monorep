import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

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
        url: "/og-image.png?v=4",
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
    images: ["/og-image.png?v=4"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#FF6B00",
    "msapplication-TileColor": "#FF6B00",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preload" href="/su_wordmark_transparent.svg" as="image" type="image/svg+xml" crossOrigin="anonymous" />
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
      <body suppressHydrationWarning>
        {children}
        <AnalyticsProvider />
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-61SMHLG5RJ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-61SMHLG5RJ');
        `}
      </Script>
    </html>
  );
}
