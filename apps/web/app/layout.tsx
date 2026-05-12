import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "VaultKix — Sneaker Marketplace",
    template: "%s | VaultKix",
  },
  description:
    "Find unbeatable deals on premium sneakers. Bid, offer, and negotiate your way to the best prices on branded footwear.",
  keywords: [
    "sneakers",
    "shoes",
    "marketplace",
    "bid",
    "offer",
    "Nike",
    "Jordan",
    "Adidas",
    "Puma",
    "Reebok",
    "sneaker deals",
    "sneaker trading",
    "sneaker reselling",
  ],
  authors: [{ name: "VaultKix" }],
  creator: "VaultKix",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "VaultKix",
    title: "VaultKix — Sneaker Marketplace",
    description:
      "Find unbeatable deals on premium sneakers. Bid, offer, and negotiate your way to the best prices.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VaultKix Sneaker Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultKix — Sneaker Marketplace",
    description: "Find unbeatable deals on premium sneakers.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
