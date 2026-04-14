const Inspection = require("../models/Inspection");
const Car = require("../models/Car");


// @route  POST /api/inspections
// @access Private
const requestInspection = async (req, res) => {
  try {
    const { carId, sellerNotes, vin, accidentHistory, serviceHistory, numberOfOwners } = req.body;

    const car = await Car.findById(carId).populate("seller", "name");
    if (!car) return res.status(404).json({ error: "Car not found." });

    // Check existing
    const existing = await Inspection.findOne({ car: carId, status: { $in: ["pending", "processing", "completed"] } });
    if (existing) return res.status(400).json({ error: "Inspection already exists for this car.", inspection: existing });

    const images = req.files ? req.files.map((f) => f.path) : [];

    const inspection = await Inspection.create({
      car: carId,
      requestedBy: req.user._id,
      sellerNotes,
      vin,
      accidentHistory: accidentHistory === "true",
      serviceHistory: serviceHistory === "true",
      numberOfOwners: Number(numberOfOwners) || 1,
      images,
      status: "processing",
    });

    // Run AI analysis asynchronously
    generateInspectionReport(car, inspection, sellerNotes)
      .then(async (report) => {
        inspection.conditionScore = report.conditionScore;
        inspection.aiSummary = report.summary;
        inspection.issues = report.issues;
        inspection.strengths = report.strengths;
        inspection.estimatedValue = report.estimatedValue;
        inspection.status = "completed";
        await inspection.save();

        // Update car's AI score
        await Car.findByIdAndUpdate(carId, { aiScore: report.conditionScore });
      })
      .catch(async (err) => {
        console.error("AI inspection failed:", err.message);
        inspection.status = "failed";
        await inspection.save();
      });

    res.status(201).json({ inspection, message: "Inspection started. Report will be ready shortly." });
  } catch (err) {
    res.status(500).json({ error: "Failed to start inspection." });
  }
};

// @route  GET /api/inspections/car/:carId
// @access Public
const getInspectionByCar = async (req, res) => {
  try {
    const inspection = await Inspection.findOne({
      car: req.params.carId,
      status: "completed",
    }).populate("car", "make model year").populate("requestedBy", "name");

    if (!inspection) return res.status(404).json({ error: "No inspection report found." });
    res.json({ inspection });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inspection." });
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

module.exports = { requestInspection, getInspectionByCar, getInspectionById };
