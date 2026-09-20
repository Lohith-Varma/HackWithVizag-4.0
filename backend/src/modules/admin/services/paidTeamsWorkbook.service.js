import ExcelJS from "exceljs";

const HEADER_FILL = "17365D";
const HEADER_TEXT = "FFFFFF";
const ACCENT_FILL = "D9EAF7";
const BORDER_COLOR = "D9E2F3";
const BODY_TEXT = "1F2937";
const CURRENCY_FORMAT = '[$₹-en-IN]#,##0';
const DATE_FORMAT = "dd-mmm-yyyy hh:mm";

const sourceLabels = {
  all: "All Paid/Confirmed",
  offline: "Offline Registration Only",
  spot: "Spot Registration Only",
};

const styleHeader = (worksheet) => {
  const row = worksheet.getRow(1);
  row.height = 34;
  row.font = { name: "Arial", size: 10, bold: true, color: { argb: HEADER_TEXT } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  row.eachCell((cell) => {
    cell.border = {
      right: { style: "thin", color: { argb: "FFFFFF" } },
      bottom: { style: "thin", color: { argb: HEADER_FILL } },
    };
  });
};

const styleDataSheet = (worksheet, { wrapColumns = [] } = {}) => {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = { from: "A1", to: `${worksheet.lastColumn.letter}${Math.max(worksheet.rowCount, 1)}` };
  worksheet.properties.defaultRowHeight = 22;
  worksheet.properties.tabColor = { argb: HEADER_FILL };
  worksheet.showGridLines = false;
  styleHeader(worksheet);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.font = { name: "Arial", size: 10, color: { argb: BODY_TEXT } };
    row.alignment = { vertical: "middle" };
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: BORDER_COLOR } } };
    });
  });

  wrapColumns.forEach((key) => {
    worksheet.getColumn(key).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) cell.alignment = { vertical: "top", wrapText: true };
    });
  });
};

const buildTeamRows = (teams) => teams.map((team, index) => ({
  serialNumber: index + 1,
  source: team.source,
  registrationNumber: team.registrationNumber,
  teamName: team.teamName,
  collegeName: team.collegeName,
  teamSize: team.teamSize,
  problemStatement: team.problemStatement,
  problemStatementCode: team.problemStatementCode,
  paymentStatus: team.paymentStatus,
  registrationStatus: team.registrationStatus,
  amount: team.amount,
  utr: team.utr,
  registrationDate: team.registrationDate,
  paymentDate: team.paymentDate,
  confirmationDate: team.confirmationDate,
  leaderName: team.leaderName,
  leaderEmail: team.leaderEmail,
  leaderPhone: team.leaderPhone,
  projectTitle: team.projectTitle,
  githubRepository: team.githubRepository,
}));

const buildStudentRows = (teams) => {
  const rows = teams.flatMap((team) => team.members.map((member) => ({
    source: team.source,
    registrationNumber: team.registrationNumber,
    teamName: team.teamName,
    collegeName: team.collegeName,
    teamSize: team.teamSize,
    problemStatement: team.problemStatement,
    problemStatementCode: team.problemStatementCode,
    memberNumber: member.memberNumber,
    memberRole: member.role,
    studentName: member.name,
    email: member.email,
    phone: member.phone,
    studentCollege: member.collegeName,
    studentRegistrationId: member.studentRegistrationId,
    department: member.department,
    year: member.year,
    gender: member.gender,
  })));

  rows.sort((left, right) =>
    left.source.localeCompare(right.source, "en", { sensitivity: "base" }) ||
    left.collegeName.localeCompare(right.collegeName, "en", { sensitivity: "base" }) ||
    left.registrationNumber.localeCompare(right.registrationNumber, "en", { sensitivity: "base", numeric: true }) ||
    left.memberNumber - right.memberNumber
  );

  return rows.map((row, index) => ({ serialNumber: index + 1, ...row }));
};

const incrementBreakdown = (map, key, participants) => {
  const label = String(key || "Not specified").trim() || "Not specified";
  const current = map.get(label) || { teamCount: 0, participantCount: 0 };
  current.teamCount += 1;
  current.participantCount += participants;
  map.set(label, current);
};

