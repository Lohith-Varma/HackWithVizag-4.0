import mongoose from "mongoose";
import User from "../../auth/models/user.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import Team from "../../teams/models/team.model.js";
import ProblemStatement from "../../problemStatements/models/problemStatement.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

const STATUS_TO_SUBMISSION_STATUS = {
  pending: "draft",
  under_review: "under_review",
  selected: "selected",
  rejected: "rejected",
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const formatStatus = (value) => value || "pending";

const getPrimaryCollege = (team) =>
  team.leader?.collegeName ||
  team.leader?.college ||
  team.members?.find((member) => member.collegeName || member.college)?.collegeName ||
  team.members?.find((member) => member.college)?.college ||
  "";

const getPrimaryDepartment = (team) =>
  team.leader?.department || team.members?.find((member) => member.department)?.department || "";

const teamPopulate = [
  { path: "leader", select: "name email phone role status college collegeName department year" },
  { path: "members", select: "name email phone role status college collegeName department year" },
  { path: "reviewedBy", select: "name email role" },
];

const normalizeTeam = ({ team, project = null, submission = null } = {}) => ({
  id: team._id.toString(),
  _id: team._id.toString(),
  teamName: team.teamName,
  leader: team.leader,
  members: team.members || [],
  memberCount: team.members?.length || 0,
  college: getPrimaryCollege(team),
  department: getPrimaryDepartment(team),
  status: formatStatus(team.currentStatus),
  currentStatus: formatStatus(team.currentStatus),
  remarks: team.remarks || "",
  reviewedBy: team.reviewedBy,
  reviewedAt: team.reviewedAt,
  submissionDate: submission?.finalSubmittedAt || project?.submittedAt || project?.createdAt || team.createdAt,
  project,
  submission,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
});

const buildTeamQuery = async ({ search, status, college, department, theme, problemStatement, isOpenInnovation }) => {
  const query = {};

  if (status) {
    query.currentStatus = status;
  }

  // Filter by Project-specific fields if requested
  const projectQuery = {};
  if (theme) {
    projectQuery.theme = new RegExp(escapeRegex(theme.trim()), "i");
  }
  if (problemStatement) {
    projectQuery.$or = [
      { problemCode: new RegExp(escapeRegex(problemStatement.trim()), "i") },
      { title: new RegExp(escapeRegex(problemStatement.trim()), "i") },
      { problemStatement: new RegExp(escapeRegex(problemStatement.trim()), "i") },
    ];
  }
  if (isOpenInnovation !== undefined && isOpenInnovation !== "") {
    projectQuery.problemType = String(isOpenInnovation) === "true" || isOpenInnovation === "open" ? "open" : "official";
  }

  if (Object.keys(projectQuery).length > 0) {
    const matchingProjects = await Project.find(projectQuery).select("team");
    const matchingTeamIds = matchingProjects.map((p) => p.team);
    query._id = { $in: matchingTeamIds };
  }

  // User details filters
  const userQuery = {};
  if (college) {
    userQuery.$or = [
      { college: new RegExp(escapeRegex(college.trim()), "i") },
      { collegeName: new RegExp(escapeRegex(college.trim()), "i") },
    ];
  }
  if (department) {
    userQuery.department = new RegExp(escapeRegex(department.trim()), "i");
  }

  if (search?.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    userQuery.$or = userQuery.$or || [];
    userQuery.$or.push(
      { name: regex },
      { email: regex },
      { college: regex },
      { collegeName: regex },
      { department: regex }
    );
  }

  if (Object.keys(userQuery).length > 0) {
    const matchingUsers = await User.find(userQuery).select("_id");
    const userIds = matchingUsers.map((u) => u._id);
    const searchOr = [];

    if (search?.trim()) {
      searchOr.push({ teamName: new RegExp(escapeRegex(search.trim()), "i") });
    }

    if (userIds.length > 0) {
      searchOr.push({ leader: { $in: userIds } }, { members: { $in: userIds } });
    }

    if (searchOr.length > 0) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }
  }

  return query;
};

const buildSort = (sort = "newest") => {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "teamName") return { teamName: 1 };
  return { createdAt: -1 };
};

