// ─────────────────────────────────────────────────────────────────────────────
// @vaultkix/types — Shared TypeScript types for web, mobile, and backend
// ─────────────────────────────────────────────────────────────────────────────

// ── Generic API Response ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ── User ──────────────────────────────────────────────────────────────────────

// export type UserRole = "buyer" | "seller" | "both";
export type UserRole = "buyer" | "seller";

export interface IWallet {
  balance: number;
  escrowHold: number;
  totalSpent: number;
  totalEarned: number;
}

export interface IUserStats {
  bidsPlaced: number;
  offersMade: number;
  offersReceived: number;
  positionsHeld: number;
  tradesMade: number;
}

export interface IAddress {
  _id?: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface IUser {
  _id: string;
  email: string;
  username: string;
  avatar: string;
  role: UserRole;
  wallet: IWallet;
  stats: IUserStats;
  addresses: IAddress[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Safe user — returned from API (no password or refreshToken)
export type SafeUser = Omit<IUser, "password" | "refreshToken">;

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

// ── Product ───────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "sold_out" | "archived";

export interface IVariant {
  _id?: string;
  type: string;
  size: string;
  color: string;
  style: string;
  sku: string;
  stockQuantity: number;
}

export interface IProduct {
  _id: string;
  sellerId: string | SafeUser;
  name: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  basePrice: number;
  minimumOfferAmount: number;
  variants: IVariant[];
  status: ProductStatus;
  isVaultEligible: boolean;
  vaultLocation: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  basePrice: number;
  minimumOfferAmount: number;
  variants: Omit<IVariant, "_id">[];
  isVaultEligible?: boolean;
}

export interface ProductFilters {
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Bid / Auction ─────────────────────────────────────────────────────────────

export type BidStatus = "active" | "won" | "lost" | "cancelled" | "expired";

export interface IBidHistoryEntry {
  bidderId: string | SafeUser;
  amount: number;
  createdAt: string;
}

export interface IAuction {
  _id: string;
  productId: string | IProduct;
  userId: string | SafeUser;
  amount: number;
  bidIncrement: number;
  auctionEndsAt: string;
  bidsHistory: IBidHistoryEntry[];
  currentHighestBid: number;
  totalBidsCount: number;
  status: BidStatus;
  winnerId: string | SafeUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

export interface AuctionResponse {
  auction: IAuction;
  timeRemaining: AuctionTimeRemaining;
  isExpired: boolean;
}

export interface PlaceBidPayload {
  amount: number;
}

export interface CreateAuctionPayload {
  startingPrice: number;
  bidIncrement: number;
  auctionEndsAt: string;
}

// ── Offer ─────────────────────────────────────────────────────────────────────

export type OfferStatus = "negotiating" | "accepted" | "rejected" | "expired";

export type OfferThreadStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "countered";

export type OfferFrom = "buyer" | "seller";

export interface IOfferThread {
  from: OfferFrom;
  amount: number;
  timestamp: string;
  status: OfferThreadStatus;
}

export interface IOfferVariant {
  type: string;
  size: string;
  color: string;
}

export interface IOffer {
  _id: string;
  productId: string | IProduct;
  buyerId: string | SafeUser;
  sellerId: string | SafeUser;
  variant: IOfferVariant;
  quantity: number;
  offersLeft: number;
  thread: IOfferThread[];
  currentStatus: OfferStatus;
  expiresAt: string;
  finalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferExpiryCountdown {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface OfferDetailResponse {
  offer: IOffer;
  expiryCountdown: OfferExpiryCountdown;
  isExpired: boolean;
}

export interface MakeOfferPayload {
  amount: number;
  variant: IOfferVariant;
  quantity: number;
}

export interface CounterOfferPayload {
  amount: number;
}

// ── Order ─────────────────────────────────────────────────────────────────────

export type OrderType = "delivery" | "position";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "verified"
  | "vaulted"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IShippingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface IOrder {
  _id: string;
  productId: string | IProduct;
  buyerId: string | SafeUser;
  sellerId: string | SafeUser;
  offerId: string | IOffer | null;
  variant: IOfferVariant;
  finalPrice: number;
  quantity: number;
  type: OrderType;
  status: OrderStatus;
  shippingAddress: IShippingAddress | null;
  trackingNumber: string;
  verificationPhotos: string[];
  paymentIntentId: string;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  offerId: string;
  type: OrderType;
  shippingAddress?: IShippingAddress;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  trackingNumber?: string;
}

// ── Position ──────────────────────────────────────────────────────────────────

export type PositionStatus = "active" | "listed_for_sale" | "sold";

export interface IPositionTradeHistory {
  buyerId: string | SafeUser;
  price: number;
  timestamp: string;
}

export interface IPosition {
  _id: string;
  orderId: string | IOrder;
  productId: string | IProduct;
  userId: string | SafeUser;
  entryPrice: number;
  currentMarketPrice: number;
  unrealizedPnl: number;
  status: PositionStatus;
  listedPrice: number | null;
  tradeHistory: IPositionTradeHistory[];
  createdAt: string;
  acquiredAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export type NotificationType =
  | "bid_update"
  | "offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "order_status"
  | "position_price_change"
  | "general";

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ── Transaction ───────────────────────────────────────────────────────────────

export type TransactionType =
  | "deposit"
  | "bid_hold"
  | "offer_payment"
  | "order_payment"
  | "position_purchase"
  | "position_sale"
  | "refund"
  | "payout"
  | "fee";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  relatedId: string | null;
  status: TransactionStatus;
  note: string;
  createdAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentInitiateResponse {
  orderId: string;
  amount: number;
  platformFee: string;
  sellerPayout: string;
  currency: string;
  orderType: OrderType;
  paymentGateway: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  orderStatus: OrderStatus;
  orderType: OrderType;
  finalPrice: number;
  platformFee: string;
  sellerPayout: string;
  paymentGateway: string;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadSingleResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface UploadMultipleResponse {
  urls: string[];
  count: number;
}

// ── Socket Events ─────────────────────────────────────────────────────────────

export interface BidUpdatedEvent {
  currentHighestBid: number;
  totalBidsCount: number;
  bidIncrement: number;
  auctionEndsAt: string;
  latestBid: {
    amount: number;
    createdAt: string;
  };
}

export interface OfferUpdateEvent {
  offerId: string;
  type:
    | "offer:received"
    | "offer:countered"
    | "offer:accepted"
    | "offer:rejected";
  amount: number;
  from: OfferFrom;
}

export interface OrderUpdatedEvent {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
}

export interface NotificationEvent {
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown>;
}

// ── Zustand Store Types ───────────────────────────────────────────────────────

export interface AuthStore {
  user: SafeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: SafeUser) => void;
}

export interface ProductStore {
  products: IProduct[];
  selectedProduct: IProduct | null;
  isLoading: boolean;
  filters: ProductFilters;
  pagination: PaginatedResponse<IProduct>["pagination"] | null;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  clearSelectedProduct: () => void;
}

export interface BidStore {
  currentAuction: AuctionResponse | null;
  isLoading: boolean;
  fetchAuction: (productId: string) => Promise<void>;
  placeBid: (productId: string, amount: number) => Promise<void>;
  updateBidRealtime: (data: BidUpdatedEvent) => void;
}

export interface OfferStore {
  sentOffers: IOffer[];
  receivedOffers: IOffer[];
  selectedOffer: OfferDetailResponse | null;
  isLoading: boolean;
  fetchSentOffers: () => Promise<void>;
  fetchReceivedOffers: () => Promise<void>;
  fetchOffer: (offerId: string) => Promise<void>;
  makeOffer: (productId: string, payload: MakeOfferPayload) => Promise<void>;
  counterOffer: (offerId: string, amount: number) => Promise<void>;
  acceptOffer: (offerId: string) => Promise<void>;
  rejectOffer: (offerId: string) => Promise<void>;
}

export interface NotificationStore {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: INotification) => void;
}
