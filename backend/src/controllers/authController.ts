import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { ENV } from "../config/env";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { z } from "zod";

// ── Zod Validation Schemas

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller", "both"]).default("buyer"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// @desc Register new user || @route   POST /api/auth/register || @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { email, username, password, role } = parsed.data;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      errorResponse(res, "Email or username already exists", 409);
      return;
    }

    const user = await User.create({ email, username, password, role });

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    successResponse(
      res,
      {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          wallet: user.wallet,
        },
        accessToken,
        refreshToken,
      },
      "Registration successful",
      201,
    );
  } catch (error) {
    errorResponse(res, "Registration failed", 500, error);
  }
};

// @desc Login user || @route POST /api/auth/login @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      errorResponse(res, "Invalid credentials", 401);
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      errorResponse(res, "Invalid credentials", 401);
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    successResponse(
      res,
      {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          wallet: user.wallet,
        },
        accessToken,
        refreshToken,
      },
      "Login successful",
    );
  } catch (error) {
    errorResponse(res, "Login failed", 500, error);
  }
};

// @desc Refresh access token || @route POST /api/auth/refresh || @access  Public
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      errorResponse(res, "Refresh token required", 400);
      return;
    }

    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as {
      userId: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      errorResponse(res, "Invalid refresh token", 401);
      return;
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save();

    successResponse(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      "Token refreshed",
    );
  } catch (error) {
    errorResponse(res, "Token refresh failed", 401, error);
  }
};

// @desc Logout user || @route POST /api/auth/logout || @access  Private
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
    }
    successResponse(res, null, "Logged out successfully");
  } catch (error) {
    errorResponse(res, "Logout failed", 500, error);
  }
};

// @desc Get current user || @route   GET /api/auth/me || @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      errorResponse(res, "User not found", 404);
      return;
    }
    successResponse(res, { user }, "User fetched");
  } catch (error) {
    errorResponse(res, "Failed to get user", 500, error);
  }
};

// @desc Update profile || @route   PATCH /api/auth/profile || @access  Private
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { username, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { username, avatar },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    if (!user) {
      errorResponse(res, "User not found", 404);
      return;
    }

    successResponse(res, { user }, "Profile updated");
  } catch (error) {
    errorResponse(res, "Profile update failed", 500, error);
  }
};
