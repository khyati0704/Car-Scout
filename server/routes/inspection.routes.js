const router = require("express").Router();
const { requestInspection, getInspectionByCar, getInspectionById, getPriceHint } = require("../controllers/inspection.controller");
const { protect } = require("../middleware/auth.middleware");
const { upload } = require("../config/cloudinary");

router.post("/", protect, upload.array("images", 5), requestInspection);
router.post("/generate", protect, requestInspection);
router.post("/price-hint", getPriceHint);
router.get("/car/:carId", getInspectionByCar);
router.get("/:id", protect, getInspectionById);

module.exports = router;
