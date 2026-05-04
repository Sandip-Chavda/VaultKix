import { Response } from "express";
import {
  uploadToCloudinary,
  uploadManyToCloudinary,
  deleteFromCloudinary,
} from "../utils/upload";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private
export const uploadSingle = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, "No file uploaded", 400);
      return;
    }

    const folder = (req.query.folder as string) || "vaultkix/products";
    const result = await uploadToCloudinary(req.file, folder);

    successResponse(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
      "Image uploaded successfully",
      201,
    );
  } catch (error) {
    errorResponse(res, "Failed to upload image", 500, error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
export const uploadMultiple = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      errorResponse(res, "No files uploaded", 400);
      return;
    }

    if (files.length > 5) {
      errorResponse(res, "Maximum 5 images allowed", 400);
      return;
    }

    const folder = (req.query.folder as string) || "vaultkix/products";
    const urls = await uploadManyToCloudinary(files, folder);

    successResponse(
      res,
      { urls, count: urls.length },
      "Images uploaded successfully",
      201,
    );
  } catch (error) {
    errorResponse(res, "Failed to upload images", 500, error);
  }
};

// @desc    Delete image
// @route   DELETE /api/upload
// @access  Private
export const deleteImage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      errorResponse(res, "Image URL is required", 400);
      return;
    }

    await deleteFromCloudinary(url);

    successResponse(res, null, "Image deleted successfully");
  } catch (error) {
    errorResponse(res, "Failed to delete image", 500, error);
  }
};
