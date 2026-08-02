import { body, param, query } from "express-validator";
import { TEAM_STATUSES, USER_STATUSES, SUBMISSION_STATUSES } from "../../../utils/constants.js";

const EXPORT_SCOPES = ["teams", "participants", "selectedTeams", "rejectedTeams", "statistics"];
const EXPORT_FORMATS = ["csv", "excel", "pdf"];

export const listTeamsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 120 }).withMessage("Search must not exceed 120 characters"),
  query("status").optional().isIn(TEAM_STATUSES).withMessage(`Status must be one of: ${TEAM_STATUSES.join(", ")}`),
  query("sort").optional().isIn(["newest", "oldest", "teamName"]).withMessage("Sort must be newest, oldest, or teamName"),
];

export const listSubmissionsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(SUBMISSION_STATUSES)
    .withMessage(`Submission status must be one of: ${SUBMISSION_STATUSES.join(", ")}`),
];

export const teamIdValidation = [param("id").isMongoId().withMessage("Invalid team id")];

export const legacyTeamIdValidation = [param("teamId").isMongoId().withMessage("Invalid team id")];

export const updateTeamStatusValidation = [
  body().custom((value) => {
    const status = value.status || value.currentStatus;
    if (!TEAM_STATUSES.includes(status)) {
      throw new Error(`Team status must be one of: ${TEAM_STATUSES.join(", ")}`);
    }
    return true;
  }),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 1200 })
    .withMessage("Remarks must not exceed 1200 characters"),
];

export const updateTeamRemarksValidation = [
  body("remarks")
    .trim()
    .isLength({ max: 1200 })
    .withMessage("Remarks must not exceed 1200 characters"),
];

export const updateUserStatusValidation = [
  param("userId").isMongoId().withMessage("Invalid user id"),
  body("status").isIn(USER_STATUSES).withMessage(`User status must be one of: ${USER_STATUSES.join(", ")}`),
];

export const exportValidation = [
  query("scope").optional().isIn(EXPORT_SCOPES).withMessage(`Scope must be one of: ${EXPORT_SCOPES.join(", ")}`),
  query("format")
    .optional()
    .isIn(EXPORT_FORMATS)
    .withMessage(`Export format must be one of: ${EXPORT_FORMATS.join(", ")}`),
  query("status").optional().isIn(TEAM_STATUSES).withMessage(`Status must be one of: ${TEAM_STATUSES.join(", ")}`),
  query("ids")
    .optional()
    .custom((value) => {
      const ids = String(value)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (!ids.length || ids.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
        throw new Error("Ids must be a comma-separated list of team ids");
      }
      return true;
    }),
];
