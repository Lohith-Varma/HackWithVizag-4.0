import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import mongoose from "mongoose";
import app from "../src/app.js";
import AuditLog from "../src/modules/admin/models/auditLog.model.js";
import { authorizeRoles } from "../src/middleware/auth.middleware.js";

const teamId = "6aa26a7fcb1c898c084d8b29";
const userId = "6aa26a7fcb1c898c084d8b30";

const withServer = async (callback) => {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test("audit log schema retains destructive target snapshots independently", () => {
  const log = new AuditLog({
    action: "TEAM_DELETED",
    actorAdminId: userId,
    actorAdminEmail: "admin@example.com",
    targetType: "TEAM",
    targetId: teamId,
    targetLabel: "Disposable Test Team",
    result: "SUCCESS",
  });
  assert.equal(log.validateSync(), undefined);
  assert.equal(log.targetId, teamId);
  assert.equal(log.targetLabel, "Disposable Test Team");
  assert.ok(AuditLog.schema.indexes().some(([keys]) => keys.createdAt === -1));
});

test("team cascade explicitly covers every team-owned collection and preserves users", async () => {
  const source = await readFile(new URL("../src/modules/admin/services/deletion.service.js", import.meta.url), "utf8");
  assert.match(source, /Submission\.deleteMany\(\{ team:/);
  assert.match(source, /Project\.deleteMany\(\{ team:/);
  assert.match(source, /OfflineRegistration\.deleteMany\(\{ team:/);
  assert.match(source, /User\.updateMany\([\s\S]*?\{ team: team\._id \}[\s\S]*?team: null/);
  assert.doesNotMatch(source, /User\.deleteMany\(\{ team:/);
  assert.match(source, /deleteStoredFile\(entry\.file/);
  assert.match(source, /PENDING_STORAGE/);
  assert.match(source, /PARTIAL_FAILURE/);
});

test("user deletion blocks memberships and protects every admin account", async () => {
  const source = await readFile(new URL("../src/modules/admin/services/deletion.service.js", import.meta.url), "utf8");
  assert.match(source, /user\.role === "admin"/);
  assert.match(source, /leader: user\._id/);
  assert.match(source, /members: user\._id/);
  assert.match(source, /submittedBy: user\._id/);
  assert.match(source, /Delete the team first/);
  assert.match(source, /user\.profilePhoto \? \{ url: user\.profilePhoto \}/);
});

test("destructive admin routes reject unauthenticated requests", async () => {
  mongoose.set("bufferCommands", false);
  await withServer(async (baseUrl) => {
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/admin/team/${teamId}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation: "Disposable Test Team" }) }),
      fetch(`${baseUrl}/api/admin/users/${userId}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation: "user@example.com" }) }),
      fetch(`${baseUrl}/api/admin/audit-logs`),
    ]);
    assert.deepEqual(responses.map((response) => response.status), [401, 401, 401]);
  });
});

test("admin authorization rejects participants and accepts admins", () => {
  const authorizeAdmin = authorizeRoles("admin");
  let participantError;
  authorizeAdmin({ user: { id: userId, role: "participant" } }, {}, (error) => { participantError = error; });
  assert.equal(participantError.statusCode, 403);

  let adminError = "not-called";
  authorizeAdmin({ user: { id: userId, role: "admin" } }, {}, (error) => { adminError = error; });
  assert.equal(adminError, undefined);
});

test("delete routes require typed confirmation payloads", async () => {
  const routes = await readFile(new URL("../src/modules/admin/routes/admin.routes.js", import.meta.url), "utf8");
  const validators = await readFile(new URL("../src/modules/admin/validators/admin.validator.js", import.meta.url), "utf8");
  assert.match(routes, /deleteTeamValidation, validateRequest, deleteTeam/);
  assert.match(routes, /deleteUserValidation, validateRequest, deleteUser/);
  assert.match(validators, /body\("confirmation"\)/);
  assert.match(validators, /User-email confirmation is required/);
});

test("there are no application routes that update or delete audit records", async () => {
  const routes = await readFile(new URL("../src/modules/admin/routes/admin.routes.js", import.meta.url), "utf8");
  assert.match(routes, /router\.get\("\/audit-logs"/);
  assert.doesNotMatch(routes, /router\.(?:patch|put|delete)\("\/audit-logs/);
});
