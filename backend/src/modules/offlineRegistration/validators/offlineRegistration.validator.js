import { body, param } from "express-validator";

export const teamIdValidation = [param("teamId").isMongoId().withMessage("Invalid team id")];

export const offlineRegistrationValidation = [
  param("teamId").isMongoId().withMessage("Invalid team id"),
  body("utrId")
    .isString().withMessage("UTR ID is required")
    .trim().notEmpty().withMessage("UTR ID is required")
    .bail().isLength({ min: 6, max: 64 }).withMessage("UTR ID must be between 6 and 64 characters")
    .matches(/^[A-Za-z0-9\-/]+$/).withMessage("UTR ID contains unsupported characters"),
];
