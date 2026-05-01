import mongoose, { Document, Schema } from "mongoose";

export interface IPosition extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entryPrice: number;
  currentMarketPrice: number;
  unrealizedPnl: number;
  status: "active" | "listed_for_sale" | "sold";
  listedPrice: number | null;
  tradeHistory: {
    buyerId: mongoose.Types.ObjectId;
    price: number;
    timestamp: Date;
  }[];
  createdAt: Date;
  acquiredAt: Date;
}

const PositionSchema = new Schema<IPosition>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entryPrice: { type: Number, required: true },
    currentMarketPrice: { type: Number, required: true },
    unrealizedPnl: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "listed_for_sale", "sold"],
      default: "active",
    },
    listedPrice: { type: Number, default: null },
    tradeHistory: [
      {
        buyerId: { type: Schema.Types.ObjectId, ref: "User" },
        price: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    acquiredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Indexes
PositionSchema.index({ userId: 1 });
PositionSchema.index({ productId: 1 });
PositionSchema.index({ status: 1 });

export default mongoose.model<IPosition>("Position", PositionSchema);
