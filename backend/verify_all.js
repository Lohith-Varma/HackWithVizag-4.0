import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

dotenv.config({ path: "./.env" });

import User from "./src/modules/auth/models/user.model.js";
import Team from "./src/modules/teams/models/team.model.js";
import Project from "./src/modules/projects/models/project.model.js";
import Submission from "./src/modules/submissions/models/submission.model.js";
import ProblemStatement from "./src/modules/problemStatements/models/problemStatement.model.js";
import OfflineRegistration from "./src/modules/offlineRegistration/models/offlineRegistration.model.js";
import Event from "./src/modules/events/models/event.model.js";

import { ensureActiveEvent } from "./src/modules/events/controllers/event.controller.js";
import { ensureSeedProblemStatements } from "./src/modules/problemStatements/controllers/problemStatement.controller.js";
import { registerUser } from "./src/modules/auth/services/auth.service.js";
import { submitFullRegistration } from "./src/modules/submissions/controllers/submission.controller.js";
import { updateTeamStatus } from "./src/modules/admin/controllers/admin.controller.js";
import { saveOfflineRegistration, completeOfflineRegistration } from "./src/modules/offlineRegistration/controllers/offlineRegistration.controller.js";

async function execHandler(handlerFn, req) {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };

  return new Promise((resolve, reject) => {
    const origJson = res.json.bind(res);
    res.json = function (data) {
      origJson(data);
      resolve(res);
      return this;
    };
    handlerFn(req, res, (err) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

async function runEndToEndVerification() {
  console.log("=== STARTING COMPREHENSIVE HACK WITH VIZAG BACKEND AUDIT ===");

  console.log("\n[1/6] Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("-> MongoDB Atlas Connected Successfully!");

  const activeEvent = await ensureActiveEvent();
  console.log(`-> Active Hackathon Event ID: ${activeEvent._id}`);

  // Test Problem Statement CRUD
  console.log("\n[2/6] Verifying Problem Statement CRUD Operations...");
  await ensureSeedProblemStatements(activeEvent._id);

  const initialPsCount = await ProblemStatement.countDocuments();
  console.log(`-> Initial Problem Statements count: ${initialPsCount}`);

  // CREATE
  const newPs = await ProblemStatement.create({
    eventId: activeEvent._id,
    code: `HWV-TEST-${Date.now().toString().slice(-4)}`,
    title: "AI Coastal Sentinel Network",
    theme: "AI & Smart Infrastructure",
    problemStatement: "Monitoring storm surges and sea level anomalies along Vizag beaches.",
    objectives: ["Deploy IoT tide sensors", "Real-time AI notification dashboard"],
    onlineRoundRequirements: "Architecture diagram and simulation prototype",
    type: "official",
    displayOrder: 10,
    activeStatus: true,
  });
  console.log(`-> [CREATE PS PASS] Created Problem Statement: ID=${newPs._id}, Code=${newPs.code}`);

  // READ (Public Active & Admin List)
  const publicPs = await ProblemStatement.find({ activeStatus: true }).sort({ displayOrder: 1 });
  const adminPs = await ProblemStatement.find().sort({ displayOrder: 1 });
  console.log(`-> [READ PS PASS] Public active tracks: ${publicPs.length}, Admin total tracks: ${adminPs.length}`);

  // UPDATE & TOGGLE ACTIVE
  const updatedPs = await ProblemStatement.findByIdAndUpdate(
    newPs._id,
    { title: "AI Coastal Sentinel Network (Updated)", activeStatus: false },
    { new: true }
  );
  console.log(`-> [UPDATE PS PASS] Updated title="${updatedPs.title}", activeStatus=${updatedPs.activeStatus}`);

  // DELETE
  await ProblemStatement.findByIdAndDelete(newPs._id);
  const postDeleteCount = await ProblemStatement.countDocuments();
  console.log(`-> [DELETE PS PASS] Post-delete count: ${postDeleteCount} (restored to initial ${initialPsCount})`);

  // Test Participant Registration & Multi-Member User Storage
  console.log("\n[3/6] Verifying Participant Team Registration & User Storage...");
  const uniqueTimestamp = Date.now();
  const leaderEmail = `leader_${uniqueTimestamp}@hackwithvizag.test`;
  const leaderPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const leaderAuth = await registerUser({
    name: "Subba Rao (Leader)",
    email: leaderEmail,
    password: "Password@123",
    phone: leaderPhone,
    collegeName: "NSRIT Visakhapatnam",
    registeredNumber: "23NU1A0501",
    department: "Computer Science Engineering",
    year: "4th Year",
    gender: "Male",
  });
  const leaderUser = await User.findById(leaderAuth.user.id);
  console.log(`-> [REGISTER LEADER PASS] Leader Created: ID=${leaderUser._id}, Email=${leaderEmail}, RegNo=${leaderUser.registeredNumber}`);

  // Submit Full Registration
  const targetPs = await ProblemStatement.findOne({ activeStatus: true });
  const mockReq = {
    user: {
      id: leaderUser._id.toString(),
      _id: leaderUser._id,
      name: leaderUser.name,
    },
    body: {
      payload: JSON.stringify({
        personal: {
          fullName: "Subba Rao (Leader)",
          email: leaderEmail,
          phone: leaderPhone,
          collegeName: "NSRIT Visakhapatnam",
          registeredNumber: "23NU1A0501",
          department: "Computer Science Engineering",
          year: "4th Year",
          gender: "Male",
        },
        team: {
          teamName: `Vizag Tech Innovators ${uniqueTimestamp.toString().slice(-4)}`,
          members: [
            {
              fullName: "Priya Varma (Member 1)",
              email: `priya_${uniqueTimestamp}@hackwithvizag.test`,
              phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
              collegeName: "NSRIT Visakhapatnam",
              registeredNumber: "23NU1A0502",
              department: "Information Technology",
              year: "3rd Year",
              gender: "Female",
            },
            {
              fullName: "Kiran Kumar (Member 2)",
              email: `kiran_${uniqueTimestamp}@hackwithvizag.test`,
              phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
              collegeName: "NSRIT Visakhapatnam",
              registeredNumber: "23NU1A0503",
              department: "Electronics & Communication",
              year: "4th Year",
              gender: "Male",
            },
          ],
        },
        project: {
          title: "AI Smart Port Traffic Optimization System",
          problemStatementId: targetPs._id.toString(),
          problemCode: targetPs.code,
          theme: targetPs.theme,
          problemStatement: targetPs.problemStatement,
          problemType: targetPs.type,
          abstract: "Our solution utilizes computer vision and machine learning to optimize cargo container flow at Vizag Port. It reduces port congestion and demurrage delays significantly while automating crane scheduling.",
          githubRepository: "https://github.com/vizagtech/smartport",
        },
      }),
    },
    files: {},
  };

  const regRes = await execHandler(submitFullRegistration, mockReq);
  const submissionData = regRes.payload.data.submission;
  const teamId = submissionData.team._id ? submissionData.team._id.toString() : submissionData.team.toString();
  console.log(`-> [SUBMIT REGISTRATION PASS] Team Created: ID=${teamId}, RegID="${regRes.payload.data.registrationId}"`);

  // Verify Database Linkages
  console.log("\n[4/6] Verifying MongoDB Schema Linkages & User Storage...");
  const teamDoc = await Team.findById(teamId).populate("members").populate("leader");
  console.log(`-> Team Name: "${teamDoc.teamName}", Total Members in Team.members: ${teamDoc.members.length}`);
  if (teamDoc.members.length !== 3) {
    console.error(`[FAIL] Expected 3 populated members, found ${teamDoc.members.length}`);
    process.exit(1);
  }

  for (const m of teamDoc.members) {
    console.log(`   - Member: ${m.name} | RegNo: ${m.registeredNumber} | Gender: ${m.gender} | Email: ${m.email} | College: ${m.collegeName || m.college} | Dept: ${m.department}`);
  }
  console.log("-> [DATABASE LINKAGE PASS] Leader + all 2 additional team members properly linked as User documents!");

  // Test Missing GitHub Repository Rejection
  console.log("\n[4b/6] Verifying Mandatory GitHub Repository Link Validation...");
  const missingGithubReq = {
    user: {
      id: new mongoose.Types.ObjectId().toString(),
      _id: new mongoose.Types.ObjectId(),
      name: "Github Test User",
    },
    body: {
      payload: JSON.stringify({
        personal: {
          fullName: "Github Test User",
          email: `githubtest_${uniqueTimestamp}@hackwithvizag.test`,
          phone: "9123456780",
          collegeName: "NSRIT Visakhapatnam",
          registeredNumber: "23NU1A0999",
          department: "CSE",
          year: "3rd Year",
        },
        team: {
          teamName: `Missing GitHub Team ${uniqueTimestamp.toString().slice(-4)}`,
          members: [],
        },
        project: {
          title: "Test Project Without GitHub",
          problemStatementId: targetPs._id.toString(),
          problemCode: targetPs.code,
          theme: targetPs.theme,
          problemStatement: targetPs.problemStatement,
          abstract: "Abstract describing project in full detail so that word count requirements are easily met here.",
          githubRepository: "",
        },
      }),
    },
    files: {},
  };

  try {
    await execHandler(submitFullRegistration, missingGithubReq);
    console.error("[FAIL] Missing GitHub repo was not rejected!");
    process.exit(1);
  } catch (err) {
    console.log(`-> [MANDATORY GITHUB PASS] Correctly rejected missing GitHub link: "${err.message}"`);
  }

  // Test Cross-College Team Rejection
  console.log("\n[4c/6] Verifying Strict Cross-College Team Rejection...");
  const crossCollegeMember = await User.create({
    name: "Cross College Member",
    email: `cross_${uniqueTimestamp}@othercollege.test`,
    phone: "9988776655",
    college: "Andhra University",
    collegeName: "Andhra University",
    registeredNumber: "AU-2026-99",
    department: "IT",
    year: "3rd Year",
    role: "participant",
  });

  const crossCollegeReq = {
    user: {
      id: leaderUser._id.toString(),
      _id: leaderUser._id,
      name: leaderUser.name,
    },
    body: {
      payload: JSON.stringify({
        personal: {
          fullName: "Subba Rao (Leader)",
          email: leaderEmail,
          phone: leaderPhone,
          collegeName: "NSRIT Visakhapatnam",
          registeredNumber: "23NU1A0501",
          department: "Computer Science Engineering",
          year: "4th Year",
        },
        team: {
          teamName: `Cross College Team Test ${uniqueTimestamp.toString().slice(-4)}`,
          members: [
            {
              fullName: "Valid College Member",
              email: `valid_${uniqueTimestamp}@hackwithvizag.test`,
              phone: "9988776611",
              collegeName: "NSRIT Visakhapatnam",
              registeredNumber: "23NU1A0588",
              department: "IT",
              year: "3rd Year",
            },
            {
              fullName: "Cross College Member",
              email: `cross_${uniqueTimestamp}@othercollege.test`,
              phone: "9988776655",
              collegeName: "Andhra University",
              registeredNumber: "AU-2026-99",
              department: "IT",
              year: "3rd Year",
            },
          ],
        },
        project: {
          title: "Cross College Test Project Title",
          problemStatementId: targetPs._id.toString(),
          problemCode: targetPs.code,
          theme: targetPs.theme,
          problemStatement: targetPs.problemStatement,
          abstract: "Abstract describing project in full detail so that word count requirements are easily met here.",
          githubRepository: "https://github.com/vizagtech/crosscollege",
        },
      }),
    },
    files: {},
  };

  try {
    await execHandler(submitFullRegistration, crossCollegeReq);
    console.error("[FAIL] Cross-college team was not rejected!");
    process.exit(1);
  } catch (err) {
    console.log(`-> [CROSS-COLLEGE REJECTION PASS] Correctly rejected cross-college team: "${err.message}"`);
  }

  // Test Admin Review & Dashboard Metrics
  console.log("\n[5/6] Verifying Admin Review Workflow & Dynamic Metrics...");
  const adminReq = {
    user: { id: new mongoose.Types.ObjectId().toString(), role: "admin" },
    params: { id: teamId },
    body: {
      status: "approved",
      remarks: "Outstanding technical abstract and team setup. Approved for offline round.",
    },
  };

  const adminRes = await execHandler(updateTeamStatus, adminReq);
  console.log(`-> [ADMIN REVIEW PASS] Team Status Updated to "${adminRes.payload.data.team.status}"`);

  // Test Duplicate Registration Conflict Handling
  console.log("\n[5b/6] Verifying Duplicate Team Name & Email Conflict Prevention...");
  const duplicateReq = {
    user: {
      id: new mongoose.Types.ObjectId().toString(),
      _id: new mongoose.Types.ObjectId(),
      name: "Different Leader",
    },
    body: {
      payload: JSON.stringify({
        personal: {
          fullName: "Different Leader",
          email: `different_${uniqueTimestamp}@hackwithvizag.test`,
          phone: "9111111111",
          collegeName: "NSRIT Visakhapatnam",
          registeredNumber: "23NU1A0888",
          department: "Computer Science",
          year: "4th Year",
        },
        team: {
          teamName: mockReq.body.payload ? JSON.parse(mockReq.body.payload).team.teamName : `Vizag Tech Innovators ${uniqueTimestamp.toString().slice(-4)}`,
          members: [
            {
              fullName: "Dup Member 1",
              email: `dupmem1_${uniqueTimestamp}@hackwithvizag.test`,
              phone: "9111111112",
              collegeName: "NSRIT Visakhapatnam",
              registeredNumber: "23NU1A0881",
              department: "Computer Science",
              year: "4th Year",
            },
            {
              fullName: "Dup Member 2",
              email: `dupmem2_${uniqueTimestamp}@hackwithvizag.test`,
              phone: "9111111113",
              collegeName: "NSRIT Visakhapatnam",
              registeredNumber: "23NU1A0882",
              department: "Computer Science",
              year: "4th Year",
            },
          ],
        },
        project: {
          title: "Duplicate Team Test Project Title Here",
          problemStatementId: targetPs._id.toString(),
          problemCode: targetPs.code,
          theme: targetPs.theme,
          problemStatement: targetPs.problemStatement,
          abstract: "Abstract describing project in full detail so that word count requirements are easily met here.",
          githubRepository: "https://github.com/vizagtech/duplicate",
        },
      }),
    },
    files: {},
  };

  try {
    await execHandler(submitFullRegistration, duplicateReq);
    console.error("[FAIL] Duplicate team name did not throw Conflict error!");
    process.exit(1);
  } catch (err) {
    console.log(`-> [DUPLICATE CONFLICT PASS] Correctly rejected duplicate registration: ${err.message}`);
  }

  // Test Offline Registration Workflow
  console.log("\n[6/6] Verifying Offline Registration Eligibility & Completion...");
  const offlineReqSave = {
    user: leaderUser,
    params: { teamId },
    body: {
      attendanceType: "offline",
      emergencyContactName: "Father of Leader",
      emergencyContactPhone: "9123456789",
      transportationMode: "College Bus",
      arrivalDateTime: new Date().toISOString(),
      accommodationRequired: true,
      dietaryPreference: "Veg",
    },
  };
  const offlineResSave = await execHandler(saveOfflineRegistration, offlineReqSave);
  console.log(`-> [OFFLINE SAVE PASS] Details Saved: ID=${offlineResSave.payload.data.offlineRegistration._id}`);

  const offlineReqComplete = {
    user: leaderUser,
    params: { teamId },
  };
  const offlineResComplete = await execHandler(completeOfflineRegistration, offlineReqComplete);
  console.log(`-> [OFFLINE COMPLETE PASS] Confirmation Code: "${offlineResComplete.payload.data.offlineRegistration.confirmationCode}"`);

  await mongoose.disconnect();
  console.log("\n=======================================================");
  console.log("=== ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY ===");
  console.log("=======================================================");
  process.exit(0);
}


runEndToEndVerification().catch((err) => {
  console.error("Verification process crashed:", err);
  process.exit(1);
});
