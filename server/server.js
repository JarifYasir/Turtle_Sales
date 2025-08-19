const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Much more lenient in development
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  skip: (req) => {
    // Skip rate limiting for local development
    if (process.env.NODE_ENV === "development") {
      const ip = req.ip || req.connection.remoteAddress;
      return (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.includes("192.168.") ||
        ip === "::ffff:127.0.0.1"
      );
    }
    return false;
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 5, // Much more lenient in development
  message: {
    error: "Too many login attempts, please try again later.",
  },
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === "development") {
      const ip = req.ip || req.connection.remoteAddress;
      return (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.includes("192.168.") ||
        ip === "::ffff:127.0.0.1"
      );
    }
    return false;
  },
});

app.use(limiter);

// CORS middleware
if (process.env.NODE_ENV === "development") {
  // In development, allow all origins
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://192.168.2.24:5173",
          "http://192.168.2.24:5174",
          process.env.CLIENT_URL,
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all origins in development
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      exposedHeaders: ["Content-Length"],
      optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
      maxAge: 86400, // Cache preflight response for 24 hours
    })
  );
} else {
  // In production, be more restrictive
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://192.168.2.24:5173",
          "http://localhost:3000",
          "http://192.168.2.24:3000",
          process.env.CLIENT_URL,
        ].filter(Boolean); // Remove undefined values

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );
}

// Handle preflight requests explicitly
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/v1/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/v1/organization", require("./routes/organizationRoutes"));
const timeslotRoutes = require("./routes/timeslotRoutes");
app.use("/api/v1/timeslots", timeslotRoutes);
app.use("/api/v1/workdays", require("./routes/workdayRoutes"));
app.use("/api/v1/sales", require("./routes/saleRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      msg: "Validation Error",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      msg: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      msg: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      msg: "Token expired",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    msg:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: "Route not found",
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.2.24:${PORT}`);
});
