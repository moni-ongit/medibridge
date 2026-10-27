require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initSocket = require("./socket");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const interpreterRoutes = require("./routes/interpreterRoutes");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ---- Core middleware ----------------------------------------------
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// ---- Database -------------------------------------------------------
connectDB();

// ---- Socket.IO --------------------------------------------------------
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"], credentials: true },
});
app.set("io", io); // so controllers can emit events (e.g. new interpreter request)
initSocket(io);

// ---- Health check -----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MediBridge API is running",
    translationProvider: process.env.TRANSLATION_PROVIDER || "mock",
    speechProvider: process.env.SPEECH_PROVIDER || "mock",
    videoProvider: process.env.VIDEO_PROVIDER || "mock",
  });
});

// ---- API Routes -------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/interpreter", interpreterRoutes);

// ---- Error handling ----------------------------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 MediBridge server running on http://localhost:${PORT}`);
  console.log(`   CORS allowed origin: ${CLIENT_URL}`);
});

module.exports = { app, server, io };
