import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "deposit"
    | "bid_hold"
    | "offer_payment"
    | "order_payment"
    | "position_purchase"
    | "position_sale"
    | "refund"
    | "payout"
    | "fee";
  amount: number;
  relatedId: mongoose.Types.ObjectId | null;
  status: "pending" | "completed" | "failed" | "refunded";
  note: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "deposit",
        "bid_hold",
        "offer_payment",
        "order_payment",
        "position_purchase",
        "position_sale",
        "refund",
        "payout",
        "fee",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

// Indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
