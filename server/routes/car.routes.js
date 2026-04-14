const router = require("express").Router();
const { getCars, getCarById, createCar, updateCar, deleteCar, getMyCars } = require("../controllers/car.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { upload } = require("../config/cloudinary");

router.get("/", getCars);
router.get("/my/listings", protect, authorize("seller", "admin"), getMyCars);
router.get("/:id", getCarById);
router.post("/", protect, authorize("seller", "admin"), upload.array("images", 10), createCar);
router.patch("/:id", protect, authorize("seller", "admin"), upload.array("images", 10), updateCar);
router.delete("/:id", protect, authorize("seller", "admin"), deleteCar);

module.exports = router;
