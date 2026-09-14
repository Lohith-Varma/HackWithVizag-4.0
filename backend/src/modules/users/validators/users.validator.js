import { body } from "express-validator";
import { normalizeIndianPhone } from "../../../utils/phone.js";

export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("phone")
    .optional()
    .customSanitizer(normalizeIndianPhone)
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone number must be a valid 10 digit Indian mobile number"),
];
