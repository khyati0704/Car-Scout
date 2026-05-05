const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1980, max: new Date().getFullYear() + 1 },
    price: { type: Number, required: true, min: 0 },
    mileage: { type: Number, required: true, min: 0 },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "electric", "hybrid", "cng"],
      required: true,
    },
    transmission: {
      type: String,
      enum: ["manual", "automatic", "cvt", "amt"],
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "like-new", "good", "fair", "poor"],
      required: true,
    },
    bodyType: {
      type: String,
      enum: ["sedan", "suv", "hatchback", "coupe", "convertible", "pickup", "van", "wagon"],
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: (value) => !value || /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/.test(value),
        message: "Invalid registration number format",
      },
    },
    color: { type: String, trim: true },
    description: { type: String, maxlength: 2000 },
    images: [{ type: String }], // Cloudinary URLs
    features: [{ type: String }], // e.g. ["sunroof", "leather seats", "360 camera"]
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    available: { type: Boolean, default: true },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    soldAt: { type: Date, default: null },
    soldPrice: { type: Number, default: null, min: 0 },
    views: { type: Number, default: 0 },
    aiScore: { type: Number, min: 0, max: 10 }, // from AI inspection
    negotiable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for search
carSchema.index({ make: "text", model: "text", description: "text", city: "text" });

// Compound indexes for filters
carSchema.index({ make: 1, model: 1 });
carSchema.index({ price: 1 });
carSchema.index({ year: -1 });
carSchema.index({ available: 1, createdAt: -1 });

module.exports = mongoose.model("Car", carSchema);
