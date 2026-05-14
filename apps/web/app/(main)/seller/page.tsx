"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Package,
  ShoppingBag,
  Tag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useProductStore } from "@/stores/product.store";
import { productsService } from "@/lib/api/products.service";
import { getErrorMessage } from "@/lib/utils";
import { StatsOverview } from "@/components/seller/StatsOverview";
import { SellerProductCard } from "@/components/seller/SellerProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { IAuction, IProduct } from "@vaultkix/types";
import dynamic from "next/dynamic";
import { bidsService } from "@/lib/api/bids.service";
import { AuctionCard } from "@/components/seller/AuctionCard";

const ProductFormModal = dynamic(
  () =>
    import("@/components/seller/ProductFormModal").then(
      (m) => m.ProductFormModal,
    ),
  { ssr: false },
);

type Tab = "overview" | "products" | "auctions";

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<IProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<IAuction[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);

  const loadAuctions = useCallback(async () => {
    setAuctionsLoading(true);
    try {
      const data = await bidsService.getMyAuctions();
      setAuctions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setAuctionsLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getMyProducts();
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsLoading(false);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab === "products") loadProducts();
    if (newTab === "auctions") loadAuctions();
  };

  const handleEdit = (product: IProduct) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async (product: IProduct) => {
    setDeleteLoading(true);
    try {
      await productsService.deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setDeleteLoading(false);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    loadProducts();
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user.username}
          </p>
        </div>
        {tab === "products" && (
          <Button
            className="bg-primary hover:bg-primary/90 text-white gap-2"
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> List Product
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-section rounded-xl p-1 mb-6 w-fit">
        {(["overview", "products", "auctions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-dark"
            }`}
          >
            {t}
            {t === "auctions" && auctions.length > 0 && (
              <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {auctions.filter((a) => a.status === "active").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <StatsOverview user={user} />

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Products",
                description: "Manage your listings",
                icon: Package,
                action: () => setTab("products"),
                cta: "Manage",
              },
              {
                label: "Offers Received",
                description: "Review buyer offers",
                icon: Tag,
                href: "/offers",
                cta: "View Offers",
              },
              {
                label: "Orders",
                description: "Fulfil and track sales",
                icon: ShoppingBag,
                href: "/orders",
                cta: "View Orders",
              },
            ].map(({ label, description, icon: Icon, action, href, cta }) => (
              <div
                key={label}
                className="bg-background rounded-xl border border-border p-4"
              >
                <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-dark">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  {description}
                </p>
                {href ? (
                  <Link href={href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-primary border-primary"
                    >
                      {cta} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-primary border-primary"
                    onClick={action}
                  >
                    {cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Products Tab ── */}
      {tab === "products" && (
        <div>
          {error && (
            <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-dark">No products listed yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start selling by listing your first product
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 text-white gap-2"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-4 h-4" /> List your first product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <SellerProductCard
                  key={product._id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={(p) => setDeleteConfirm(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Auctions Tab ── */}
      {tab === "auctions" && (
        <div>
          {auctionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-20">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-dark">No auctions yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create an auction from the Products tab
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleTabChange("products")}
              >
                Go to Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {auctions.map((auction) => (
                <AuctionCard
                  key={auction._id}
                  auction={auction}
                  onCancelled={loadAuctions}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={formOpen}
        onClose={handleFormClose}
        product={editingProduct}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-dark text-lg mb-2">
              Archive Product?
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium text-dark">
                {deleteConfirm.name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              This will archive the listing. It won&apos;t be visible on the
              marketplace.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Archiving..." : "Archive"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
