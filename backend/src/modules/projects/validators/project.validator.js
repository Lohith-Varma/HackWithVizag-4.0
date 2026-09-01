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
  body("innovationSummary")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage("Innovation summary must not exceed 3000 characters"),
  body("technologyStack")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Technology stack must not exceed 1000 characters"),
  body("githubRepository")
    .trim()
    .notEmpty()
    .withMessage("GitHub repository link is required")
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("GitHub repository must be a valid URL")
    .bail()
    .custom((val) => {
      if (!/github\.com\/[\w.-]+\/[\w.-]+/i.test(val)) {
        throw new Error("Enter a valid GitHub repository URL (e.g. https://github.com/username/repository)");
      }
      return true;
    })
    .bail()
    .isLength({ max: 300 })
    .withMessage("GitHub repository must not exceed 300 characters"),
  body("demoVideoUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Demo video URL must be a valid URL")
    .bail()
    .isLength({ max: 300 })
    .withMessage("Demo video URL must not exceed 300 characters"),
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
  body("innovationSummary").optional().trim().isLength({ max: 3000 }).withMessage("Innovation summary is invalid"),
  body("technologyStack").optional().trim().isLength({ max: 1000 }).withMessage("Technology stack is invalid"),
  body("githubRepository")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("GitHub repository link is required")
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("GitHub repository must be a valid URL")
    .bail()
    .custom((val) => {
      if (!/github\.com\/[\w.-]+\/[\w.-]+/i.test(val)) {
        throw new Error("Enter a valid GitHub repository URL (e.g. https://github.com/username/repository)");
      }
      return true;
    })
    .bail()
    .isLength({ max: 300 })
    .withMessage("GitHub repository is invalid"),
  body("demoVideoUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Demo video URL must be a valid URL")
    .bail()
    .isLength({ max: 300 })
    .withMessage("Demo video URL is invalid"),
];

export const projectIdValidation = [param("projectId").isMongoId().withMessage("Invalid project id")];
