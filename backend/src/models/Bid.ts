import mongoose, { Document, Schema } from "mongoose";

export interface IBid extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  bidIncrement: number;
  auctionEndsAt: Date;
  bidsHistory: {
    bidderId: mongoose.Types.ObjectId;
    amount: number;
    createdAt: Date;
  }[];
  currentHighestBid: number;
  totalBidsCount: number;
  status: "active" | "won" | "lost" | "cancelled" | "expired";
  winnerId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
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
    amount: { type: Number, required: true, min: 0 },
    bidIncrement: { type: Number, required: true, default: 1 },
    auctionEndsAt: { type: Date, required: true },
    bidsHistory: [
      {
        bidderId: { type: Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    currentHighestBid: { type: Number, default: 0 },
    totalBidsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "won", "lost", "cancelled", "expired"],
      default: "active",
    },
    winnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// Indexes
BidSchema.index({ productId: 1 });
BidSchema.index({ userId: 1 });
BidSchema.index({ status: 1 });
BidSchema.index({ auctionEndsAt: 1 });

export default mongoose.model<IBid>("Bid", BidSchema);
