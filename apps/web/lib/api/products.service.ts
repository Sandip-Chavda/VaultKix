import { api } from "@/lib/axios";
import type {
  ApiResponse,
  IProduct,
  PaginatedResponse,
  ProductFilters,
  CreateProductPayload,
} from "@vaultkix/types";

type ProductsListData = {
  products: IProduct[];
  pagination: PaginatedResponse<IProduct>["pagination"];
};

type SingleProductData = {
  product: IProduct;
};

type MyProductsData = {
  products: IProduct[];
};

export const productsService = {
  async getProducts(
    filters?: ProductFilters,
  ): Promise<PaginatedResponse<IProduct>> {
    const { data } = await api.get<ApiResponse<ProductsListData>>("/products", {
      params: filters,
    });
    if (!data.success || !data.data) throw new Error(data.message);
    return {
      items: data.data.products,
      pagination: data.data.pagination,
    };
  },

  async getProduct(id: string): Promise<IProduct> {
    const { data } = await api.get<ApiResponse<SingleProductData>>(
      `/products/${id}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.product;
  },

  async createProduct(payload: CreateProductPayload): Promise<IProduct> {
    const { data } = await api.post<ApiResponse<SingleProductData>>(
      "/products",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.product;
  },

  async updateProduct(
    id: string,
    payload: Partial<CreateProductPayload>,
  ): Promise<IProduct> {
    const { data } = await api.patch<ApiResponse<SingleProductData>>(
      `/products/${id}`,
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getMyProducts(): Promise<IProduct[]> {
    const { data } = await api.get<ApiResponse<MyProductsData>>(
      "/products/my-products",
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.products;
  },

  async addVariant(
    productId: string,
    variant: CreateProductPayload["variants"][0],
  ): Promise<IProduct> {
    const { data } = await api.post<ApiResponse<SingleProductData>>(
      `/products/${productId}/variants`,
      variant,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.product;
  },

  // Add to productsService in lib/api/products.service.ts
  async deleteVariant(productId: string, variantId: string): Promise<IProduct> {
    const { data } = await api.delete<ApiResponse<SingleProductData>>(
      `/products/${productId}/variants/${variantId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.product;
  },
};
