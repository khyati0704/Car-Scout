const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const http = require("http");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const initSocket = require("./socket/socket");
const paymentRoutes = require("./routes/payment.routes");
const inspectionRoutes = require("./routes/inspection.routes");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
initSocket(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/payments", paymentRoutes);
app.use("/api/inspections", inspectionRoutes);

// Rate limiting
const isProduction = process.env.NODE_ENV === "production";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 250 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: isProduction
      ? "Too many requests, please slow down and try again shortly."
      : "Too many requests in development mode. Please wait a moment and try again.",
  },
});
app.use("/api", limiter);

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/cars", require("./routes/car.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/test-drives", require("./routes/testDrive.routes"));

app.use("/api/users", require("./routes/user.routes"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Car Scout server running on port ${PORT}`));
