import mongoose, { Document, Schema } from "mongoose";

export interface IVariant {
  _id?: mongoose.Types.ObjectId;
  type: string;
  size: string;
  color: string;
  style: string;
  sku: string;
  stockQuantity: number;
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  basePrice: number;
  minimumOfferAmount: number;
  variants: IVariant[];
  status: "active" | "sold_out" | "archived";
  isVaultEligible: boolean;
  vaultLocation: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  type: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  style: { type: String, default: "" },
  sku: { type: String, default: "" },
  stockQuantity: { type: Number, default: 1 },
});

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    minimumOfferAmount: { type: Number, required: true, min: 0 },
    variants: [VariantSchema],
    status: {
      type: String,
      enum: ["active", "sold_out", "archived"],
      default: "active",
    },
    isVaultEligible: { type: Boolean, default: false },
    vaultLocation: { type: String, default: "" },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ basePrice: 1 });

export default mongoose.model<IProduct>("Product", ProductSchema);
