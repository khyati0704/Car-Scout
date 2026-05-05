const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    lastMessage: { type: String, default: "" },
    lastOffer: { type: Number, default: null },
    status: {
      type: String,
      enum: ["active", "accepted", "rejected", "closed"],
      default: "active",
    },
    unreadBuyer: { type: Number, default: 0 },
    unreadSeller: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure one conversation per buyer+seller+car combo
conversationSchema.index({ buyer: 1, seller: 1, car: 1 }, { unique: true });

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ["text", "offer", "counter-offer", "accepted", "rejected", "test-drive", "payment", "handover"],
      default: "text",
    },
    offerAmount: { type: Number, default: null }, // used when type is offer/counter-offer
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { Conversation, Message };
