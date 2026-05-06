import { create } from "zustand";
import { productsService } from "@/lib/api/products.service";
import type {
  IProduct,
  ProductFilters,
  PaginatedResponse,
} from "@vaultkix/types";

interface ProductState {
  products: IProduct[];
  selectedProduct: IProduct | null;
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  pagination: PaginatedResponse<IProduct>["pagination"] | null;
}

interface ProductActions {
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  clearSelectedProduct: () => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState & ProductActions>()(
  (set, get) => ({
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
    pagination: null,
    filters: { page: 1, limit: 12 },

    fetchProducts: async (filters) => {
      const merged = { ...get().filters, ...filters };
      set({ isLoading: true, error: null, filters: merged });
      try {
        const result = await productsService.getProducts(merged);
        set({
          products: result.items,
          pagination: result.pagination,
          isLoading: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load products",
        });
      }
    },

    fetchProduct: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const product = await productsService.getProduct(id);
        set({ selectedProduct: product, isLoading: false });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load product",
        });
      }
    },

    setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
    clearSelectedProduct: () => set({ selectedProduct: null }),
    clearError: () => set({ error: null }),
  }),
);
