import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse thousands of premium sneakers. Place bids, make offers, and get the best deals on Nike, Jordan, Adidas and more.",
  openGraph: {
    title: "VaultKix Marketplace — Shop Premium Sneakers",
    description:
      "Browse thousands of premium sneakers. Place bids, make offers, and get the best deals.",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
