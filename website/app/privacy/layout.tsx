import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Cookies | SquareUp",
  description:
    "How SquareUp handles your information on joinsquareup.com — the Website Privacy Policy and Cookie Policy in one place.",
  openGraph: {
    title: "Privacy & Cookies | SquareUp",
    description:
      "How SquareUp handles your information on joinsquareup.com — the Website Privacy Policy and Cookie Policy in one place.",
    url: "https://joinsquareup.com/privacy",
    siteName: "SquareUp",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=4",
        width: 1200,
        height: 630,
        alt: "SquareUp Privacy & Cookies",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy & Cookies | SquareUp",
    description:
      "How SquareUp handles your information on joinsquareup.com — the Website Privacy Policy and Cookie Policy in one place.",
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
