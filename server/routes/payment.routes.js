const router = require("express").Router();
const {
  createCheckoutOrder,
  verifyCheckoutPayment,
  getMyPurchases,
  getPurchaseReceipt,
  updateHandoverChecklist,
} = require("../controllers/payment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.get("/my", protect, getMyPurchases);
router.get("/:purchaseId", protect, getPurchaseReceipt);
router.post("/checkout/:carId", protect, createCheckoutOrder);
router.post("/verify", protect, verifyCheckoutPayment);
router.patch("/:purchaseId/checklist", protect, authorize("seller", "admin"), updateHandoverChecklist);

module.exports = router;
