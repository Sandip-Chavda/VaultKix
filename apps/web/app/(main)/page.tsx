"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useProductStore } from "@/stores/product.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { IProduct } from "@vaultkix/types";

const CATEGORIES = [
  "All",
  "Running",
  "Basketball",
  "Lifestyle",
  "Training",
  "Skateboarding",
];

const BRANDS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Converse"];

function ProductCard({ product }: { product: IProduct }) {
  return (
    <Link href={`/products/${product._id}`}>
      <div className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
        {/* Image */}
        <div className="aspect-square bg-section relative overflow-hidden">
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">👟</span>
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
            {product.brand}
          </Badge>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-0.5">
            {product.category}
          </p>
          <h3 className="font-semibold text-dark text-sm leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-bold text-dark">
                {formatCurrency(product.basePrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Min offer</p>
              <p className="text-sm font-medium text-primary">
                {formatCurrency(product.minimumOfferAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const {
    products = [],
    isLoading,
    pagination,
    fetchProducts,
  } = useProductStore();

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  // Sync search param from navbar
  const searchQuery = searchParams.get("search") ?? undefined;

  useEffect(() => {
    console.log("products:", products);
    console.log("pagination:", pagination);
  }, [products, pagination]);

  useEffect(() => {
    fetchProducts({
      search: searchQuery,
      category: activeCategory === "All" ? undefined : activeCategory,
      brand: activeBrand ?? undefined,
      page: 1,
    });
  }, [searchQuery, activeCategory, activeBrand, fetchProducts]);

  const clearFilters = () => {
    setActiveCategory("All");
    setActiveBrand(null);
  };

  const hasActiveFilters = activeCategory !== "All" || activeBrand !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <section className="relative min-h-[280px] md:min-h-[320px] mb-4">
        {/* Purple background box — clipped separately */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-purple-800 overflow-hidden">
          {/* Decorative circles inside the box */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        </div>

        {/* Content row — sits above background */}
        <div className="relative z-10 flex items-center h-full min-h-[280px] md:min-h-[320px] px-8 md:px-12">
          {/* Left text */}
          <div className="max-w-[50%]">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              🔥 Live auctions happening now
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3 text-white">
              The Sneaker Marketplace
              <br />
              <span className="text-purple-200">Built for Deals</span>
            </h1>
            <p className="text-purple-100 mb-6 text-sm md:text-base">
              Bid, offer, and negotiate your way to unbeatable prices on premium
              sneakers.
            </p>
            <div className="flex gap-3">
              <Button
                className="bg-white text-primary hover:bg-purple-50 font-semibold"
                onClick={() =>
                  document
                    .getElementById("products-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Browse Sneakers
              </Button>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — shoe overflows the box */}
          <div className="absolute right-10  md:right-0 bottom-8 w-[340px] md:w-[430px]">
            {/* Glow blob behind shoe */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-56 h-24 bg-purple-300/30 rounded-full blur-2xl" />
            <div className="absolute right-70 bottom-50 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sneaker.png"
              alt="Featured sneaker"
              className="relative w-full object-contain"
              style={{
                filter: "drop-shadow(-8px 16px 24px rgba(0,0,0,0.5))",
                transform: "rotate(-15deg) translateY(-20px)",
                transformOrigin: "bottom right",
              }}
            />
          </div>
        </div>
      </section>

      {/* Brands */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-dark">Shop by Brand</h2>
          <button
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            onClick={clearFilters}
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() =>
                setActiveBrand((b) => (b === brand ? null : brand))
              }
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeBrand === brand
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products-section">
        {/* Category filters + results header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-background text-muted-foreground hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-destructive hover:underline"
              >
                Clear filters
              </button>
            )}
            {!isLoading && pagination && (
              <span className="text-sm text-muted-foreground">
                {pagination.total} results
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </Button>
          </div>
        </div>

        {/* Search context */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Search className="w-4 h-4" />
            Results for{" "}
            <span className="font-semibold text-dark">
              &ldquo;{searchQuery}&rdquo;
            </span>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👟</p>
            <p className="font-semibold text-dark">No sneakers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => fetchProducts({ page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground flex items-center">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => fetchProducts({ page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
