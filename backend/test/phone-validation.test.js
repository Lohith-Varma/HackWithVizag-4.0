import assert from "node:assert/strict";
import test from "node:test";
import User from "../src/modules/auth/models/user.model.js";
import { isValidIndianPhone, normalizeIndianPhone } from "../src/utils/phone.js";
import { validateTeam } from "../../frontend/src/utils/registrationValidation.js";
import { api } from "../../frontend/src/services/api.js";

const validInputs = [
  ["9876543210", "9876543210"],
  [" 9876543210 ", "9876543210"],
  ["98765 43210", "9876543210"],
  ["+919876543210", "9876543210"],
  ["91 9876543210", "9876543210"],
];

test("normalizes supported Indian phone formatting to ten digits", () => {
  validInputs.forEach(([input, expected]) => {
    assert.equal(normalizeIndianPhone(input), expected);
    assert.equal(isValidIndianPhone(input), true);
  });
});

test("rejects invalid lengths, prefixes, letters, and non-mobile starts", () => {
  ["1234567890", "987654321", "98765432101", "abcdefghij", "+449876543210"].forEach((input) => {
    assert.equal(isValidIndianPhone(input), false, input);
  });
});

test("User model stores supported phone formatting canonically and remains authoritative", () => {
  validInputs.forEach(([input, expected], index) => {
    const user = new User({ name: "Phone Test", email: `phone-${index}@example.com`, phone: input });
    assert.equal(user.phone, expected);
    assert.equal(user.validateSync(), undefined);
  });

  const invalid = new User({ name: "Phone Test", email: "phone-invalid@example.com", phone: "1234567890" });
  assert.equal(invalid.validateSync()?.errors?.phone?.message, "Phone number must be a valid 10 digit Indian mobile number");
});

const member = (suffix, phone) => ({
  fullName: `Member ${suffix}`,
  email: `member${suffix}@example.com`,
  phone,
  registeredNumber: `REG${suffix}`,
  department: "CSE",
  year: "2nd Year",
  college: "NSRIT",
});

test("three-member teams validate only their two actual additional members", () => {
  const errors = validateTeam({ teamName: "Three", members: [member(2, "98765 43210"), member(3, "9876543212")] }, {}, "NSRIT");
  assert.deepEqual(errors, {});
});

test("four-member teams validate every actual member and identify the failing field", () => {
  const valid = validateTeam({ teamName: "Four", members: [member(2, "9876543211"), member(3, "+91 9876543212"), member(4, "9876543213")] }, {}, "NSRIT");
  assert.deepEqual(valid, {});

  const invalid = validateTeam({ teamName: "Four", members: [member(2, "9876543211"), member(3, "1234567890"), member(4, "9876543213")] }, {}, "NSRIT");
  assert.match(invalid.members[1].phone, /Member 3 phone/);
});

test("team-registration API payload contains canonical strings and no optional fourth member", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody;
  globalThis.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ data: { ok: true } }),
    };
  };

  try {
    await api.registerTeam({
      personal: { phone: "+91 98765 43210" },
      team: { members: [member(2, "98765 43211"), member(3, "91 9876543212")] },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(capturedBody.personal.phone, "9876543210");
  assert.deepEqual(capturedBody.team.members.map((item) => item.phone), ["9876543211", "9876543212"]);
  assert.equal(capturedBody.team.members.length, 2);
  assert.equal(typeof capturedBody.team.members[0].phone, "string");
});
