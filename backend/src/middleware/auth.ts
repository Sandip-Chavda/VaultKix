import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { errorResponse } from "../utils/apiResponse";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    errorResponse(res, "Not authorized", 401);
    return;
  }
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    errorResponse(res, "Invalid token", 401);
    return;
  }
};

export const sellerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "seller" && req.user?.role !== "both") {
    errorResponse(res, "Seller access only", 403);
    return;
  }
  next();
};
