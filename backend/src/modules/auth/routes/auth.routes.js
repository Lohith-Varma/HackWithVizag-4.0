import { Router } from "express";
import { login, logout, profile, register } from "../controllers/auth.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validateRequest } from "../../../middleware/validateRequest.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { loginValidation, registerValidation } from "../validators/auth.validator.js";

const router = Router();

router.get("/", (_req, res) => sendSuccess(res, 200, "Auth routes ready"));
router.post("/register", registerValidation, validateRequest, register);
router.post("/login", loginValidation, validateRequest, login);
router.post("/logout", logout);
router.get("/profile", authenticate, profile);

export default router;
