import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import request from "node:http";
import app from "../src/app.js";

const controllerSource = fs.readFileSync(new URL("../src/modules/submissions/controllers/submission.controller.js", import.meta.url), "utf8");
const adminSource = fs.readFileSync(new URL("../src/modules/admin/controllers/admin.controller.js", import.meta.url), "utf8");

const getWithoutAuthentication = (path) => new Promise((resolve, reject) => {
  const server = app.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const req = request.get({ hostname: "127.0.0.1", port: address.port, path }, (response) => {
      response.resume();
      response.on("end", () => {
        server.close(() => resolve(response.statusCode));
      });
    });
    req.on("error", (error) => server.close(() => reject(error)));
  });
});

test("phase endpoints remain protected by participant authentication", async () => {
  assert.equal(await getWithoutAuthentication("/api/submissions/team-registration"), 401);
  assert.equal(await getWithoutAuthentication("/api/submissions/project"), 401);
});

test("team registration persists the existing pending state without creating a project", () => {
  const phaseSource = controllerSource.slice(controllerSource.indexOf("export const registerTeamPhase"), controllerSource.indexOf("export const submitProjectPhase"));
  assert.match(phaseSource, /currentStatus:\s*"pending"/);
  assert.doesNotMatch(phaseSource, /Project\.(create|findOneAndUpdate)/);
  assert.doesNotMatch(phaseSource, /uploadFile\(/);
});

test("project phase preserves private storage and final submission contracts", () => {
  const phaseSource = controllerSource.slice(controllerSource.indexOf("export const submitProjectPhase"));
  assert.match(phaseSource, /ensurePrivateBucket\(\)/);
  assert.match(phaseSource, /folder:\s*"ppt"/);
  assert.match(phaseSource, /status:\s*"under_review"/);
  assert.match(phaseSource, /finalSubmittedAt:\s*submittedAt/);
  assert.match(phaseSource, /team\.leader\.toString\(\) !== userId/);
});

test("admin review rejects registration-only teams and exposes funnel counts", () => {
  assert.match(adminSource, /has not completed project submission and is not ready for evaluation/);
  assert.match(adminSource, /awaitingSubmissionTeams/);
  assert.match(adminSource, /pendingOfflineRegistrationTeams/);
  assert.match(adminSource, /offlineStatus/);
});