const getProjectsAndSubmissions = async (teams) => {
  const teamIds = teams.map((team) => team._id);
  const [projects, submissions] = await Promise.all([
    Project.find({ team: { $in: teamIds } }).populate("problemStatementId"),
    Submission.find({ team: { $in: teamIds } })
      .populate("project")
      .populate("submittedBy", "name email phone role status"),
  ]);

  return {
    projectByTeam: new Map(projects.map((project) => [project.team.toString(), project])),
    submissionByTeam: new Map(submissions.map((submission) => [submission.team.toString(), submission])),
  };
};

const updateReviewState = async (teamId, adminId, { status, remarks }) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (status) {
    team.currentStatus = status;
  }

  if (remarks !== undefined) {
    team.remarks = remarks;
  }

  if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
    team.reviewedBy = adminId;
  }
  team.reviewedAt = new Date();
  await team.save();

  const memberIds = team.members.map((member) => member._id || member);
  await User.updateMany({ _id: { $in: memberIds } }, { status: team.currentStatus });
  await Submission.findOneAndUpdate(
    { team: team._id },
    { status: STATUS_TO_SUBMISSION_STATUS[team.currentStatus] || "under_review" },
    { runValidators: true }
  );

  const populatedTeam = await Team.findById(team._id).populate(teamPopulate);
  return normalizeTeam({
    team: populatedTeam,
    project: await Project.findOne({ team: team._id }),
    submission: await Submission.findOne({ team: team._id })
      .populate("project")
      .populate("submittedBy", "name email phone role status"),
  });
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalRegisteredTeams,
    totalRegisteredParticipants,
    totalProjects,
    totalSubmittedProjects,
    teamsUnderReview,
    selectedTeams,
    rejectedTeams,
    openInnovationEntries,
    officialEntries,
  ] = await Promise.all([
    Team.countDocuments(),
    User.countDocuments({ role: "participant" }),
    Project.countDocuments(),
    Submission.countDocuments({ status: { $ne: "draft" } }),
    Team.countDocuments({ currentStatus: "under_review" }),
    Team.countDocuments({ currentStatus: "selected" }),
    Team.countDocuments({ currentStatus: "rejected" }),
    Project.countDocuments({ problemType: "open" }),
    Project.countDocuments({ problemType: "official" }),
  ]);

  return sendSuccess(res, 200, "Admin dashboard fetched successfully", {
    cards: {
      totalRegisteredTeams,
      totalRegisteredParticipants,
      totalProjects,
      totalSubmittedProjects: totalSubmittedProjects || totalProjects,
      teamsUnderReview,
      selectedTeams,
      rejectedTeams,
      openInnovationEntries,
      officialEntries,
    },
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return sendSuccess(res, 200, "Users fetched successfully", { users });
});

export const listTeams = asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 10, 1, 100);
  const query = await buildTeamQuery(req.query);
  const sort = buildSort(req.query.sort);

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate(teamPopulate)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Team.countDocuments(query),
  ]);

  const { projectByTeam, submissionByTeam } = await getProjectsAndSubmissions(teams);
  const items = teams.map((team) =>
    normalizeTeam({
      team,
      project: projectByTeam.get(team._id.toString()) || null,
      submission: submissionByTeam.get(team._id.toString()) || null,
    })
  );

  return sendSuccess(res, 200, "Teams fetched successfully", {
    teams: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

export const getTeamDetails = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, "Invalid team id");
  }

  const team = await Team.findById(req.params.id).populate(teamPopulate);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const [project, submission] = await Promise.all([
    Project.findOne({ team: team._id }).populate("problemStatementId"),
    Submission.findOne({ team: team._id })
      .populate("project")
      .populate("submittedBy", "name email phone role status"),
  ]);

  return sendSuccess(res, 200, "Team details fetched successfully", {
    team: normalizeTeam({ team, project, submission }),
  });
});

