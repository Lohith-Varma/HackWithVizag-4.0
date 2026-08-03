import { body, param } from "express-validator";

export const teamIdValidation = [param("teamId").isMongoId().withMessage("Invalid team id")];

export const offlineRegistrationValidation = [
  param("teamId").isMongoId().withMessage("Invalid team id"),
  body("contactName")
    .trim()
    .notEmpty()
    .withMessage("Contact name is required")
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage("Contact name must be between 2 and 80 characters"),
  body("contactPhone")
    .customSanitizer((val) => (typeof val === "string" ? val.replace(/^\+91\s*/, "").replace(/\D/g, "") : val))
    .trim()
    .notEmpty()
    .withMessage("Contact phone is required")
    .bail()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Contact phone must be a valid 10 digit Indian mobile number"),
  body("arrivalDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Arrival date is invalid"),
  body("accommodationRequired").optional().isBoolean().withMessage("Accommodation required must be a boolean"),
];
