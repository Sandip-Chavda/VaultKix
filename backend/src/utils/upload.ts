import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import "../config/cloudinary";
import multer from "multer";
import path from "path";
import streamifier from "streamifier";

// ── Multer config — memory storage ───────────────────────────────────────────

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only jpeg, jpg, png, webp images are allowed"));
    }
  },
});

// ── Upload single file buffer to Cloudinary ──────────────────────────────────

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string = "vaultkix/products",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1000, height: 1000, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
        } else {
          resolve(result);
        }
      },
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ── Upload multiple files ─────────────────────────────────────────────────────

export const uploadManyToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = "vaultkix/products",
): Promise<string[]> => {
  const uploads = await Promise.all(
    files.map((file) => uploadToCloudinary(file, folder)),
  );
  return uploads.map((result) => result.secure_url);
};

// ── Delete file from Cloudinary ───────────────────────────────────────────────

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  // Extract public_id from URL
  // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.ext
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1].split(".")[0];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${filename}`;

  await cloudinary.uploader.destroy(publicId);
};
