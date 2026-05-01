import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("❌ Error:", err.message);
  errorResponse(res, err.message || "Internal server error", 500);
};
