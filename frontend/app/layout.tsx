import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";
import { AnalyticsListener } from "@/components/analytics-listener";
import "@/lib/api-logger"; // Enable API and SDK logging

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Unclutr.ai",
  description: "The Decision & Control Layer for D2C Brands",
};

import { AuthProvider } from "@/context/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(inter.variable, outfit.variable, "min-h-screen bg-background font-sans antialiased")}>
        <AuthProvider>
          <AnalyticsListener />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
