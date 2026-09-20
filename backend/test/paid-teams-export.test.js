import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import test from "node:test";
import ExcelJS from "exceljs";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/modules/auth/models/user.model.js";
import { normalizePaidTeams } from "../src/modules/admin/services/paidTeamsReport.service.js";
import {
  buildPaidTeamsFilename,
  buildPaidTeamsWorkbookBuffer,
} from "../src/modules/admin/services/paidTeamsWorkbook.service.js";

const leader = {
  _id: "6aa26a7fcb1c898c084d8b21",
  name: "Rahul Leader",
  email: "rahul@example.com",
  phone: "9876543210",
  collegeName: "NSRIT",
  registeredNumber: "23A01",
  department: "CSE",
  year: "3",
  gender: "Male",
};

const member = (id, number) => ({
  _id: id,
  name: `Member ${number}`,
  email: `member${number}@example.com`,
  phone: `98765432${number}0`,
  collegeName: "NSRIT",
  registeredNumber: `23A0${number}`,
  department: "CSE",
  year: "3",
  gender: "Female",
});

const onlineTeam = {
  _id: "6aa26a7fcb1c898c084d8b29",
  teamName: "Team Alpha",
  leader,
  members: [leader, member("6aa26a7fcb1c898c084d8b22", 2), member("6aa26a7fcb1c898c084d8b23", 3)],
};

const offlineRegistration = {
  _id: "6aa26a7fcb1c898c084d8b30",
  team: onlineTeam,
  status: "OFFLINE_SUBMITTED",
  teamSize: 4,
  expectedAmount: 1500,
  utrId: "UTR-OFFLINE-001",
  confirmationCode: "HWV-OFF-ALPHA1",
  payment: { amount: 1500, status: "submitted" },
  submittedAt: new Date("2026-09-20T08:30:00.000Z"),
};

const spotRegistration = {
  _id: "6aa26a7fcb1c898c084d8b40",
  registrationNumber: "HWV-SPOT-0001",
  teamName: "Team Beta",
  collegeName: "ABC College",
  teamSize: 3,
  teamLeader: {
    name: "Spot Leader",
    email: "rahul@example.com",
    phone: "9000000001",
    registrationId: "SPOT-STU-1",
    department: "ECE",
    collegeName: "ABC College",
  },
  members: [
    { name: "Spot Two", email: "spot2@example.com", phone: "9000000002", registrationId: "SPOT-STU-2", department: "ECE", collegeName: "ABC College" },
    { name: "Spot Three", email: "spot3@example.com", phone: "9000000003", registrationId: "SPOT-STU-3", department: "ECE", collegeName: "ABC College" },
  ],
  calculatedFee: 1500,
  payment: { amount: 1500, utr: "UTR-SPOT-001" },
  status: "SPOT_CONFIRMED",
  submittedAt: new Date("2026-09-20T09:00:00.000Z"),
  confirmedAt: new Date("2026-09-20T09:30:00.000Z"),
};

const reportTeams = () => normalizePaidTeams({
  offlineRegistrations: [
    offlineRegistration,
    { ...offlineRegistration, _id: "6aa26a7fcb1c898c084d8b31", status: "PAYMENT_PENDING", confirmationCode: "EXCLUDED-OFFLINE" },
  ],
  spotRegistrations: [
    spotRegistration,
    { ...spotRegistration, _id: "6aa26a7fcb1c898c084d8b41", status: "SPOT_SUBMITTED", registrationNumber: "EXCLUDED-SPOT" },
  ],
  projects: [{
    team: onlineTeam._id,
    title: "Institutional ERP",
    githubRepository: "https://github.com/example/erp",
    problemStatement: "Legacy problem text",
    problemCode: "HWV-PS08",
    problemStatementId: { code: "HWV-PS08", title: "Institutional ERP Platform" },
  }],
  submissions: [{ _id: "6aa26a7fcb1c898c084d8b35", team: onlineTeam._id }],
});

test("paid report normalization includes only OFFLINE_SUBMITTED and SPOT_CONFIRMED records", () => {
  const teams = reportTeams();
  assert.deepEqual(teams.map((team) => team.registrationNumber), ["HWV-OFF-ALPHA1", "HWV-SPOT-0001"]);
  assert.deepEqual(teams.map((team) => team.registrationStatus), ["OFFLINE_SUBMITTED", "SPOT_CONFIRMED"]);
  assert.equal(teams[0].teamSize, 3, "online team size must come from the populated roster");
  assert.equal(teams[0].problemStatementCode, "HWV-PS08");
  assert.equal(teams[0].problemStatement, "Institutional ERP Platform");
  assert.equal(teams[0].members[0].role, "Team Leader");
  assert.equal(teams[1].problemStatement, "N/A");
  assert.equal(teams[1].problemStatementCode, "N/A");
  assert.equal(teams[1].members.length, 3);
});

