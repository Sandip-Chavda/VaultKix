import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "bid_update"
    | "offer_received"
    | "offer_accepted"
    | "offer_rejected"
    | "order_status"
    | "position_price_change"
    | "general";
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "bid_update",
        "offer_received",
        "offer_accepted",
        "offer_rejected",
        "order_status",
        "position_price_change",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
