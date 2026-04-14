const router = require("express").Router();
const { startConversation, getConversations, getMessages, sendMessage } = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/conversation", protect, startConversation);
router.get("/conversations", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/:conversationId", protect, sendMessage);

module.exports = router;
