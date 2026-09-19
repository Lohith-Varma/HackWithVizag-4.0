import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import mongoose from "mongoose";
import app from "../src/app.js";
import SpotRegistration from "../src/modules/spotRegistrations/models/spotRegistration.model.js";
import { validateSpotRegistration } from "../src/modules/spotRegistrations/services/spotRegistration.service.js";

mongoose.set("bufferCommands", false);

const validPayload = (phones = ["123", "000", "anything-entered-by-user"]) => ({
  teamName: "Disposable Spot Team",
  collegeName: "NSRIT",
  teamSize: 3,
  teamLeader: { name: "Leader", email: "spot-leader@example.com", phone: phones[0], collegeName: "NSRIT" },
  members: [
    { name: "Member 2", email: "spot-member2@example.com", phone: phones[1], collegeName: "NSRIT" },
    { name: "Member 3", email: "spot-member3@example.com", phone: phones[2], collegeName: "nsrit" },
  ],
  utr: "TEST-UTR",
});

test("Spot Registration accepts arbitrary non-empty phone text without normalization", () => {
  for (const phones of [
    ["123", "000", "999999"],
    ["+91 9876543210", "9876543210", "123456789012345"],
    ["abc123", "anything", "anything-entered-by-user"],
  ]) {
    const result = validateSpotRegistration(validPayload(phones));
    assert.deepEqual([result.teamLeader.phone, ...result.members.map((member) => member.phone)], phones);
  }
});

test("Spot Registration enforces only phone presence, not phone format", () => {
  const payload = validPayload();
  payload.members[0].phone = "";
  assert.throws(() => validateSpotRegistration(payload), (error) => {
    assert.equal(error.statusCode, 422);
    assert.equal(error.errors[0].field, "members.0.phone");
    return true;
  });
});

test("Spot Registration enforces 3 or 4 members and one college", () => {
  assert.throws(() => validateSpotRegistration({ ...validPayload(), teamSize: 2 }), (error) => error.errors[0].message.includes("Team size must be 3 or 4"));
  assert.throws(() => validateSpotRegistration({ ...validPayload(), teamSize: 4 }), (error) => error.errors[0].message.includes("requires 3 additional members"));
  const crossCollege = validPayload();
  crossCollege.members[1].collegeName = "Another College";
  assert.throws(() => validateSpotRegistration(crossCollege), /same college/);
});

test("Spot Registration detects duplicate emails but never duplicate phones", () => {
  const duplicateEmail = validPayload(["same", "same", "same"]);
  duplicateEmail.members[0].email = duplicateEmail.teamLeader.email.toUpperCase();
  assert.throws(() => validateSpotRegistration(duplicateEmail), /already registered/);

  const duplicatePhones = validateSpotRegistration(validPayload(["same", "same", "same"]));
  assert.equal(duplicatePhones.members[1].phone, "same");
});

test("Spot Registration schema has separate lifecycle, server fee fields, and a race-safe email index", () => {
  assert.deepEqual(SpotRegistration.schema.path("status").enumValues, ["SPOT_SUBMITTED", "SPOT_CONFIRMED"]);
  assert.deepEqual(SpotRegistration.schema.path("teamSize").options.enum, [3, 4]);
  assert.equal(SpotRegistration.schema.path("teamLeader.phone").options.match, undefined);
  assert.equal(SpotRegistration.schema.path("teamLeader.phone").options.maxlength, undefined);
  const participantIndex = SpotRegistration.schema.indexes().find(([fields]) => fields.participantEmails === 1);
  assert.equal(participantIndex?.[1]?.unique, true);
  assert.equal(SpotRegistration.collection.name, "spotregistrations");
});

test("Spot admin list, details, edit, confirm, and screenshot routes reject unauthenticated access", async () => {
  const server = app.listen(0);
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "6aa26a7fcb1c898c084d8b29";
  try {
    for (const [method, path] of [
      ["GET", "/api/admin/spot-registrations"],
      ["GET", `/api/admin/spot-registrations/${id}`],
      ["PATCH", `/api/admin/spot-registrations/${id}`],
      ["POST", `/api/admin/spot-registrations/${id}/confirm`],
      ["GET", `/api/admin/spot-registrations/${id}/payment-screenshot`],
    ]) {
      const response = await fetch(`${base}${path}`, { method });
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
