import { body, param } from "express-validator";
import { TEAM_STATUSES, USER_STATUSES } from "../../../utils/constants.js";

export const updateTeamStatusValidation = [
  param("teamId").isMongoId().withMessage("Invalid team id"),
  body("currentStatus")
    .isIn(TEAM_STATUSES)
    .withMessage(`Team status must be one of: ${TEAM_STATUSES.join(", ")}`),
];

export const updateUserStatusValidation = [
  param("userId").isMongoId().withMessage("Invalid user id"),
  body("status").isIn(USER_STATUSES).withMessage(`User status must be one of: ${USER_STATUSES.join(", ")}`),
];
