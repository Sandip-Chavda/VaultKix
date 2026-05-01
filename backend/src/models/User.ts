import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  avatar: string;
  role: "buyer" | "seller" | "both";
  wallet: {
    balance: number;
    escrowHold: number;
    totalSpent: number;
    totalEarned: number;
  };
  stats: {
    bidsPlaced: number;
    offersMade: number;
    offersReceived: number;
    positionsHeld: number;
    tradesMade: number;
  };
  addresses: {
    label: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }[];
  refreshToken: string;
  isActive: boolean;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "both"],
      default: "buyer",
    },
    wallet: {
      balance: { type: Number, default: 0 },
      escrowHold: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
    },
    stats: {
      bidsPlaced: { type: Number, default: 0 },
      offersMade: { type: Number, default: 0 },
      offersReceived: { type: Number, default: 0 },
      positionsHeld: { type: Number, default: 0 },
      tradesMade: { type: Number, default: 0 },
    },
    addresses: [
      {
        label: String,
        street: String,
        city: String,
        zip: String,
        country: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    refreshToken: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.model<IUser>("User", UserSchema);
