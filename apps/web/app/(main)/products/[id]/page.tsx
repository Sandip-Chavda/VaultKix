import type { Metadata } from "next";
import { productsService } from "@/lib/api/products.service";
import ProductClient from "./ProductClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productsService.getProduct(id);
    return {
      title: product.name,
      description: `${product.brand} ${product.name} — From ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.basePrice)}. Make an offer or place a bid on VaultKix.`,
      openGraph: {
        title: `${product.name} | VaultKix`,
        description: `${product.brand} sneaker on VaultKix. Min offer: $${product.minimumOfferAmount}`,
        images: product.images?.[0]
          ? [{ url: product.images[0], alt: product.name }]
          : [],
      },
    };
  } catch {
    return {
      title: "Product Not Found",
    };
  }
}

export default function ProductPage() {
  return <ProductClient />;
}
