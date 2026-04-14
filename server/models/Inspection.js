const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // AI-generated fields
    conditionScore: { type: Number, min: 0, max: 10 },
    aiSummary: { type: String },
    issues: [
      {
        category: String, // engine, body, interior, electrical
        severity: { type: String, enum: ["minor", "moderate", "major"] },
        description: String,
      },
    ],
    strengths: [{ type: String }],
    estimatedValue: { type: Number }, // AI-estimated fair market price
    // Manual input from seller
    sellerNotes: { type: String, maxlength: 1000 },
    vin: { type: String, trim: true },
    // History
    accidentHistory: { type: Boolean, default: false },
    serviceHistory: { type: Boolean, default: false },
    numberOfOwners: { type: Number, default: 1 },
    // Report status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    certified: { type: Boolean, default: false },
    images: [{ type: String }], // inspection photo URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inspection", inspectionSchema);
