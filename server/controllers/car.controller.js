const Car = require("../models/Car");
const { cloudinary } = require("../config/cloudinary");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @route  GET /api/cars
// @access Public
const getCars = async (req, res) => {
  try {
    const {
      search, make, model, minPrice, maxPrice, minYear, maxYear,
      fuelType, transmission, condition, bodyType, city,
      sortBy = "createdAt", order = "desc", page = 1, limit = 12,
    } = req.query;

    const query = { available: true };

    if (search?.trim()) {
      const searchTerms = search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((term) => new RegExp(escapeRegex(term), "i"));

      query.$and = searchTerms.map((term) => ({
        $or: [
          { make: term },
          { model: term },
          { description: term },
          { city: term },
          { state: term },
          { bodyType: term },
          { color: term },
          { fuelType: term },
          { transmission: term },
          { features: term },
        ],
      }));
    }

    // Filters
    if (make) query.make = new RegExp(make, "i");
    if (model) query.model = new RegExp(model, "i");
    if (fuelType) query.fuelType = fuelType;
    if (transmission) query.transmission = transmission;
    if (condition) query.condition = condition;
    if (bodyType) query.bodyType = bodyType;
    if (city) query.city = new RegExp(city, "i");
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minYear || maxYear) {
      query.year = {};
      if (minYear) query.year.$gte = Number(minYear);
      if (maxYear) query.year.$lte = Number(maxYear);
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const validSorts = ["price", "year", "mileage", "createdAt", "views", "aiScore"];
    const sortField = validSorts.includes(sortBy) ? sortBy : "createdAt";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Car.countDocuments(query);
    const cars = await Car.find(query)
      .populate("seller", "name avatar city isVerified")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      cars,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cars." });
  }
};

// @route  GET /api/cars/:id
// @access Public
const getCarById = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("seller", "name avatar city phone isVerified createdAt");

    if (!car) return res.status(404).json({ error: "Car not found." });
    res.json({ car });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch car." });
  }
};

// @route  POST /api/cars
// @access Private (sellers)
const createCar = async (req, res) => {
 
  try {
     console.log("BODY:", req.body);
console.log("FILES:", req.files);
   const images = req.files && req.files.length > 0
  ? req.files.map((f) => f.path)
  : [];
    const carData = {
      ...req.body,
      seller: req.user._id,
      images,
      features: req.body.features ? JSON.parse(req.body.features) : [],
      price: Number(req.body.price),
      mileage: Number(req.body.mileage),
      year: Number(req.body.year),
    };

    const car = await Car.create(carData);
    await car.populate("seller", "name avatar city");
    res.status(201).json({ car });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(". ") });
    }
    res.status(500).json({ error: "Failed to create listing." });
  }
};

// @route  PATCH /api/cars/:id
// @access Private (owner only)
const updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (car.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to edit this listing." });
    }

    // Handle new images
    if (req.files?.length > 0) {
      req.body.images = [...(car.images || []), ...req.files.map((f) => f.path)];
    }

    const updated = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("seller", "name avatar city");

    res.json({ car: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing." });
  }
};

// @route  DELETE /api/cars/:id
// @access Private (owner or admin)
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (car.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized." });
    }

    // Delete images from Cloudinary
    for (const url of car.images) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`car-scout/${publicId}`);
    }

    await car.deleteOne();
    res.json({ message: "Listing deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing." });
  }
};

// @route  GET /api/cars/my/listings
// @access Private (seller)
const getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ cars });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your listings." });
  }
};

module.exports = { getCars, getCarById, createCar, updateCar, deleteCar, getMyCars };
