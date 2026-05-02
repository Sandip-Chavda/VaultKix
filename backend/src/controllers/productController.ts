import { Request, Response } from "express";
import Product from "../models/Product";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";

// ── Validation Schemas

const variantSchema = z.object({
  type: z.string().min(1, "Type is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  style: z.string().default(""),
  sku: z.string().default(""),
  stockQuantity: z.number().min(0).default(1),
});

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  basePrice: z.number().min(0, "Price must be positive"),
  minimumOfferAmount: z.number().min(0, "Minimum offer must be positive"),
  variants: z.array(variantSchema).min(1, "At least one variant required"),
  isVaultEligible: z.boolean().default(false),
});

const updateProductSchema = createProductSchema.partial();

const filterSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
});

// ── Controllers

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = filterSchema.safeParse(req.query);
    if (!parsed.success) {
      errorResponse(res, "Invalid filters", 400, parsed.error.issues);
      return;
    }

    const {
      brand,
      category,
      minPrice,
      maxPrice,
      size,
      color,
      status,
      page,
      limit,
      search,
    } = parsed.data;

    // Build query
    const query: Record<string, unknown> = {};

    if (brand) query.brand = { $regex: brand, $options: "i" };
    if (category) query.category = { $regex: category, $options: "i" };
    if (status) query.status = status;
    else query.status = "active";

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.basePrice = {};
      if (minPrice !== undefined)
        (query.basePrice as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined)
        (query.basePrice as Record<string, number>).$lte = maxPrice;
    }

    if (size) {
      query["variants.size"] = { $regex: size, $options: "i" };
    }

    if (color) {
      query["variants.color"] = { $regex: color, $options: "i" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("sellerId", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    successResponse(
      res,
      {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
      "Products fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to fetch products", 500, error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerId",
      "username avatar",
    );

    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    successResponse(res, { product }, "Product fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch product", 500, error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (seller only)
export const createProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const product = await Product.create({
      ...parsed.data,
      sellerId: req.user?.userId,
    });

    successResponse(res, { product }, "Product created", 201);
  } catch (error) {
    errorResponse(res, "Failed to create product", 500, error);
  }
};

// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private (seller only — own product)
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    // Make sure seller owns this product
    if (product.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized to update this product", 403);
      return;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      parsed.data,
      { new: true, runValidators: true },
    );

    successResponse(res, { product: updated }, "Product updated");
  } catch (error) {
    errorResponse(res, "Failed to update product", 500, error);
  }
};

// @desc    Delete (archive) product
// @route   DELETE /api/products/:id
// @access  Private (seller only — own product)
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    if (product.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized to delete this product", 403);
      return;
    }

    // Soft delete — archive instead of removing
    await Product.findByIdAndUpdate(req.params.id, { status: "archived" });

    successResponse(res, null, "Product archived successfully");
  } catch (error) {
    errorResponse(res, "Failed to delete product", 500, error);
  }
};

// @desc    Add variant to product
// @route   POST /api/products/:id/variants
// @access  Private (seller only — own product)
export const addVariant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = variantSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    if (product.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    product.variants.push(parsed.data);
    await product.save();

    successResponse(res, { product }, "Variant added");
  } catch (error) {
    errorResponse(res, "Failed to add variant", 500, error);
  }
};

// @desc    Delete variant from product
// @route   DELETE /api/products/:id/variants/:variantId
// @access  Private (seller only — own product)
export const deleteVariant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    if (product.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    product.variants = product.variants.filter(
      (v) => v._id?.toString() !== req.params.variantId,
    );

    await product.save();

    successResponse(res, { product }, "Variant deleted");
  } catch (error) {
    errorResponse(res, "Failed to delete variant", 500, error);
  }
};

// @desc    Get seller's own products
// @route   GET /api/products/my-products
// @access  Private (seller only)
export const getMyProducts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const products = await Product.find({
      sellerId: req.user?.userId,
    }).sort({ createdAt: -1 });

    successResponse(res, { products }, "My products fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch your products", 500, error);
  }
};
