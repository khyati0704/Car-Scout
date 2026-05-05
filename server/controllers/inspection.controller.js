const Inspection = require("../models/Inspection");
const Car = require("../models/Car");
const { generateInspectionReport, generatePriceHint } = require("../services/inspectionAi");

// @route  POST /api/inspections
// @access Private
const requestInspection = async (req, res) => {
  try {
    const { carId, sellerNotes, vin, accidentHistory, serviceHistory, numberOfOwners } = req.body;

    const car = await Car.findById(carId).populate("seller", "name");
    if (!car) return res.status(404).json({ error: "Car not found." });

    const existing = await Inspection.findOne({
      car: carId,
      status: { $in: ["pending", "processing", "completed"] },
    });
    if (existing) return res.status(400).json({ error: "Inspection already exists for this car.", inspection: existing });

    const images = req.files ? req.files.map((f) => f.path) : [];

    const toBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

    const inspection = await Inspection.create({
      car: carId,
      requestedBy: req.user._id,
      sellerNotes,
      vin,
      accidentHistory: toBoolean(accidentHistory),
      serviceHistory: toBoolean(serviceHistory),
      numberOfOwners: Number(numberOfOwners) || 1,
      images,
      status: "processing",
    });

    const report = await generateInspectionReport(car, inspection, sellerNotes);
    inspection.conditionScore = report.conditionScore;
    inspection.aiSummary = report.aiSummary;
    inspection.issues = report.issues;
    inspection.strengths = report.strengths;
    inspection.estimatedValue = report.estimatedValue;
    inspection.status = "completed";
    inspection.certified = report.certified;
    await inspection.save();

    await Car.findByIdAndUpdate(carId, { aiScore: report.conditionScore });

    res.status(201).json({ inspection, message: "Inspection completed and report generated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to start inspection." });
  }
};

// @route  GET /api/inspections/car/:carId
// @access Public
const getInspectionByCar = async (req, res) => {
  try {
    const inspection = await Inspection.findOne({ car: req.params.carId })
      .sort({ createdAt: -1 })
      .populate("car", "make model year")
      .populate("requestedBy", "name");

    if (!inspection) return res.status(404).json({ error: "No inspection report found." });
    res.json({ inspection });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inspection." });
  }
};

// @route  POST /api/inspections/price-hint
// @access Public
const getPriceHint = async (req, res) => {
  try {
    const hint = await generatePriceHint(req.body || {});
    res.json(hint);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate price hint." });
  }
};

// @route  GET /api/inspections/:id
// @access Private
const getInspectionById = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("car", "make model year price images")
      .populate("requestedBy", "name");
    if (!inspection) return res.status(404).json({ error: "Inspection not found." });
    res.json({ inspection });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inspection." });
  }
};

module.exports = { requestInspection, getInspectionByCar, getInspectionById, getPriceHint };
