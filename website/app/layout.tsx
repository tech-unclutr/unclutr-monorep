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
  "SquareUp is an AI-powered customer research platform for consumer companies. Run voice and video interviews with your customers in English and Hindi, get real-time transcripts and theme analysis, and turn raw insight into clear priorities for product, marketing, and sales — at a fraction of agency cost.";

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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: siteName,
                alternateName: ["SquareUp AI", "Join SquareUp", "joinsquareup"],
                url: siteUrl,
                logo: `${siteUrl}/su_logo_transparent.svg`,
                image: `${siteUrl}/og-image.png`,
                description,
                slogan: "Customer Understanding for Consumer Companies",
                foundingDate: "2024",
                knowsAbout: [
                  "Customer Research",
                  "Consumer Insights",
                  "AI-Powered User Interviews",
                  "Voice of Customer",
                  "Product Research",
                  "Qualitative Research",
                  "Multilingual Voice AI",
                ],
                areaServed: ["IN", "US", "Worldwide"],
                sameAs: [
                  "https://www.linkedin.com/company/joinsquareup",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "hello@joinsquareup.com",
                  contactType: "sales",
                  url: siteUrl,
                  availableLanguage: ["English", "Hindi"],
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: siteName,
                url: siteUrl,
                description,
                publisher: { "@type": "Organization", name: siteName, url: siteUrl },
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SquareUp",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                url: siteUrl,
                description:
                  "AI-powered customer research platform that conducts voice and video interviews with your customers, transcribes and analyzes every conversation, and turns insights into clear priorities for product, marketing, and sales teams.",
                offers: { "@type": "Offer", priceCurrency: "INR", price: "0", availability: "https://schema.org/InStock" },
                creator: { "@type": "Organization", name: siteName, url: siteUrl },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What is SquareUp?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "SquareUp (joinsquareup.com) is an AI-powered customer research platform for consumer companies. It conducts voice and video interviews with your customers in English and Hindi, transcribes and analyzes every conversation in real time, and turns raw insight into clear, prioritized actions for product, marketing, and sales teams.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is SquareUp the same as Square Inc. (squareup.com)?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. SquareUp at joinsquareup.com is a customer research and consumer insights company, completely separate from Square Inc. (now Block, Inc.) at squareup.com, which is a payments and point-of-sale company. The two companies operate in different industries and are unrelated.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What does SquareUp do?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "SquareUp runs AI-led customer research — booking interviews with your customers, conducting them in voice or video, transcribing and analyzing the conversations, and producing prioritized insights for product, marketing, and sales teams. It replaces traditional research agencies like Kantar, Ipsos, and Nielsen at a fraction of the cost and time.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Who is SquareUp for?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Consumer companies, D2C brands, CPG and food & beverage teams, QSR brands, NPD and brand teams, and Series A–C founders who need fast, multilingual, decision-ready customer research.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How much does SquareUp cost?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "SquareUp pilots start at ₹1.5–3 lakh — roughly one-tenth the cost of comparable traditional agency research, with results in days instead of 8–12 weeks.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What languages does SquareUp support?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "SquareUp conducts customer interviews in English and Hindi, with multilingual voice AI built for the Indian mid-market consumer landscape and designed to scale to additional languages.",
                    },
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "SquareUp", item: siteUrl },
                ],
              },
            ]),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <AnalyticsProvider />
        {/* SSR-rendered company content for search engines and crawlers (Apollo, Googlebot, etc.)
            The homepage above is a client-rendered SPA; this block ensures bots that don't execute
            JavaScript can still extract company info. Visually hidden but fully accessible. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          <h1>SquareUp — AI Customer Research for Consumer Companies</h1>
          <h2>What is SquareUp?</h2>
          <p>
            SquareUp (joinsquareup.com) is an AI-powered customer research platform that helps
            consumer companies understand exactly what their customers think, want, and need.
            SquareUp runs voice and video interviews with your customers, transcribes and analyzes
            every conversation in real time, and turns the raw signal into clear, prioritized
            actions for your product, marketing, and sales teams.
          </p>
          <p>
            <strong>SquareUp is not Square Inc.</strong> SquareUp at{" "}
            <a href="https://joinsquareup.com">joinsquareup.com</a> is a customer research and
            consumer insights company, separate and unrelated to Square Inc. (now Block, Inc.) at
            squareup.com, which is a payments and point-of-sale company in a different industry.
          </p>
          <h2>What SquareUp does</h2>
          <ul>
            <li>
              <strong>AI Research Interviewer:</strong> Books calls with your customers, conducts
              structured 1:1 interviews in English and Hindi, asks intelligent follow-ups, and
              captures the full conversation as text, audio, and tagged moments.
            </li>
            <li>
              <strong>Interview Studio:</strong> A live workspace for human researchers, with
              AI-suggested follow-ups, real-time transcription, and automatic flagging of
              important moments.
            </li>
            <li>
              <strong>Customer Intelligence Library:</strong> Every call, transcript, and clip
              stored, searchable, and instantly retrievable across the whole company.
            </li>
            <li>
              <strong>Theme & Pattern Discovery:</strong> Surfaces hidden patterns across hundreds
              of conversations — what 50 customers said differently but meant the same.
            </li>
            <li>
              <strong>Cross-team Distribution:</strong> Routes product feedback to product, buying
              signals to sales, and brand insights to marketing — automatically.
            </li>
          </ul>
          <h2>Who SquareUp is for</h2>
          <p>
            Consumer companies, D2C brands, CPG and food &amp; beverage teams, QSR brands,
            mid-market consumer businesses, NPD teams, brand teams, and Series A–C founders who
            need fast, multilingual, decision-ready customer research at a fraction of the cost of
            traditional agencies like Kantar, Ipsos, or Nielsen.
          </p>
          <h2>Research methods we run</h2>
          <p>
            Problem &amp; needs discovery, buyer persona development, category whitespace analysis,
            concept testing, product &amp; sensory testing, packaging &amp; pricing research, NPS
            and churn deep-dives, onboarding interviews, customer feedback synthesis, jobs-to-be-done
            interviews, and ongoing voice-of-customer programs.
          </p>
          <h2>Why teams choose SquareUp</h2>
          <p>
            Traditional agency research costs ₹30 lakh and takes 8–12 weeks per study. SquareUp runs
            comparable research in days, at pilot prices starting at ₹1.5–3 lakh, with results that
            arrive in a shareable AI-synthesized report — not a 90-slide PDF that gets archived.
          </p>
          <h2>About SquareUp</h2>
          <p>
            SquareUp (joinsquareup.com) is a customer research and consumer insights company
            building AI agents that act as the in-house Customer Understanding team for consumer
            brands. Founded 2024. Contact:{" "}
            <a href="mailto:hello@joinsquareup.com">hello@joinsquareup.com</a>.
          </p>
        </div>
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
      {/* Apollo.io website tracker — identifies visiting companies (global) and people (US).
          Loads after hydration so it doesn't compete with critical resources. */}
      <Script id="apollo-tracker" strategy="afterInteractive">
        {`function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,o.onload=function(){window.trackingFunctions.onLoad({appId:"6a1405904e2b90000c97f447"})},document.head.appendChild(o)}initApollo();`}
      </Script>
    </html>
  );
}