const buildBreakdowns = (teams) => {
  const colleges = new Map();
  const problemStatements = new Map();
  const emailCounts = new Map();

  teams.forEach((team) => {
    incrementBreakdown(colleges, team.collegeName, team.members.length);
    const problemLabel = team.problemStatementCode && team.problemStatementCode !== "N/A"
      ? `${team.problemStatementCode} - ${team.problemStatement || "Not specified"}`
      : team.problemStatement || "N/A";
    incrementBreakdown(problemStatements, problemLabel, team.members.length);
    team.members.forEach((member) => {
      const email = String(member.email || "").trim().toLowerCase();
      if (email) emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    });
  });

  return {
    colleges: [...colleges.entries()]
      .map(([label, counts]) => ({ label, ...counts }))
      .sort((left, right) => right.teamCount - left.teamCount || left.label.localeCompare(right.label)),
    problemStatements: [...problemStatements.entries()]
      .map(([label, counts]) => ({ label, ...counts }))
      .sort((left, right) => right.teamCount - left.teamCount || left.label.localeCompare(right.label)),
    duplicateParticipantRows: [...emailCounts.values()].reduce((count, occurrences) => count + Math.max(occurrences - 1, 0), 0),
  };
};

const addSummary = (workbook, teams, source, generatedAt) => {
  const worksheet = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: "5B9BD5" } },
    views: [{ showGridLines: false }],
  });
  const offlineTeams = teams.filter((team) => team.sourceKey === "offline");
  const spotTeams = teams.filter((team) => team.sourceKey === "spot");
  const participants = teams.reduce((total, team) => total + team.members.length, 0);
  const offlineParticipants = offlineTeams.reduce((total, team) => total + team.members.length, 0);
  const spotParticipants = spotTeams.reduce((total, team) => total + team.members.length, 0);
  const breakdowns = buildBreakdowns(teams);

  worksheet.mergeCells("A1:D1");
  worksheet.getCell("A1").value = "Hack With Vizag 4.0 Paid/Confirmed Registrations";
  worksheet.getCell("A1").font = { name: "Arial", size: 16, bold: true, color: { argb: HEADER_FILL } };
  worksheet.getCell("A1").alignment = { vertical: "middle" };
  worksheet.getRow(1).height = 28;
  worksheet.getCell("A3").value = "Export Scope";
  worksheet.getCell("B3").value = sourceLabels[source] || sourceLabels.all;
  worksheet.getCell("A4").value = "Generated At";
  worksheet.getCell("B4").value = generatedAt;
  worksheet.getCell("B4").numFmt = DATE_FORMAT;

  const metrics = [
    ["Paid/Confirmed Teams", teams.length],
    ["Total Participants", participants],
    ["Offline Registration Teams", offlineTeams.length],
    ["Offline Participants", offlineParticipants],
    ["Spot Registration Teams", spotTeams.length],
    ["Spot Participants", spotParticipants],
    ["Potential Duplicate Participant Rows", breakdowns.duplicateParticipantRows],
  ];
  worksheet.getCell("A6").value = "Summary";
  worksheet.getCell("A6").font = { name: "Arial", size: 11, bold: true, color: { argb: HEADER_FILL } };
  worksheet.getRow(7).values = ["Metric", "Count"];
  metrics.forEach((metric) => worksheet.addRow(metric));

  const collegeHeaderRow = worksheet.rowCount + 2;
  worksheet.getCell(collegeHeaderRow, 1).value = "College Breakdown";
  worksheet.getCell(collegeHeaderRow, 1).font = { name: "Arial", size: 11, bold: true, color: { argb: HEADER_FILL } };
  worksheet.getRow(collegeHeaderRow + 1).values = ["College", "Team Count", "Participant Count"];
  breakdowns.colleges.forEach((row) => worksheet.addRow([row.label, row.teamCount, row.participantCount]));

  const problemHeaderRow = worksheet.rowCount + 2;
  worksheet.getCell(problemHeaderRow, 1).value = "Problem Statement Breakdown";
  worksheet.getCell(problemHeaderRow, 1).font = { name: "Arial", size: 11, bold: true, color: { argb: HEADER_FILL } };
  worksheet.getRow(problemHeaderRow + 1).values = ["Problem Statement", "Team Count", "Participant Count"];
  breakdowns.problemStatements.forEach((row) => worksheet.addRow([row.label, row.teamCount, row.participantCount]));

  [7, collegeHeaderRow + 1, problemHeaderRow + 1].forEach((rowNumber) => {
    const row = worksheet.getRow(rowNumber);
    row.font = { name: "Arial", size: 10, bold: true, color: { argb: HEADER_TEXT } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    row.alignment = { horizontal: "center", vertical: "middle" };
  });

  worksheet.getColumn(1).width = 48;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 4;
  worksheet.eachRow((row) => {
    row.font = { ...row.font, name: "Arial", size: row.font?.size || 10 };
    row.alignment = { ...row.alignment, vertical: "middle", wrapText: true };
  });
  worksheet.getCell(7 + metrics.length, 1).note = "Potential duplicates are repeated non-empty email addresses beyond their first occurrence. Source records are preserved.";
};

