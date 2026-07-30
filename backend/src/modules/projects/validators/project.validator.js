import { body, param } from "express-validator";

const projectFields = [
  body("team").isMongoId().withMessage("Invalid team id"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Project title is required")
    .bail()
    .isLength({ max: 160 })
    .withMessage("Project title must not exceed 160 characters"),
  body("theme")
    .trim()
    .notEmpty()
    .withMessage("Theme is required")
    .bail()
    .isLength({ max: 120 })
    .withMessage("Theme must not exceed 120 characters"),
  body("problemStatement")
    .trim()
    .notEmpty()
    .withMessage("Problem statement is required")
    .bail()
    .isLength({ max: 3000 })
    .withMessage("Problem statement must not exceed 3000 characters"),
  body("abstract")
    .trim()
    .notEmpty()
    .withMessage("Abstract is required")
    .bail()
    .isLength({ max: 5000 })
    .withMessage("Abstract must not exceed 5000 characters"),
];

export const createProjectValidation = projectFields;

export const updateProjectValidation = [
  param("projectId").isMongoId().withMessage("Invalid project id"),
  body("title").optional().trim().isLength({ min: 1, max: 160 }).withMessage("Project title is invalid"),
  body("theme").optional().trim().isLength({ min: 1, max: 120 }).withMessage("Theme is invalid"),
  body("problemStatement")
    .optional()
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage("Problem statement is invalid"),
  body("abstract").optional().trim().isLength({ min: 1, max: 5000 }).withMessage("Abstract is invalid"),
];

export const projectIdValidation = [param("projectId").isMongoId().withMessage("Invalid project id")];
