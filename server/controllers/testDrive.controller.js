const Car = require("../models/Car");
const TestDrive = require("../models/TestDrive");
const { Conversation, Message } = require("../models/Message");

const populateConfig = [
  { path: "car", select: "make model year price images city state" },
  { path: "buyer", select: "name avatar city" },
  { path: "seller", select: "name avatar city" },
  { path: "conversation", select: "_id status lastMessage updatedAt" },
];

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getUserRoleForTestDrive = (testDrive, userId) => {
  if (testDrive.buyer.toString() === userId.toString()) return "buyer";
  if (testDrive.seller.toString() === userId.toString()) return "seller";
  return null;
};

const createConversationMessage = async ({ conversation, sender, content }) => {
  if (!conversation) return;

  await Message.create({
    conversation: conversation._id,
    sender,
    content,
    type: "test-drive",
  });

  conversation.lastMessage = content;
  if (conversation.buyer.toString() === sender.toString()) {
    conversation.unreadSeller += 1;
  } else {
    conversation.unreadBuyer += 1;
  }
  await conversation.save();
};

// @route POST /api/test-drives
// @access Private
const createTestDrive = async (req, res) => {
  try {
    const { carId, scheduledFor, location, notes = "" } = req.body;

    if (!carId || !scheduledFor || !location?.trim()) {
      return res.status(400).json({ error: "Car, schedule time, and location are required." });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (car.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot schedule a test drive for your own listing." });
    }

    const scheduleDate = new Date(scheduledFor);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ error: "Invalid test-drive date." });
    }
    if (scheduleDate < new Date()) {
      return res.status(400).json({ error: "Test-drive time must be in the future." });
    }

    let conversation = await Conversation.findOne({
      buyer: req.user._id,
      seller: car.seller,
      car: car._id,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        buyer: req.user._id,
        seller: car.seller,
        car: car._id,
      });
    }

    const testDrive = await TestDrive.create({
      car: car._id,
      buyer: req.user._id,
      seller: car.seller,
      conversation: conversation._id,
      scheduledFor: scheduleDate,
      location: location.trim(),
      notes: notes.trim(),
      statusUpdatedBy: req.user._id,
    });

    const scheduleMessage = `Test drive requested for ${formatDateTime(scheduleDate)} at ${location.trim()}.`;
    await createConversationMessage({
      conversation,
      sender: req.user._id,
      content: notes.trim() ? `${scheduleMessage} Notes: ${notes.trim()}` : scheduleMessage,
    });

    await testDrive.populate(populateConfig);
    res.status(201).json({ testDrive });
  } catch (err) {
    res.status(500).json({ error: "Failed to create test-drive request." });
  }
};

// @route GET /api/test-drives
// @access Private
const getMyTestDrives = async (req, res) => {
  try {
    const filter =
      req.user.role === "seller"
        ? { seller: req.user._id }
        : { $or: [{ buyer: req.user._id }, { seller: req.user._id }] };

    const testDrives = await TestDrive.find(filter)
      .populate(populateConfig)
      .sort({ scheduledFor: 1, createdAt: -1 });

    res.json({ testDrives });
  } catch (err) {
    res.status(500).json({ error: "Failed to load test drives." });
  }
};

// @route PATCH /api/test-drives/:id
// @access Private
const updateTestDriveStatus = async (req, res) => {
  try {
    const { status, scheduledFor, location, notes } = req.body;
    const testDrive = await TestDrive.findById(req.params.id);
    if (!testDrive) return res.status(404).json({ error: "Test drive not found." });

    const userRole = getUserRoleForTestDrive(testDrive, req.user._id);
    if (!userRole) return res.status(403).json({ error: "Not authorized to update this test drive." });

    const allowedStatusesByRole = {
      buyer: ["cancelled"],
      seller: ["confirmed", "completed", "cancelled"],
    };

    if (status) {
      if (!allowedStatusesByRole[userRole].includes(status)) {
        return res.status(403).json({ error: "That status change is not allowed." });
      }
      testDrive.status = status;
      testDrive.statusUpdatedBy = req.user._id;
    }

    if (scheduledFor) {
      if (userRole !== "seller") {
        return res.status(403).json({ error: "Only the seller can reschedule a test drive." });
      }
      const nextDate = new Date(scheduledFor);
      if (Number.isNaN(nextDate.getTime()) || nextDate < new Date()) {
        return res.status(400).json({ error: "Please choose a valid future date." });
      }
      testDrive.scheduledFor = nextDate;
    }

    if (typeof location === "string" && location.trim()) {
      if (userRole !== "seller") {
        return res.status(403).json({ error: "Only the seller can update the location." });
      }
      testDrive.location = location.trim();
    }

    if (typeof notes === "string") {
      testDrive.notes = notes.trim();
    }

    await testDrive.save();

    const conversation = testDrive.conversation
      ? await Conversation.findById(testDrive.conversation)
      : null;

    const updateParts = [];
    if (status) updateParts.push(`status changed to ${testDrive.status}`);
    if (scheduledFor) updateParts.push(`rescheduled to ${formatDateTime(testDrive.scheduledFor)}`);
    if (location?.trim()) updateParts.push(`location updated to ${testDrive.location}`);

    if (updateParts.length) {
      await createConversationMessage({
        conversation,
        sender: req.user._id,
        content: `Test drive update: ${updateParts.join(", ")}.`,
      });
    }

    await testDrive.populate(populateConfig);
    res.json({ testDrive });
  } catch (err) {
    res.status(500).json({ error: "Failed to update test drive." });
  }
};

module.exports = {
  createTestDrive,
  getMyTestDrives,
  updateTestDriveStatus,
};