test("paid report source filters retain their exact qualifying population", () => {
  const fixture = {
    offlineRegistrations: [offlineRegistration],
    spotRegistrations: [spotRegistration],
  };
  assert.deepEqual(normalizePaidTeams({ ...fixture, source: "offline" }).map((team) => team.sourceKey), ["offline"]);
  assert.deepEqual(normalizePaidTeams({ ...fixture, source: "spot" }).map((team) => team.sourceKey), ["spot"]);
});

test("generated XLSX opens with formatted Teams, Students, and Summary sheets", async () => {
  const teams = reportTeams();
  const generatedAt = new Date("2026-09-21T06:00:00.000Z");
  const buffer = await buildPaidTeamsWorkbookBuffer({ teams, source: "all", generatedAt });
  const directory = await mkdtemp(path.join(tmpdir(), "hwv-paid-export-"));
  const file = path.join(directory, buildPaidTeamsFilename("all", generatedAt));

  try {
    await writeFile(file, buffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);

    assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Teams", "Students", "Summary"]);
    const teamsSheet = workbook.getWorksheet("Teams");
    const studentsSheet = workbook.getWorksheet("Students");
    const summarySheet = workbook.getWorksheet("Summary");

    assert.equal(teamsSheet.rowCount, 3);
    assert.equal(teamsSheet.getCell("C2").value, "HWV-OFF-ALPHA1");
    assert.equal(teamsSheet.getCell("F2").value, 3);
    assert.equal(teamsSheet.getCell("G2").value, "Institutional ERP Platform");
    assert.equal(teamsSheet.getCell("G3").value, "N/A");
    assert.equal(teamsSheet.getCell("K2").value, 1500);
    assert.ok(teamsSheet.getCell("K2").numFmt.includes("₹"));
    assert.equal(teamsSheet.getRow(1).font.bold, true);
    const autoFilterRange = typeof teamsSheet.autoFilter === "string"
      ? teamsSheet.autoFilter
      : `${teamsSheet.autoFilter.from}:${teamsSheet.autoFilter.to}`;
    assert.equal(autoFilterRange, "A1:T3");
    assert.equal(teamsSheet.views[0].state, "frozen");

    assert.equal(studentsSheet.rowCount, 7);
    assert.equal(studentsSheet.getCell("I2").value, 1);
    assert.equal(studentsSheet.getCell("J2").value, "Team Leader");
    assert.equal(studentsSheet.getCell("B5").value, "Spot Registration");
    assert.equal(studentsSheet.getCell("G5").value, "N/A");
    assert.equal(summarySheet.getCell("B8").value, 2);
    assert.equal(summarySheet.getCell("B9").value, 6);
    assert.equal(summarySheet.getCell("B14").value, 1, "duplicate email rows must be reported without removing either participant");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("report data access stays batched and read-only", async () => {
  const source = await readFile(
    new URL("../src/modules/admin/services/paidTeamsReport.service.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /OfflineRegistration\.find\(\{ status: "OFFLINE_SUBMITTED" \}\)/);
  assert.match(source, /SpotRegistration\.find\(\{ status: "SPOT_CONFIRMED" \}\)/);
  assert.match(source, /Project\.find\(\{ team: \{ \$in: teamIds \} \}\)/);
  assert.match(source, /Submission\.find\(\{ team: \{ \$in: teamIds \} \}\)/);
  assert.doesNotMatch(source, /\.(?:create|save|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany)\(/);
  assert.doesNotMatch(source, /for\s*\([^)]*\)\s*\{[^}]*await/s);
});

test("paid teams workbook route rejects unauthenticated access", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/reports/paid-teams/export`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("paid teams workbook route rejects an authenticated non-admin", async () => {
  const originalFindById = User.findById;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "paid-report-test-secret";
  User.findById = async () => ({
    _id: "6aa26a7fcb1c898c084d8b99",
    role: "participant",
    status: "selected",
  });
  const token = jwt.sign({ sub: "6aa26a7fcb1c898c084d8b99" }, process.env.JWT_SECRET);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/reports/paid-teams/export`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    User.findById = originalFindById;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
