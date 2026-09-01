import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { uploadProfileImage } from "../../../middleware/upload.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { getCurrentUser, lookupUser, updateCurrentUser, uploadProfilePhoto } from "../controllers/users.controller.js";
import { updateProfileValidation } from "../validators/users.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "User routes ready"));
router.get("/lookup", lookupUser);
router.get("/me", getCurrentUser);
router.patch("/me", updateProfileValidation, validateRequest, updateCurrentUser);
router.post("/me/profile-photo", uploadProfileImage.single("profile"), uploadProfilePhoto);

export default router;
