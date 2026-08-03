import ProblemStatement from "../models/problemStatement.model.js";
import { ensureActiveEvent } from "../../events/controllers/event.controller.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

const DEFAULT_PROBLEM_STATEMENTS = [
  {
    code: "HWV-01",
    title: "AI-Powered Traffic & Crowd Management for Smart Coastal Cities",
    theme: "AI & Smart Infrastructure",
    problemStatement:
      "Urban congestion around tourist spots and port corridors causes severe safety delays and carbon emissions.",
    objectives: [
      "Real-time video feed analysis for traffic congestion detection",
      "Dynamic signal timing adjustments based on density",
      "Emergency vehicle priority routing corridor",
    ],
    onlineRoundRequirements:
      "Architecture diagram, live video processing prototype/simulation, and technical PPT.",
    type: "official",
    displayOrder: 1,
    activeStatus: true,
  },
  {
    code: "HWV-02",
    title: "Ocean Plastics & Coastal Pollution Tracking Dashboard",
    theme: "Sustainability & Marine Tech",
    problemStatement:
      "Monitoring marine litter along the Bay of Bengal coastline is manual, fragmented, and reactive.",
    objectives: [
      "GIS heatmapping of marine debris hotspots using community reports and satellite feeds",
      "Automated image recognition for waste categorization",
      "Predictive drift modeling for cleanup resource deployment",
    ],
    onlineRoundRequirements:
      "Working web/mobile prototype, data schema, and 10-slide presentation.",
    type: "official",
    displayOrder: 2,
    activeStatus: true,
  },
  {
    code: "HWV-03",
    title: "Blockchain-Based Fisherman Safety & Maritime Boundary Alert System",
    theme: "Cybersecurity & IoT",
    problemStatement:
      "Deep-sea fishermen inadvertently cross maritime borders or suffer SOS signal delays during adverse weather.",
    objectives: [
      "Offline-first mobile mesh networking or GPS geofencing trigger",
      "Immutable SOS logs with GPS coordinates dispatched to coastal guard nodes",
      "Weather vulnerability warning broadcast dashboard",
    ],
    onlineRoundRequirements:
      "Hardware simulation/mobile app demo, security protocol design document.",
    type: "official",
    displayOrder: 3,
    activeStatus: true,
  },
  {
    code: "HWV-04",
    title: "Smart Port Logistics & Autonomous Container Tracking",
    theme: "Logistics & Automation",
    problemStatement:
      "Container handling delays at coastal cargo terminals lead to port congestion and lost demurrage revenue.",
    objectives: [
      "Automated container OCR scanning and slot optimization",
      "Predictive turnaround time analytics using machine learning",
      "Digital twin dashboard for terminal crane dispatch",
    ],
    onlineRoundRequirements:
      "Simulated dataset analysis, API endpoints documentation, working dashboard UI.",
    type: "official",
    displayOrder: 4,
    activeStatus: true,
  },
  {
    code: "HWV-OPEN",
    title: "Open Innovation Track",
    theme: "Open Innovation",
    problemStatement:
      "Propose your own ground-breaking solution across FinTech, HealthTech, EdTech, AgriTech, or any domain to solve pressing societal challenges.",
    objectives: [
      "Demonstrate novel technological innovation or product architecture",
      "Clear problem definition, market viability, and scalable execution plan",
    ],
    onlineRoundRequirements:
      "Detailed custom problem statement, working prototype code, and submission deck.",
    type: "open",
    displayOrder: 99,
    activeStatus: true,
  },
];

export const ensureSeedProblemStatements = async (eventId) => {
  const count = await ProblemStatement.countDocuments();
  if (count === 0) {
    const records = DEFAULT_PROBLEM_STATEMENTS.map((item) => ({
      ...item,
      eventId,
    }));
    await ProblemStatement.insertMany(records);
  }
};

export const getPublicProblemStatements = asyncHandler(async (_req, res) => {
  const activeEvent = await ensureActiveEvent();
  await ensureSeedProblemStatements(activeEvent._id);

  const problemStatements = await ProblemStatement.find({
    activeStatus: true,
  }).sort({ displayOrder: 1, createdAt: 1 });

  return sendSuccess(res, 200, "Active problem statements fetched successfully", {
    problemStatements,
  });
});

export const getAdminProblemStatements = asyncHandler(async (_req, res) => {
  const activeEvent = await ensureActiveEvent();
  await ensureSeedProblemStatements(activeEvent._id);

  const problemStatements = await ProblemStatement.find().sort({ displayOrder: 1, createdAt: 1 });
  return sendSuccess(res, 200, "All problem statements fetched successfully", {
    problemStatements,
  });
});

export const createProblemStatement = asyncHandler(async (req, res) => {
  const activeEvent = await ensureActiveEvent();
  const objectives = Array.isArray(req.body.objectives)
    ? req.body.objectives
    : String(req.body.objectives || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

  const ps = await ProblemStatement.create({
    ...req.body,
    objectives,
    eventId: activeEvent._id,
  });

  return sendSuccess(res, 201, "Problem statement created successfully", { problemStatement: ps });
});

export const updateProblemStatement = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.objectives && typeof updateData.objectives === "string") {
    updateData.objectives = updateData.objectives
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const ps = await ProblemStatement.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!ps) {
    throw new ApiError(404, "Problem statement not found");
  }

  return sendSuccess(res, 200, "Problem statement updated successfully", { problemStatement: ps });
});

export const deleteProblemStatement = asyncHandler(async (req, res) => {
  const ps = await ProblemStatement.findByIdAndDelete(req.params.id);
  if (!ps) {
    throw new ApiError(404, "Problem statement not found");
  }
  return sendSuccess(res, 200, "Problem statement deleted successfully");
});

export const reorderProblemStatements = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { id, displayOrder }
  if (!Array.isArray(items)) {
    throw new ApiError(400, "Invalid reorder payload");
  }

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { displayOrder: item.displayOrder },
    },
  }));

  if (bulkOps.length > 0) {
    await ProblemStatement.bulkWrite(bulkOps);
  }

  const problemStatements = await ProblemStatement.find().sort({ displayOrder: 1 });
  return sendSuccess(res, 200, "Problem statements reordered successfully", { problemStatements });
});
