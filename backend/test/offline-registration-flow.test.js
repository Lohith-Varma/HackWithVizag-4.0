import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/app.js";
import { buildStoragePath } from "../src/services/storage.service.js";
import { validateUploadedFile } from "../src/middleware/upload.middleware.js";
import OfflineRegistration from "../src/modules/offlineRegistration/models/offlineRegistration.model.js";

const teamId = "6aa26a7fcb1c898c084d8b29";

const withServer = async (callback) => {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test("offline registration schema enforces one submitted record per team", () => {
  const teamPath = OfflineRegistration.schema.path("team");
  const statusPath = OfflineRegistration.schema.path("status");
  assert.equal(teamPath.options.unique, true);
  assert.deepEqual(statusPath.enumValues, ["PAYMENT_PENDING", "OFFLINE_SUBMITTED"]);

  const registration = new OfflineRegistration({
    team: teamId,
    teamSize: 3,
    expectedAmount: 1500,
    utrId: "123456789012",
    status: "OFFLINE_SUBMITTED",
    registrationCompleted: true,
    paymentScreenshot: {
      filename: "proof.png",
      originalName: "proof.png",
      mimeType: "image/png",
      size: 4,
      storageProvider: "supabase",
      bucket: "hackwithvizag-uploads",
      storagePath: `payment-screenshots/${teamId}/proof.png`,
    },
  });

  assert.equal(registration.validateSync(), undefined);
  assert.equal(registration.registrationCompleted, true);
  assert.equal(registration.paymentScreenshot.storageProvider, "supabase");
});

test("payment screenshot validation preserves image formats and the 5 MB boundary", () => {
  const validFiles = [
    ["proof.jpg", "image/jpeg"],
    ["proof.jpeg", "image/jpeg"],
    ["proof.png", "image/png"],
    ["proof.webp", "image/webp"],
  ];

  validFiles.forEach(([originalname, mimetype]) => {
    const file = { originalname, mimetype, size: 5 * 1024 * 1024, buffer: Buffer.from("proof") };
    assert.equal(validateUploadedFile(file, { kind: "paymentProof", maxBytes: 5 * 1024 * 1024 }), file);
  });

  assert.throws(
    () => validateUploadedFile(
      { originalname: "proof.png", mimetype: "image/jpeg", size: 4, buffer: Buffer.from("proof") },
      { kind: "paymentProof", maxBytes: 5 * 1024 * 1024 },
    ),
    /does not match/,
  );
  assert.throws(
    () => validateUploadedFile(
      { originalname: "proof.png", mimetype: "image/png", size: 5 * 1024 * 1024 + 1, buffer: Buffer.from("proof") },
      { kind: "paymentProof", maxBytes: 5 * 1024 * 1024 },
    ),
    /upload limit/,
  );
});

test("payment screenshots use unique team-scoped Supabase object paths", () => {
  const first = buildStoragePath({ folder: "payment-screenshots", ownerId: teamId, originalName: "Payment Proof.PNG" });
  const second = buildStoragePath({ folder: "payment-screenshots", ownerId: teamId, originalName: "Payment Proof.PNG" });
  assert.match(first.storagePath, new RegExp(`^payment-screenshots/${teamId}/.+-payment-proof\\.png$`));
  assert.notEqual(first.storagePath, second.storagePath);
});

test("offline admin and screenshot routes reject unauthenticated access", async () => {
  await withServer(async (baseUrl) => {
    const [listResponse, detailResponse, screenshotResponse] = await Promise.all([
      fetch(`${baseUrl}/api/admin/offline-registrations`),
      fetch(`${baseUrl}/api/admin/offline-registrations/${teamId}`),
      fetch(`${baseUrl}/api/offline-registration/team/${teamId}/payment-screenshot`),
    ]);
    assert.equal(listResponse.status, 401);
    assert.equal(detailResponse.status, 401);
    assert.equal(screenshotResponse.status, 401);
  });
});
