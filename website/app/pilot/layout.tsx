import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "48-Hour Customer Research Pilot | SquareUp",
  description:
    "Get a decision-ready customer research brief in 48 hours. 10x less cost than traditional agencies. AI-powered interviews with analyst-grade depth.",
  openGraph: {
    title: "48-Hour Customer Research Pilot | SquareUp",
    description:
      "Get a decision-ready customer research brief in 48 hours. 10x less cost than traditional agencies.",
    url: "https://joinsquareup.com/pilot",
    siteName: "SquareUp",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=4",
        width: 1200,
        height: 630,
        alt: "SquareUp — 48-Hour Customer Research Pilot",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "48-Hour Customer Research Pilot | SquareUp",
    description:
      "Get a decision-ready customer research brief in 48 hours. 10x less cost than traditional agencies.",
    images: ["/og-image.png?v=4"],
  },
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
};

export default function PilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
