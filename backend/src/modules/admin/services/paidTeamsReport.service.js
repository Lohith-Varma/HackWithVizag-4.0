import OfflineRegistration from "../../offlineRegistration/models/offlineRegistration.model.js";
import Project from "../../projects/models/project.model.js";
import SpotRegistration from "../../spotRegistrations/models/spotRegistration.model.js";
import Submission from "../../submissions/models/submission.model.js";
import "../../auth/models/user.model.js";
import "../../problemStatements/models/problemStatement.model.js";
import "../../teams/models/team.model.js";

export const PAID_REPORT_SOURCES = ["all", "offline", "spot"];

const clean = (value) => String(value ?? "").trim();
const idOf = (value) => clean(value?._id || value);

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const personCollege = (person) => clean(person?.collegeName || person?.college);

const teamCollege = (team) => {
  if (!team) return "";
  return personCollege(team.leader) || (team.members || []).map(personCollege).find(Boolean) || "";
};

const orderedTeamMembers = (team) => {
  if (!team) return [];
  const ordered = [];
  const seen = new Set();

  const add = (person, role) => {
    if (!person) return;
    const key = idOf(person) || clean(person.email).toLowerCase();
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    ordered.push({ person, role });
  };

  add(team.leader, "Team Leader");
  (team.members || []).forEach((person) => add(person, "Member"));
  return ordered;
};

const onlineRegistrationNumber = (team, submission) => {
  const sourceId = idOf(submission) || idOf(team);
  return sourceId ? `HWV-2026-${sourceId.slice(-6).toUpperCase()}` : "";
};

const onlineMember = ({ person, role, memberNumber, fallbackCollege }) => ({
  memberNumber,
  role,
  name: clean(person?.name),
  email: clean(person?.email),
  phone: clean(person?.phone),
  collegeName: personCollege(person) || fallbackCollege,
  studentRegistrationId: clean(person?.registeredNumber),
  department: clean(person?.department),
  year: clean(person?.year),
  gender: clean(person?.gender),
});

const spotMember = ({ person, role, memberNumber, fallbackCollege }) => ({
  memberNumber,
  role,
  name: clean(person?.name),
  email: clean(person?.email),
  phone: clean(person?.phone),
  collegeName: clean(person?.collegeName) || fallbackCollege,
  studentRegistrationId: clean(person?.registrationId),
  department: clean(person?.department),
  year: "",
  gender: "",
});

const normalizeOffline = (registration, projectByTeam, submissionByTeam) => {
  const team = registration.team || null;
  const teamId = idOf(team) || idOf(registration.team);
  const project = projectByTeam.get(teamId) || null;
  const submission = submissionByTeam.get(teamId) || null;
  const collegeName = teamCollege(team);
  const orderedMembers = orderedTeamMembers(team);
  const members = orderedMembers.map(({ person, role }, index) =>
    onlineMember({ person, role, memberNumber: index + 1, fallbackCollege: collegeName })
  );
  const leader = members.find((member) => member.role === "Team Leader") || null;
  const problem = project?.problemStatementId && typeof project.problemStatementId === "object"
    ? project.problemStatementId
    : null;
  const submittedAt = toDate(registration.submittedAt || registration.createdAt);

  return {
    source: "Offline Registration",
    sourceKey: "offline",
    registrationNumber: clean(registration.confirmationCode) || onlineRegistrationNumber(team, submission),
    teamName: clean(team?.teamName) || "Missing team record",
    collegeName,
    teamSize: members.length,
    problemStatement: clean(problem?.title || project?.problemStatement),
    problemStatementCode: clean(problem?.code || project?.problemCode),
    paymentStatus: clean(registration.payment?.status) || "submitted",
    registrationStatus: clean(registration.status),
    amount: Number(registration.payment?.amount ?? registration.expectedAmount ?? 0),
    utr: clean(registration.utrId),
    registrationDate: submittedAt,
    paymentDate: submittedAt,
    confirmationDate: null,
    leaderName: leader?.name || clean(team?.leader?.name),
    leaderEmail: leader?.email || clean(team?.leader?.email),
    leaderPhone: leader?.phone || clean(team?.leader?.phone),
    projectTitle: clean(project?.title),
    githubRepository: clean(project?.githubRepository),
    members,
  };
};

