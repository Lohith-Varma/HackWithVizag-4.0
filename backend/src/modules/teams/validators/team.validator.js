import { body, param } from "express-validator";

export const createTeamValidation = [
  body("teamName")
    .trim()
    .notEmpty()
    .withMessage("Team name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Team name must be between 2 and 100 characters"),
];

export const addMemberValidation = [
  param("teamId").isMongoId().withMessage("Invalid team id"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Member email is required")
    .bail()
    .isEmail()
    .withMessage("Member email is invalid")
    .normalizeEmail(),
];
