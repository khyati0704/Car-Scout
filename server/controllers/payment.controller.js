const crypto = require("crypto");
const Car = require("../models/Car");
const Purchase = require("../models/Purchase");
const { Conversation, Message } = require("../models/Message");
const { getRazorpayClient, isRazorpayConfigured } = require("../config/razorpay");

const buildReceiptNumber = () =>
  `CS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

const FIXED_BOOKING_AMOUNT = 25000;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.error?.description ||
  error?.description ||
  error?.message ||
  fallback;

const buildChecklist = () => [
  { key: "rc", label: "RC / registration certificate", done: false, updatedAt: new Date() },
  { key: "insurance", label: "Insurance policy copy", done: false, updatedAt: new Date() },
  { key: "service-history", label: "Service and maintenance records", done: false, updatedAt: new Date() },
  { key: "keys", label: "All keys and remote fobs handed over", done: false, updatedAt: new Date() },
  { key: "emission", label: "PUC / emission certificate", done: false, updatedAt: new Date() },
  { key: "delivery-note", label: "Delivery confirmation and handover notes", done: false, updatedAt: new Date() },
];

const buildLocation = (car) => [car.city, car.state].filter(Boolean).join(", ");

const buildPurchaseSnapshot = ({ buyer, seller, car }) => ({
  carSnapshot: {
    name: `${car.year} ${car.make} ${car.model}`,
    make: car.make,
    model: car.model,
    year: car.year,
    registrationNumber: car.registrationNumber || "PENDING-REG",
    color: car.color || "",
    bodyType: car.bodyType || "",
    location: buildLocation(car),
  },
  sellerSnapshot: {
    name: seller.name,
    phone: seller.phone || "",
    city: seller.city || "",
    email: seller.email || "",
  },
  buyerSnapshot: {
    name: buyer.name,
    phone: buyer.phone || "",
    city: buyer.city || "",
    email: buyer.email || "",
  },
});

const loadPurchaseForUser = async (purchaseId, userId) =>
  Purchase.findById(purchaseId)
    .populate("buyer", "name email phone city")
    .populate("seller", "name email phone city")
    .populate("car", "make model year price registrationNumber color bodyType city state images available soldAt soldPrice")
    .populate("conversation", "_id")
    .then((purchase) => {
      if (!purchase) {
        return null;
      }

      const isAllowed =
        purchase.buyer._id.toString() === userId.toString() ||
        purchase.seller._id.toString() === userId.toString();

      return isAllowed ? purchase : false;
    });

const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
      status: "paid",
    })
      .populate("buyer", "name email phone city")
      .populate("seller", "name email phone city")
      .populate("car", "make model year price registrationNumber color bodyType city state images available soldAt soldPrice")
      .populate("conversation", "_id")
      .sort({ paidAt: -1, createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ error: "Failed to load purchases." });
  }
};

const createCheckoutOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.",
      });
    }

    const car = await Car.findById(req.params.carId).populate("seller", "name email phone city");
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (!car.available) return res.status(400).json({ error: "This car has already been sold or reserved." });
    if (car.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot confirm your own listing." });
    }

    const existingPaidPurchase = await Purchase.findOne({ car: car._id, status: "paid" });
    if (existingPaidPurchase) {
      return res.status(400).json({ error: "This car already has a completed purchase." });
    }

    const totalAmount = Number(car.price);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }

    const paymentAmount = FIXED_BOOKING_AMOUNT;
    const balanceDue = Math.max(0, Math.round(totalAmount) - paymentAmount);
    const razorpay = getRazorpayClient();
    const receiptNumber = buildReceiptNumber();
    const order = await razorpay.orders.create({
      amount: paymentAmount * 100,
      currency: "INR",
      receipt: receiptNumber,
      notes: {
        carId: car._id.toString(),
        buyerId: req.user._id.toString(),
        sellerId: car.seller._id.toString(),
        totalAmount: Math.round(totalAmount).toString(),
        confirmationAmount: paymentAmount.toString(),
        balanceDue: balanceDue.toString(),
      },
    });

    const purchase = await Purchase.create({
      buyer: req.user._id,
      seller: car.seller._id,
      car: car._id,
      receiptNumber,
      gatewayOrderId: order.id,
      amount: paymentAmount,
      totalAmount: Math.round(totalAmount),
      balanceDue,
      currency: order.currency,
      handoverChecklist: buildChecklist(),
      ...buildPurchaseSnapshot({ buyer: req.user, seller: car.seller, car }),
    });

    res.status(201).json({
      purchase,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      
    });
  } catch (error) {
    console.error("createCheckoutOrder failed:", error);
    res.status(error.statusCode || 500).json({ error: getErrorMessage(error, "Failed to create the confirmation order.") });
  }
};

const verifyCheckoutPayment = async (req, res) => {
  try {
    const { purchaseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!purchaseId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields." });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ error: "Purchase not found." });
    if (purchase.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You are not allowed to verify this purchase." });
    }
    if (purchase.status === "paid") {
      const completedPurchase = await loadPurchaseForUser(purchaseId, req.user._id);
      return res.json({ purchase: completedPurchase });
    }
    if (purchase.gatewayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: "Order id does not match this purchase." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${purchase.gatewayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      purchase.status = "failed";
      await purchase.save();
      return res.status(400).json({ error: "Payment signature verification failed." });
    }

    const car = await Car.findById(purchase.car).populate("seller", "name email phone city");
    if (!car) return res.status(404).json({ error: "Car not found." });
    if (!car.available) {
      return res.status(400).json({ error: "This car is no longer available." });
    }

    purchase.status = "paid";
    purchase.gatewayPaymentId = razorpay_payment_id;
    purchase.gatewaySignature = razorpay_signature;
    purchase.paidAt = new Date();
    purchase.carSnapshot = {
      ...purchase.carSnapshot,
      registrationNumber: car.registrationNumber || purchase.carSnapshot.registrationNumber,
      color: car.color || purchase.carSnapshot.color,
      bodyType: car.bodyType || purchase.carSnapshot.bodyType,
      location: buildLocation(car) || purchase.carSnapshot.location,
    };
    purchase.sellerSnapshot = {
      ...purchase.sellerSnapshot,
      phone: car.seller.phone || purchase.sellerSnapshot.phone,
      city: car.seller.city || purchase.sellerSnapshot.city,
      email: car.seller.email || purchase.sellerSnapshot.email,
    };
    await purchase.save();

    car.available = false;
    car.buyer = req.user._id;
    car.soldAt = purchase.paidAt;
    car.soldPrice = purchase.totalAmount || purchase.amount;
    await car.save();

    let conversation = await Conversation.findOne({
      buyer: req.user._id,
      seller: purchase.seller,
      car: purchase.car,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        buyer: req.user._id,
        seller: purchase.seller,
        car: purchase.car,
        status: "accepted",
      });
    } else {
      conversation.status = "accepted";
    }

    const paymentLabel = purchase.balanceDue > 0 ? "Booking amount" : "Confirmation amount";
    const paymentMessage = `${paymentLabel} received for ${purchase.carSnapshot.name}. Paid ${purchase.amount} against total ${purchase.totalAmount || purchase.amount}. Balance due ${purchase.balanceDue || 0}. Receipt ${purchase.receiptNumber} generated for ${purchase.buyerSnapshot.name}.`;
    conversation.lastMessage = paymentMessage;
    conversation.unreadSeller += 1;
    await conversation.save();

    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: paymentMessage,
      type: "payment",
    });

    purchase.conversation = conversation._id;
    await purchase.save();

    const completedPurchase = await loadPurchaseForUser(purchase._id, req.user._id);
    res.json({ purchase: completedPurchase });
  } catch (error) {
    console.error("verifyCheckoutPayment failed:", error);
    res.status(error.statusCode || 500).json({ error: getErrorMessage(error, "Failed to verify the confirmation payment.") });
  }
};

const getPurchaseReceipt = async (req, res) => {
  try {
    const purchase = await loadPurchaseForUser(req.params.purchaseId, req.user._id);
    if (purchase === false) return res.status(403).json({ error: "Access denied." });
    if (!purchase) return res.status(404).json({ error: "Purchase not found." });

    res.json({ purchase });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the receipt." });
  }
};

const updateHandoverChecklist = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.purchaseId);
    if (!purchase) return res.status(404).json({ error: "Purchase not found." });
    if (purchase.status !== "paid") {
      return res.status(400).json({ error: "The handover checklist becomes available after payment." });
    }
    if (purchase.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the seller can update the handover checklist." });
    }

    const checklist = Array.isArray(req.body.checklist) ? req.body.checklist : [];
    if (checklist.length === 0) {
      return res.status(400).json({ error: "Checklist payload is required." });
    }

    purchase.handoverChecklist = checklist.map((item) => ({
      key: item.key,
      label: item.label,
      done: Boolean(item.done),
      updatedAt: new Date(),
    }));
    await purchase.save();

    if (purchase.conversation) {
      const doneCount = purchase.handoverChecklist.filter((item) => item.done).length;
      const content = `Handover checklist updated: ${doneCount}/${purchase.handoverChecklist.length} steps completed.`;
      await Message.create({
        conversation: purchase.conversation,
        sender: req.user._id,
        content,
        type: "handover",
      });
      await Conversation.findByIdAndUpdate(purchase.conversation, {
        lastMessage: content,
        $inc: { unreadBuyer: 1 },
      });
    }

    const updatedPurchase = await loadPurchaseForUser(purchase._id, req.user._id);
    res.json({ purchase: updatedPurchase });
  } catch (error) {
    res.status(500).json({ error: "Failed to update the handover checklist." });
  }
};

module.exports = {
  createCheckoutOrder,
  verifyCheckoutPayment,
  getMyPurchases,
  getPurchaseReceipt,
  updateHandoverChecklist,
};