const normalizeSpot = (registration) => {
  const collegeName = clean(registration.collegeName);
  const people = [
    { person: registration.teamLeader, role: "Team Leader" },
    ...(registration.members || []).map((person) => ({ person, role: "Member" })),
  ];
  const members = people.map(({ person, role }, index) =>
    spotMember({ person, role, memberNumber: index + 1, fallbackCollege: collegeName })
  );
  const leader = members[0] || null;

  return {
    source: "Spot Registration",
    sourceKey: "spot",
    registrationNumber: clean(registration.registrationNumber),
    teamName: clean(registration.teamName),
    collegeName,
    teamSize: members.length,
    problemStatement: "N/A",
    problemStatementCode: "N/A",
    paymentStatus: "confirmed",
    registrationStatus: clean(registration.status),
    amount: Number(registration.payment?.amount ?? registration.calculatedFee ?? 0),
    utr: clean(registration.payment?.utr),
    registrationDate: toDate(registration.submittedAt || registration.createdAt),
    paymentDate: toDate(registration.submittedAt || registration.createdAt),
    confirmationDate: toDate(registration.confirmedAt),
    leaderName: leader?.name || "",
    leaderEmail: leader?.email || "",
    leaderPhone: leader?.phone || "",
    projectTitle: "N/A",
    githubRepository: "N/A",
    members,
  };
};

const compareText = (left, right) => clean(left).localeCompare(clean(right), "en", { sensitivity: "base", numeric: true });

export const normalizePaidTeams = ({
  offlineRegistrations = [],
  spotRegistrations = [],
  projects = [],
  submissions = [],
  source = "all",
} = {}) => {
  const projectByTeam = new Map(projects.map((project) => [idOf(project.team), project]));
  const submissionByTeam = new Map(submissions.map((submission) => [idOf(submission.team), submission]));
  const teams = [];

  if (source !== "spot") {
    offlineRegistrations
      .filter((registration) => registration.status === "OFFLINE_SUBMITTED")
      .forEach((registration) => teams.push(normalizeOffline(registration, projectByTeam, submissionByTeam)));
  }

  if (source !== "offline") {
    spotRegistrations
      .filter((registration) => registration.status === "SPOT_CONFIRMED")
      .forEach((registration) => teams.push(normalizeSpot(registration)));
  }

  teams.sort((left, right) => compareText(left.source, right.source) || compareText(left.registrationNumber, right.registrationNumber));
  return teams;
};

export const getPaidTeamsReportData = async ({ source = "all" } = {}) => {
  const includeOffline = source !== "spot";
  const includeSpot = source !== "offline";

  const [offlineRegistrations, spotRegistrations] = await Promise.all([
    includeOffline
      ? OfflineRegistration.find({ status: "OFFLINE_SUBMITTED" })
          .select("team teamSize expectedAmount utrId status registrationCompleted submittedAt confirmationCode payment createdAt updatedAt")
          .populate({
            path: "team",
            select: "teamName leader members createdAt updatedAt",
            populate: [
              { path: "leader", select: "name email phone college collegeName registeredNumber department year gender" },
              { path: "members", select: "name email phone college collegeName registeredNumber department year gender" },
            ],
          })
          .sort({ submittedAt: 1, createdAt: 1 })
          .lean()
      : [],
    includeSpot
      ? SpotRegistration.find({ status: "SPOT_CONFIRMED" })
          .select("registrationNumber teamName collegeName teamSize teamLeader members calculatedFee payment.amount payment.utr status submittedAt confirmedAt createdAt")
          .sort({ registrationNumber: 1 })
          .lean()
      : [],
  ]);

  const teamIds = offlineRegistrations.map((registration) => idOf(registration.team)).filter(Boolean);
  const [projects, submissions] = teamIds.length
    ? await Promise.all([
        Project.find({ team: { $in: teamIds } })
          .select("team title problemStatement problemStatementId problemCode problemType githubRepository")
          .populate("problemStatementId", "code title")
          .lean(),
        Submission.find({ team: { $in: teamIds } }).select("team").lean(),
      ])
    : [[], []];

  return normalizePaidTeams({ offlineRegistrations, spotRegistrations, projects, submissions, source });
};
