const router = require("express").Router();
const {
  createTestDrive,
  getMyTestDrives,
  updateTestDriveStatus,
} = require("../controllers/testDrive.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getMyTestDrives);
router.post("/", protect, createTestDrive);
router.patch("/:id", protect, updateTestDriveStatus);

module.exports = router;
