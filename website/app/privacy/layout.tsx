import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Privacy | SquareUp",
  description:
    "All SquareUp legal documents in one place — privacy policy, cookie policy, master services agreement, data processing agreement, acceptable use policy, and research participant notices.",
  openGraph: {
    title: "Legal & Privacy | SquareUp",
    description:
      "All SquareUp legal documents in one place — privacy policy, cookie policy, master services agreement, data processing agreement, acceptable use policy, and research participant notices.",
    url: "https://joinsquareup.com/privacy",
    siteName: "SquareUp",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=4",
        width: 1200,
        height: 630,
        alt: "SquareUp Legal & Privacy",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal & Privacy | SquareUp",
    description:
      "All SquareUp legal documents in one place — privacy policy, cookie policy, master services agreement, data processing agreement, acceptable use policy, and research participant notices.",
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
  // hreflang continuity with home + /pilot (en-US, x-default → self)
  alternates: {
    canonical: "/privacy",
    languages: {
      "en-US": "/privacy",
      "x-default": "/privacy",
    },
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
