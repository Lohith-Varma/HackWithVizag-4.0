import { param, query } from "express-validator";

export const spotIdValidation = [param("id").isMongoId().withMessage("Invalid Spot Registration id")];

export const paymentInstructionsValidation = [
  query("teamSize").isInt({ min: 3, max: 4 }).withMessage("Team size must be 3 or 4 members"),
];

export const listSpotRegistrationsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 120 }).withMessage("Search must not exceed 120 characters"),
  query("status").optional().isIn(["SPOT_SUBMITTED", "SPOT_CONFIRMED"]).withMessage("Invalid Spot Registration status"),
];
