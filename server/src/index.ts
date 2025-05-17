import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import morgan from "morgan";
import s3Routes from "./routes/s3Routes";
import recordingRoutes from "./routes/recordingRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { initializeSocketServer } from "./services/socketService";
import { PrismaClient } from "./generated/prisma";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Connect to database and log
prisma
  .$connect()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketServer(server);

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request logging middleware
app.use(morgan("dev")); // 'dev' format: :method :url :status :response-time ms

// Middleware
app.use(express.json());

// Routes
app.use("/api/s3", s3Routes);
app.use("/api/recordings", recordingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