export const createPaidTeamsWorkbook = ({ teams, source = "all", generatedAt = new Date() }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hack With Vizag 4.0";
  workbook.title = "Paid and Confirmed Registrations";
  workbook.subject = "Offline and confirmed Spot Registration event operations report";
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.calcProperties.fullCalcOnLoad = true;

  const teamRows = buildTeamRows(teams);
  const teamsSheet = workbook.addWorksheet("Teams", { views: [{ showGridLines: false }] });
  teamsSheet.columns = [
    { header: "S.No", key: "serialNumber", width: 8 },
    { header: "Registration Source", key: "source", width: 23 },
    { header: "Registration Number", key: "registrationNumber", width: 24 },
    { header: "Team Name", key: "teamName", width: 25 },
    { header: "College Name", key: "collegeName", width: 30 },
    { header: "Team Size", key: "teamSize", width: 11 },
    { header: "Problem Statement", key: "problemStatement", width: 42 },
    { header: "Problem Statement Code", key: "problemStatementCode", width: 22 },
    { header: "Payment Status", key: "paymentStatus", width: 18 },
    { header: "Registration Status", key: "registrationStatus", width: 22 },
    { header: "Registration Amount", key: "amount", width: 20 },
    { header: "UTR ID", key: "utr", width: 22 },
    { header: "Registration Date", key: "registrationDate", width: 21 },
    { header: "Payment Date", key: "paymentDate", width: 21 },
    { header: "Confirmation Date", key: "confirmationDate", width: 21 },
    { header: "Team Leader Name", key: "leaderName", width: 24 },
    { header: "Team Leader Email", key: "leaderEmail", width: 30 },
    { header: "Team Leader Phone", key: "leaderPhone", width: 20 },
    { header: "Project Title", key: "projectTitle", width: 30 },
    { header: "GitHub Repository", key: "githubRepository", width: 36 },
  ];
  teamsSheet.addRows(teamRows);
  teamsSheet.getColumn("amount").numFmt = CURRENCY_FORMAT;
  ["registrationDate", "paymentDate", "confirmationDate"].forEach((key) => {
    teamsSheet.getColumn(key).numFmt = DATE_FORMAT;
  });
  ["serialNumber", "teamSize", "amount"].forEach((key) => {
    teamsSheet.getColumn(key).alignment = { horizontal: "right", vertical: "middle" };
  });
  styleDataSheet(teamsSheet, { wrapColumns: ["problemStatement", "projectTitle", "githubRepository"] });

  const studentRows = buildStudentRows(teams);
  const studentsSheet = workbook.addWorksheet("Students", { views: [{ showGridLines: false }] });
  studentsSheet.columns = [
    { header: "S.No", key: "serialNumber", width: 8 },
    { header: "Registration Source", key: "source", width: 23 },
    { header: "Registration Number", key: "registrationNumber", width: 24 },
    { header: "Team Name", key: "teamName", width: 25 },
    { header: "College Name", key: "collegeName", width: 30 },
    { header: "Team Size", key: "teamSize", width: 11 },
    { header: "Problem Statement", key: "problemStatement", width: 42 },
    { header: "Problem Statement Code", key: "problemStatementCode", width: 22 },
    { header: "Member Number", key: "memberNumber", width: 15 },
    { header: "Member Role", key: "memberRole", width: 16 },
    { header: "Student Name", key: "studentName", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Student College", key: "studentCollege", width: 30 },
    { header: "Student Registration ID", key: "studentRegistrationId", width: 24 },
    { header: "Department", key: "department", width: 20 },
    { header: "Year", key: "year", width: 12 },
    { header: "Gender", key: "gender", width: 12 },
  ];
  studentsSheet.addRows(studentRows);
  ["serialNumber", "teamSize", "memberNumber"].forEach((key) => {
    studentsSheet.getColumn(key).alignment = { horizontal: "right", vertical: "middle" };
  });
  styleDataSheet(studentsSheet, { wrapColumns: ["problemStatement"] });

  addSummary(workbook, teams, source, generatedAt);
  return workbook;
};

export const buildPaidTeamsWorkbookBuffer = async (options) => {
  const workbook = createPaidTeamsWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
  return Buffer.from(buffer);
};

export const buildPaidTeamsFilename = (source, date = new Date()) => {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => dateParts.find((item) => item.type === type)?.value;
  const dateText = `${part("year")}-${part("month")}-${part("day")}`;
  const sourceText = source === "offline" ? "Offline_Registrations" : source === "spot" ? "Spot_Registrations" : "Paid_Teams";
  return `Hack_With_Vizag_4.0_${sourceText}_${dateText}.xlsx`;
};
