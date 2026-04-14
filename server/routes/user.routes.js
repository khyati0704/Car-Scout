const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const User = require("../models/User");
const Car = require("../models/Car");
const { upload } = require("../config/cloudinary");

// @route GET /api/users/:id  - public profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -savedCars");
    if (!user) return res.status(404).json({ error: "User not found." });
    const listings = await Car.find({ seller: req.params.id, available: true }).limit(6);
    res.json({ user, listings });
  } catch {
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// @route PATCH /api/users/profile  - update own profile
router.patch("/profile", protect, upload.single("avatar"), async (req, res) => {
  try {
    const updates = { name: req.body.name, phone: req.body.phone, city: req.body.city, bio: req.body.bio };
    if (req.file) updates.avatar = req.file.path;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch {
    res.status(500).json({ error: "Profile update failed." });
  }
});

// @route POST /api/users/save/:carId  - toggle save a car
router.post("/save/:carId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const carId = req.params.carId;
    const idx = user.savedCars.indexOf(carId);
    if (idx === -1) user.savedCars.push(carId);
    else user.savedCars.splice(idx, 1);
    await user.save();
    res.json({ saved: idx === -1, savedCars: user.savedCars });
  } catch {
    res.status(500).json({ error: "Failed to save car." });
  }
});

// @route GET /api/users/saved/cars  - get saved cars
router.get("/saved/cars", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedCars",
      populate: { path: "seller", select: "name avatar" },
    });
    res.json({ cars: user.savedCars });
  } catch {
    res.status(500).json({ error: "Failed to fetch saved cars." });
  }
});

module.exports = router;
