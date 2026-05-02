import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  deleteVariant,
  getMyProducts,
} from "../controllers/productController";
import { protect, sellerOnly } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/my-products", protect, sellerOnly, getMyProducts);
router.get("/:id", getProduct);

// Seller only routes
router.post("/", protect, sellerOnly, createProduct);
router.patch("/:id", protect, sellerOnly, updateProduct);
router.delete("/:id", protect, sellerOnly, deleteProduct);
router.post("/:id/variants", protect, sellerOnly, addVariant);
router.delete("/:id/variants/:variantId", protect, sellerOnly, deleteVariant);

export default router;
