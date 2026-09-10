import assert from "node:assert/strict";
import test from "node:test";
import { buildStoragePath, downloadStoredFile } from "../src/services/storage.service.js";
import { uploadPpt, validateUploadedFile } from "../src/middleware/upload.middleware.js";
import { sendFileBuffer } from "../src/utils/fileResponse.js";
import Project from "../src/modules/projects/models/project.model.js";
import OfflineRegistration from "../src/modules/offlineRegistration/models/offlineRegistration.model.js";
import User from "../src/modules/auth/models/user.model.js";

const ownerId = "64b64c88e5f9d68f5d5b1234";

test("Multer uses memory storage instead of filesystem storage", () => {
  assert.equal(uploadPpt.storage?.constructor?.name, "MemoryStorage");
});

test("storage paths are owner-scoped, unique, and sanitized", () => {
  const first = buildStoragePath({
    folder: "ppt",
    ownerId,
    originalName: "../../My Project (Final).PPTX",
  });
  const second = buildStoragePath({
    folder: "ppt",
    ownerId,
    originalName: "../../My Project (Final).PPTX",
  });

  assert.match(first.storagePath, new RegExp(`^ppt/${ownerId}/[a-z0-9.-]+-my-project-final\\.pptx$`));
  assert.notEqual(first.storagePath, second.storagePath);
  assert.equal(first.storagePath.includes(".."), false);
});

test("storage paths reject untrusted folder and owner input", () => {
  assert.throws(
    () => buildStoragePath({ folder: "../ppt", ownerId, originalName: "deck.pptx" }),
    /Invalid storage folder/
  );
  assert.throws(
    () => buildStoragePath({ folder: "ppt", ownerId: "../../team", originalName: "deck.pptx" }),
    /Invalid storage owner id/
  );
});

test("server validation requires matching extension, MIME type, buffer, and size", () => {
  const validPptx = {
    originalname: "deck.pptx",
    mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 4,
    buffer: Buffer.from("test"),
  };
  assert.equal(validateUploadedFile(validPptx, { kind: "ppt", maxBytes: 4 }), validPptx);
  assert.throws(
    () => validateUploadedFile({ ...validPptx, mimetype: "image/png" }, { kind: "ppt", maxBytes: 4 }),
    /does not match/
  );
  assert.throws(
    () => validateUploadedFile({ ...validPptx, size: 5 }, { kind: "ppt", maxBytes: 4 }),
    /upload limit/
  );
});

test("binary responses use the correct PPTX MIME type and safe attachment name", () => {
  const headers = new Map();
  const response = {
    setHeader(name, value) { headers.set(name.toLowerCase(), String(value)); },
    send(value) { this.body = value; return this; },
  };
  const buffer = Buffer.from("pptx-binary");

  sendFileBuffer(response, {
    buffer,
    file: { originalName: "project\r\nmalicious.pptx" },
    disposition: "attachment",
  });

  assert.equal(headers.get("content-type"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  assert.match(headers.get("content-disposition"), /^attachment;/);
  assert.equal(headers.get("content-disposition").includes("\r"), false);
  assert.equal(headers.get("content-disposition").includes("\n"), false);
  assert.deepEqual(response.body, buffer);
});

test("new storage metadata is backward-compatible with existing models", () => {
  const metadata = {
    storageProvider: "supabase",
    bucket: "hackwithvizag-uploads",
    storagePath: `ppt/${ownerId}/deck.pptx`,
    url: `/api/projects/team/${ownerId}/documents/ppt`,
    path: `ppt/${ownerId}/deck.pptx`,
    originalName: "deck.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 123,
  };

  const project = new Project({ pptFile: metadata });
  assert.equal(project.pptFile.storagePath, metadata.storagePath);
  assert.equal(project.pptFile.url, metadata.url);

  const registration = new OfflineRegistration({ paymentScreenshot: { ...metadata, filename: "proof.png" } });
  assert.equal(registration.paymentScreenshot.storageProvider, "supabase");

  const user = new User({ profilePhotoFile: { ...metadata, filename: "photo.png" } });
  assert.equal(user.profilePhotoFile.storagePath, metadata.storagePath);
});

test("Supabase metadata without a storage path never falls back to the local filesystem", async () => {
  await assert.rejects(
    downloadStoredFile(
      {
        storageProvider: "supabase",
        url: "/api/projects/team/64b64c88e5f9d68f5d5b1234/documents/ppt",
      },
      { legacyFolder: "ppt" }
    ),
    /Stored file metadata is incomplete/
  );
});
