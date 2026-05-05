const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    receiptNumber: { type: String, required: true, unique: true },
    gateway: { type: String, default: "razorpay" },
    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String, default: "" },
    gatewaySignature: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    paidAt: { type: Date, default: null },
    carSnapshot: {
      name: { type: String, required: true },
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      registrationNumber: { type: String, default: "PENDING-REG" },
      color: { type: String, default: "" },
      bodyType: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    sellerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    buyerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    handoverChecklist: { type: [checklistItemSchema], default: [] },
  },
  { timestamps: true }
);

purchaseSchema.index({ buyer: 1, createdAt: -1 });
purchaseSchema.index({ seller: 1, createdAt: -1 });
purchaseSchema.index({ car: 1, status: 1 });

module.exports = mongoose.model("Purchase", purchaseSchema);
