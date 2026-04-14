// routes/auth.routes.js
const router = require("express").Router();
const { register, login, getMe, updatePassword } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/update-password", protect, updatePassword);

module.exports = router;
