import Offer from "../models/Offer";
import Bid from "../models/Bid";

// ── Expire stale offers ───────────────────────────────────────────────────────

export const expireStaleOffers = async (): Promise<void> => {
  try {
    const result = await Offer.updateMany(
      {
        currentStatus: "negotiating",
        expiresAt: { $lt: new Date() },
      },
      { currentStatus: "expired" },
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Expired ${result.modifiedCount} stale offers`);
    }
  } catch (error) {
    console.error("❌ Failed to expire stale offers:", error);
  }
};

// ── Expire stale auctions ─────────────────────────────────────────────────────

export const expireStaleAuctions = async (): Promise<void> => {
  try {
    const result = await Bid.updateMany(
      {
        status: "active",
        auctionEndsAt: { $lt: new Date() },
      },
      { status: "expired" },
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Expired ${result.modifiedCount} stale auctions`);
    }
  } catch (error) {
    console.error("❌ Failed to expire stale auctions:", error);
  }
};

// ── Run all cleanup tasks ─────────────────────────────────────────────────────

export const runCleanup = async (): Promise<void> => {
  await expireStaleOffers();
  await expireStaleAuctions();
};
