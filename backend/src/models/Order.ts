import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  offerId: mongoose.Types.ObjectId | null;
  variant: {
    type: string;
    size: string;
    color: string;
  };
  finalPrice: number;
  quantity: number;
  type: "delivery" | "position";
  status:
    | "pending_payment"
    | "paid"
    | "verified"
    | "vaulted"
    | "shipped"
    | "delivered"
    | "cancelled";
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  } | null;
  trackingNumber: string;
  verificationPhotos: string[];
  paymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
  settledAt: Date | null;
}

const OrderSchema = new Schema<IOrder>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },
    variant: {
      type: { type: String, default: "" },
      size: { type: String, default: "" },
      color: { type: String, default: "" },
    },
    finalPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    type: {
      type: String,
      enum: ["delivery", "position"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "verified",
        "vaulted",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending_payment",
    },
    shippingAddress: {
      street: String,
      city: String,
      zip: String,
      country: String,
    },
    trackingNumber: { type: String, default: "" },
    verificationPhotos: [{ type: String }],
    paymentIntentId: { type: String, default: "" },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes
OrderSchema.index({ buyerId: 1 });
OrderSchema.index({ sellerId: 1 });
OrderSchema.index({ productId: 1 });
OrderSchema.index({ status: 1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
