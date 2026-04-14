const { Conversation, Message } = require("../models/Message");
const Car = require("../models/Car");

// @route  POST /api/messages/conversation
// @access Private (buyer)
const startConversation = async (req, res) => {
  try {
    const { carId, initialMessage } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (car.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot message yourself." });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      buyer: req.user._id,
      seller: car.seller,
      car: carId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        buyer: req.user._id,
        seller: car.seller,
        car: carId,
      });
    }

    // Send the initial message
    if (initialMessage) {
      const message = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        content: initialMessage,
      });
      conversation.lastMessage = initialMessage;
      conversation.unreadSeller += 1;
      await conversation.save();
    }

    await conversation.populate([
      { path: "buyer", select: "name avatar" },
      { path: "seller", select: "name avatar" },
      { path: "car", select: "make model year price images" },
    ]);

    res.status(201).json({ conversation });
  } catch (err) {
    res.status(500).json({ error: "Failed to start conversation." });
  }
};

// @route  GET /api/messages/conversations
// @access Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    })
      .populate("buyer", "name avatar")
      .populate("seller", "name avatar")
      .populate("car", "make model year price images")
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
};

// @route  GET /api/messages/:conversationId
// @access Private
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    // Verify participant
    const isParticipant =
      conversation.buyer.toString() === req.user._id.toString() ||
      conversation.seller.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ error: "Access denied." });

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    // Mark messages as read
    const isBuyer = conversation.buyer.toString() === req.user._id.toString();
    if (isBuyer) conversation.unreadBuyer = 0;
    else conversation.unreadSeller = 0;
    await conversation.save();

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

// @route  POST /api/messages/:conversationId
// @access Private
const sendMessage = async (req, res) => {
  try {
    const { content, type = "text", offerAmount } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    const isBuyer = conversation.buyer.toString() === req.user._id.toString();
    const isSeller = conversation.seller.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) return res.status(403).json({ error: "Access denied." });

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
      type,
      offerAmount: offerAmount || null,
    });

    // Update conversation
    conversation.lastMessage = content;
    if (type === "offer" || type === "counter-offer") {
      conversation.lastOffer = offerAmount;
    }
    if (type === "accepted") conversation.status = "accepted";
    if (type === "rejected") conversation.status = "rejected";
    if (isBuyer) conversation.unreadSeller += 1;
    else conversation.unreadBuyer += 1;
    await conversation.save();

    await message.populate("sender", "name avatar");
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
};

module.exports = { startConversation, getConversations, getMessages, sendMessage };
