import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { getPaymentPlaceholder } from "../controllers/payment.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", (_req, res) => sendSuccess(res, 200, "Payment routes ready"));
router.get("/placeholder", getPaymentPlaceholder);

export default router;