export const listSubmissions = asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 10, 1, 100);
  const query = req.query.status ? { status: req.query.status } : {};

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate({
        path: "team",
        populate: teamPopulate,
      })
      .populate("project")
      .populate("submittedBy", "name email phone role status")
      .sort({ finalSubmittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Submission.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Submissions fetched successfully", {
    submissions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

export const updateTeamStatus = asyncHandler(async (req, res) => {
  const status = req.body.status || req.body.currentStatus;
  const team = await updateReviewState(req.params.id || req.params.teamId, req.user.id, {
    status,
    remarks: req.body.remarks,
  });

  return sendSuccess(res, 200, "Team status updated successfully", { team });
});

export const updateTeamRemarks = asyncHandler(async (req, res) => {
  const team = await updateReviewState(req.params.id, req.user.id, {
    remarks: req.body.remarks,
  });

  return sendSuccess(res, 200, "Team remarks saved successfully", { team });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      status: req.body.status,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, "User status updated successfully", { user });
});

const countBy = async (model, field, match = {}) => {
  const rows = await model.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: [`$${field}`, "Not specified"] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return rows.map((row) => ({ label: row._id || "Not specified", count: row.count }));
};

const countByFirstAvailable = async (model, fields, match = {}) => {
  const fallbackExpression = fields.reduceRight(
    (expression, field) => ({ $ifNull: [`$${field}`, expression] }),
    "Not specified"
  );
  const rows = await model.aggregate([
    { $match: match },
    {
      $group: {
        _id: fallbackExpression,
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return rows.map((row) => ({ label: row._id || "Not specified", count: row.count }));
};

export const getAnalytics = asyncHandler(async (_req, res) => {
  const [
    totalTeams,
    totalParticipants,
    totalProjects,
    pendingReviews,
    selectedTeams,
    rejectedTeams,
    openInnovationCount,
    officialProblemCount,
    collegeWiseRegistrationCount,
    departmentWiseRegistrationCount,
    themeWiseRegistrationCount,
    problemStatementWiseCount,
  ] = await Promise.all([
    Team.countDocuments(),
    User.countDocuments({ role: "participant" }),
    Project.countDocuments(),
    Team.countDocuments({ currentStatus: { $in: ["pending", "under_review"] } }),
    Team.countDocuments({ currentStatus: "selected" }),
    Team.countDocuments({ currentStatus: "rejected" }),
    Project.countDocuments({ problemType: "open" }),
    Project.countDocuments({ problemType: "official" }),
    countByFirstAvailable(User, ["collegeName", "college"], { role: "participant" }),
    countBy(User, "department", { role: "participant" }),
    countBy(Project, "theme"),
    countBy(Project, "problemCode"),
  ]);

  const selectionPercentage = totalTeams ? Number(((selectedTeams / totalTeams) * 100).toFixed(2)) : 0;
  const totalColleges = collegeWiseRegistrationCount.filter((row) => row.label !== "Not specified").length;

  return sendSuccess(res, 200, "Admin analytics fetched successfully", {
    summary: {
      totalTeams,
      totalParticipants,
      totalColleges,
      totalProjects,
      pendingReviews,
      selectedTeams,
      rejectedTeams,
      openInnovationCount,
      officialProblemCount,
      selectionPercentage,
    },
    charts: {
      collegeWiseRegistrationCount,
      departmentWiseRegistrationCount,
      themeWiseRegistrationCount,
      problemStatementWiseCount,
    },
  });
});

const toCsv = (headers, rows) => {
  const escape = (value) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  };

  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
};

export const exportAdminData = asyncHandler(async (req, res) => {
  const format = req.query.format || "csv";
  const scope = req.query.scope || "teams";
  
  const query = {};
  if (req.query.status) {
    query.currentStatus = req.query.status;
  }

  const teams = await Team.find(query).populate(teamPopulate).sort({ createdAt: -1 });
  const { projectByTeam, submissionByTeam } = await getProjectsAndSubmissions(teams);

  const headers = [
    "Team Name",
    "Leader Name",
    "Leader Email",
    "Leader Phone",
    "Members Count",
    "College",
    "Department",
    "Project Title",
    "Theme",
    "Problem Code",
    "Problem Type",
    "Status",
    "Remarks",
    "Submission Date",
  ];

  const rows = teams.map((team) => {
    const project = projectByTeam.get(team._id.toString());
    const submission = submissionByTeam.get(team._id.toString());
    const normalized = normalizeTeam({ team, project, submission });
    return {
      "Team Name": normalized.teamName,
      "Leader Name": normalized.leader?.name || "",
      "Leader Email": normalized.leader?.email || "",
      "Leader Phone": normalized.leader?.phone || "",
      "Members Count": normalized.memberCount,
      College: normalized.college,
      Department: normalized.department,
      "Project Title": project?.title || "",
      Theme: project?.theme || "",
      "Problem Code": project?.problemCode || "",
      "Problem Type": project?.problemType || "official",
      Status: normalized.status,
      Remarks: normalized.remarks,
      "Submission Date": normalized.submissionDate?.toISOString?.() || "",
    };
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${scope}-export.csv"`);
  return res.status(200).send(toCsv(headers, rows));
});

export const getAdminOverview = getDashboard;
