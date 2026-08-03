import { body } from "express-validator";

export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("phone")
    .optional()
    .customSanitizer((val) => (typeof val === "string" ? val.replace(/^\+91\s*/, "").replace(/\D/g, "") : val))
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone number must be a valid 10 digit Indian mobile number"),
];
