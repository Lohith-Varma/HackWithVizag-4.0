import Event from "../models/event.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

// Helper to ensure an active event exists in DB
export const ensureActiveEvent = async () => {
  let activeEvent = await Event.findOne({ activeEvent: true });
  if (!activeEvent) {
    activeEvent = await Event.findOne().sort({ createdAt: -1 });
    if (activeEvent) {
      activeEvent.activeEvent = true;
      await activeEvent.save();
    } else {
      activeEvent = await Event.create({
        eventName: "Hack With Vizag 4.0",
        eventYear: "2026",
        activeEvent: true,
        eventStatus: "Published",
      });
    }
  }
  return activeEvent;
};

export const getActiveEvent = asyncHandler(async (_req, res) => {
  const event = await ensureActiveEvent();
  return sendSuccess(res, 200, "Active event configuration fetched successfully", { event });
});

export const getAdminEvents = asyncHandler(async (_req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  return sendSuccess(res, 200, "All events fetched successfully", { events });
});

export const createEvent = asyncHandler(async (req, res) => {
  if (req.body.activeEvent) {
    await Event.updateMany({}, { activeEvent: false });
  }

  const event = await Event.create(req.body);
  return sendSuccess(res, 201, "Event created successfully", { event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  if (req.body.activeEvent) {
    await Event.updateMany({ _id: { $ne: req.params.id } }, { activeEvent: false });
  }

  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return sendSuccess(res, 200, "Event updated successfully", { event });
});

export const setActiveEvent = asyncHandler(async (req, res) => {
  await Event.updateMany({}, { activeEvent: false });
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { activeEvent: true },
    { new: true, runValidators: true }
  );

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return sendSuccess(res, 200, "Event activated successfully", { event });
});
