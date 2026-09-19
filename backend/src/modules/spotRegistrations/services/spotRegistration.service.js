import User from "../../auth/models/user.model.js";
import Team from "../../teams/models/team.model.js";
import SpotRegistration from "../models/spotRegistration.model.js";
import ApiError from "../../../utils/apiError.js";

const emailPattern = /^\S+@\S+\.\S+$/;
const clean = (value) => String(value ?? "").trim();
const normalizedEmail = (value) => clean(value).toLowerCase();
const normalizedCollege = (value) => clean(value).replace(/\s+/g, " ").toLowerCase();
const fieldError = (field, message) => new ApiError(422, "Validation failed", [{ field, message }]);

const requireText = (value, field, label, maxLength) => {
  const result = clean(value);
  if (!result) throw fieldError(field, `${label} is required`);
  if (maxLength && result.length > maxLength) throw fieldError(field, `${label} must not exceed ${maxLength} characters`);
  return result;
};

const participant = (value, field, collegeName) => {
  const email = normalizedEmail(value?.email);
  if (!emailPattern.test(email)) throw fieldError(`${field}.email`, "A valid participant email is required");
  return {
    name: requireText(value?.name, `${field}.name`, "Participant name", 80),
    email,
    // Required-field check only. Do not normalize or validate phone format.
    phone: requireText(value?.phone, `${field}.phone`, "Participant phone"),
    collegeName: requireText(value?.collegeName ?? collegeName, `${field}.collegeName`, "Participant college", 160),
  };
};

export const parseSpotPayload = (body = {}) => {
  if (typeof body.payload !== "string") return body;
  try {
    return JSON.parse(body.payload);
  } catch {
    throw fieldError("payload", "Registration payload must be valid JSON");
  }
};

export const validateSpotRegistration = (input = {}) => {
  const teamSize = Number(input.teamSize);
  if (![3, 4].includes(teamSize)) throw fieldError("teamSize", "Team size must be 3 or 4 members.");

  const teamName = requireText(input.teamName, "teamName", "Team name", 100);
  const collegeName = requireText(input.collegeName, "collegeName", "College", 160);
  const teamLeader = participant(input.teamLeader, "teamLeader", collegeName);
  const membersInput = Array.isArray(input.members) ? input.members : [];
  if (membersInput.length !== teamSize - 1) {
    throw fieldError("members", `A ${teamSize}-member team requires ${teamSize - 1} additional members.`);
  }
  const members = membersInput.map((memberValue, index) => participant(memberValue, `members.${index}`, collegeName));
  const allParticipants = [teamLeader, ...members];

  if (allParticipants.some((entry) => normalizedCollege(entry.collegeName) !== normalizedCollege(collegeName))) {
    throw new ApiError(400, "All team members must belong to the same college.");
  }

  const participantEmails = allParticipants.map((entry) => entry.email);
  if (new Set(participantEmails).size !== participantEmails.length) {
    throw new ApiError(409, "One or more participants are already registered for this event.");
  }

  return {
    teamName,
    collegeName,
    teamSize,
    teamLeader,
    members,
    participantEmails,
    utr: requireText(input.utr ?? input.utrId, "utr", "UTR ID", 100),
  };
};

export const ensureEmailsAvailable = async (participantEmails, { excludeSpotId } = {}) => {
  const spotQuery = { participantEmails: { $in: participantEmails } };
  if (excludeSpotId) spotQuery._id = { $ne: excludeSpotId };

  const [existingSpot, users] = await Promise.all([
    SpotRegistration.exists(spotQuery),
    User.find({ email: { $in: participantEmails } }).select("_id team").lean(),
  ]);
  if (existingSpot) throw new ApiError(409, "One or more participants are already registered for this event.");

  if (users.length) {
    const userIds = users.map((user) => user._id);
    const existingTeam = await Team.exists({ $or: [{ leader: { $in: userIds } }, { members: { $in: userIds } }] });
    if (existingTeam || users.some((user) => user.team)) {
      throw new ApiError(409, "One or more participants are already registered for this event.");
    }
  }
};

export const buildSpotRegistrationNumber = (id) => `HWV-SPOT-${id.toString().slice(-8).toUpperCase()}`;
