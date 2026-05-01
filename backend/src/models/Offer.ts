import mongoose, { Document, Schema } from "mongoose";

export interface IOfferThread {
  from: "buyer" | "seller";
  amount: number;
  timestamp: Date;
  status: "pending" | "accepted" | "rejected" | "countered";
}

export interface IOffer extends Document {
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  variant: {
    type: string;
    size: string;
    color: string;
  };
  quantity: number;
  offersLeft: number;
  thread: IOfferThread[];
  currentStatus: "negotiating" | "accepted" | "rejected" | "expired";
  expiresAt: Date;
  finalAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const OfferThreadSchema = new Schema<IOfferThread>({
  from: { type: String, enum: ["buyer", "seller"], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "countered"],
    default: "pending",
  },
});

const OfferSchema = new Schema<IOffer>(
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
    variant: {
      type: { type: String, default: "" },
      size: { type: String, default: "" },
      color: { type: String, default: "" },
    },
    quantity: { type: Number, default: 1 },
    offersLeft: { type: Number, default: 3 },
    thread: [OfferThreadSchema],
    currentStatus: {
      type: String,
      enum: ["negotiating", "accepted", "rejected", "expired"],
      default: "negotiating",
    },
    expiresAt: { type: Date, required: true },
    finalAmount: { type: Number, default: null },
  },
  { timestamps: true },
);

// Indexes
OfferSchema.index({ productId: 1 });
OfferSchema.index({ buyerId: 1 });
OfferSchema.index({ sellerId: 1 });
OfferSchema.index({ currentStatus: 1 });
OfferSchema.index({ expiresAt: 1 });

export default mongoose.model<IOffer>("Offer", OfferSchema);
