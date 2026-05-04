import { Router } from "express";
import {
  uploadSingle,
  uploadMultiple,
  deleteImage,
} from "../controllers/uploadController";
import { protect } from "../middleware/auth";
import { upload } from "../utils/upload";

const router = Router();

router.post("/single", protect, upload.single("image"), uploadSingle);
router.post("/multiple", protect, upload.array("images", 5), uploadMultiple);
router.delete("/", protect, deleteImage);

export default router;
