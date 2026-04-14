const mongoose = require("mongoose");

const testDriveSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      required: true,
      maxlength: 140,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

testDriveSchema.index({ buyer: 1, scheduledFor: 1 });
testDriveSchema.index({ seller: 1, scheduledFor: 1 });
testDriveSchema.index({ car: 1, scheduledFor: 1 });

module.exports = mongoose.model("TestDrive", testDriveSchema);
