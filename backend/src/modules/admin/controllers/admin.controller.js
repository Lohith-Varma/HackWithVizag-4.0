import mongoose from "mongoose";
import User from "../../auth/models/user.model.js";
import Project from "../../projects/models/project.model.js";
import Submission from "../../submissions/models/submission.model.js";
import Team from "../../teams/models/team.model.js";
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
  team.leader?.collegeName || team.leader?.college || team.members?.find((member) => member.collegeName || member.college)?.collegeName || team.members?.find((member) => member.college)?.college || "";

const getPrimaryDepartment = (team) =>
  team.leader?.department || team.members?.find((member) => member.department)?.department || "";

const teamPopulate = [
  { path: "leader", select: "name email phone role status college collegeName department year" },
  { path: "members", select: "name email phone role status college collegeName department year" },
  { path: "reviewedBy", select: "name email role" },
];

const normalizeTeam = ({ team, project = null, submission = null } = {}) => ({
  id: team._id.toString(),
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

const buildTeamQuery = async ({ search, status }) => {
  const query = {};

  if (status) {
    query.currentStatus = status;
  }

  if (!search?.trim()) {
    return query;
  }

  const regex = new RegExp(escapeRegex(search.trim()), "i");
  const users = await User.find({
    $or: [
      { name: regex },
      { email: regex },
      { college: regex },
      { collegeName: regex },
      { department: regex },
    ],
  }).select("_id");

  query.$or = [{ teamName: regex }];

  if (users.length) {
    const userIds = users.map((user) => user._id);
    query.$or.push({ leader: { $in: userIds } }, { members: { $in: userIds } });
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
    Project.find({ team: { $in: teamIds } }),
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

  team.reviewedBy = adminId;
  team.reviewedAt = new Date();
  await team.save();

  const memberIds = team.members.map((member) => member._id || member);
  await User.updateMany({ _id: { $in: memberIds } }, { status: team.currentStatus });
  await Submission.findOneAndUpdate(
    { team: team._id },
    { status: STATUS_TO_SUBMISSION_STATUS[team.currentStatus] },
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
  ] = await Promise.all([
    Team.countDocuments(),
    User.countDocuments({ role: "participant" }),
    Project.countDocuments(),
    Submission.countDocuments({ status: { $ne: "draft" } }),
    Team.countDocuments({ currentStatus: "under_review" }),
    Team.countDocuments({ currentStatus: "selected" }),
    Team.countDocuments({ currentStatus: "rejected" }),
  ]);

  return sendSuccess(res, 200, "Admin dashboard fetched successfully", {
    cards: {
      totalRegisteredTeams,
      totalRegisteredParticipants,
      totalSubmittedProjects: totalSubmittedProjects || totalProjects,
      teamsUnderReview,
      selectedTeams,
      rejectedTeams,
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
    Project.findOne({ team: team._id }),
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
  const fallbackExpression = fields.reduceRight((expression, field) => ({ $ifNull: [`$${field}`, expression] }), "Not specified");
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
    collegeWiseRegistrationCount,
    departmentWiseRegistrationCount,
    themeWiseRegistrationCount,
  ] = await Promise.all([
    Team.countDocuments(),
    User.countDocuments({ role: "participant" }),
    Project.countDocuments(),
    Team.countDocuments({ currentStatus: { $in: ["pending", "under_review"] } }),
    Team.countDocuments({ currentStatus: "selected" }),
    Team.countDocuments({ currentStatus: "rejected" }),
    countByFirstAvailable(User, ["collegeName", "college"], { role: "participant" }),
    countBy(User, "department", { role: "participant" }),
    countBy(Project, "theme"),
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
      selectionPercentage,
    },
    charts: {
      collegeWiseRegistrationCount,
      departmentWiseRegistrationCount,
      themeWiseRegistrationCount,
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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toExcelHtml = (headers, rows) => `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers
  .map((header) => `<th>${escapeHtml(header)}</th>`)
  .join("")}</tr></thead><tbody>${rows
  .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
  .join("")}</tbody></table></body></html>`;

const toPdf = (title, headers, rows) => {
  const lines = [title, "", headers.join(" | "), ...rows.map((row) => headers.map((header) => row[header] ?? "").join(" | "))];
  const text = lines.join("\n").replace(/[()\\]/g, "\\$&");
  const stream = `BT /F1 10 Tf 40 780 Td 14 TL (${text.split("\n").join(") Tj T* (")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return body;
};

const parseExportIds = (ids) =>
  String(ids || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const getExportRows = async (scope, status, ids) => {
  if (scope === "participants") {
    const users = await User.find({ role: "participant" }).sort({ createdAt: -1 });
    return {
      title: "Participants Export",
      headers: ["Name", "Email", "Phone", "Status", "Registered At"],
      rows: users.map((user) => ({
        Name: user.name,
        Email: user.email,
        Phone: user.phone,
        Status: user.status,
        "Registered At": user.createdAt?.toISOString() || "",
      })),
    };
  }

  if (scope === "statistics") {
    const analytics = await Promise.all([
      Team.countDocuments(),
      User.countDocuments({ role: "participant" }),
      Project.countDocuments(),
      Team.countDocuments({ currentStatus: "selected" }),
      Team.countDocuments({ currentStatus: "rejected" }),
    ]);
    return {
      title: "Statistics Export",
      headers: ["Metric", "Value"],
      rows: [
        { Metric: "Total Teams", Value: analytics[0] },
        { Metric: "Total Participants", Value: analytics[1] },
        { Metric: "Total Projects", Value: analytics[2] },
        { Metric: "Selected Teams", Value: analytics[3] },
        { Metric: "Rejected Teams", Value: analytics[4] },
      ],
    };
  }

  const query = {};
  const effectiveStatus = status || (scope === "selectedTeams" ? "selected" : scope === "rejectedTeams" ? "rejected" : "");
  if (effectiveStatus) {
    query.currentStatus = effectiveStatus;
  }

  const teamIds = parseExportIds(ids);
  if (teamIds.length) {
    query._id = { $in: teamIds };
  }

  const teams = await Team.find(query).populate(teamPopulate).sort({ createdAt: -1 });
  const { projectByTeam, submissionByTeam } = await getProjectsAndSubmissions(teams);

  return {
    title: "Teams Export",
    headers: [
      "Team Name",
      "Leader",
      "Leader Email",
      "Members",
      "College",
      "Department",
      "Project",
      "Theme",
      "Status",
      "Remarks",
      "Submission Date",
    ],
    rows: teams.map((team) => {
      const project = projectByTeam.get(team._id.toString());
      const submission = submissionByTeam.get(team._id.toString());
      const normalized = normalizeTeam({ team, project, submission });
      return {
        "Team Name": normalized.teamName,
        Leader: normalized.leader?.name || "",
        "Leader Email": normalized.leader?.email || "",
        Members: normalized.memberCount,
        College: normalized.college,
        Department: normalized.department,
        Project: project?.title || "",
        Theme: project?.theme || "",
        Status: normalized.status,
        Remarks: normalized.remarks,
        "Submission Date": normalized.submissionDate?.toISOString?.() || "",
      };
    }),
  };
};

export const exportAdminData = asyncHandler(async (req, res) => {
  const format = req.query.format || "csv";
  const scope = req.query.scope || "teams";
  const { title, headers, rows } = await getExportRows(scope, req.query.status, req.query.ids);
  const safeScope = scope.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeScope}.pdf"`);
    return res.status(200).send(Buffer.from(toPdf(title, headers, rows), "binary"));
  }

  if (format === "excel") {
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", `attachment; filename="${safeScope}.xls"`);
    return res.status(200).send(toExcelHtml(headers, rows));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeScope}.csv"`);
  return res.status(200).send(toCsv(headers, rows));
});

export const getAdminOverview = getDashboard;
