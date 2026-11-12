import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET;
let httpServer;
let shuttingDown;

const shutdown = (reason, exitCode = 0) => {
  if (shuttingDown) return shuttingDown;

  shuttingDown = (async () => {
    console.log(`Shutting down (${reason})`);

    const forceExit = setTimeout(() => {
      console.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10000);
    forceExit.unref();

    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }

    await mongoose.disconnect();
    process.exitCode = exitCode;
    clearTimeout(forceExit);
  })().catch((error) => {
    console.error("Error during shutdown:", error);
    process.exitCode = 1;
  });

  return shuttingDown;
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  void shutdown("unhandledRejection", 1);
});

const startServer = async () => {
  try {
    if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error("PORT must be a valid TCP port between 1 and 65535");
    }
    if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes("replace-me")) {
      throw new Error("JWT_SECRET must be set to a random secret of at least 32 characters");
    }

    await connectDB();
    app.locals.databaseReady = true;

    httpServer = app.listen(PORT, () => {
      console.log(
        `🚀 Inkwell API running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`
      );
    });

    httpServer.requestTimeout = 30000;
    httpServer.headersTimeout = 35000;
    httpServer.keepAliveTimeout = 5000;

    mongoose.connection.on("disconnected", () => {
      app.locals.databaseReady = false;
    });
    mongoose.connection.on("connected", () => {
      app.locals.databaseReady = true;
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    await shutdown("startup failure", 1);
  }
};

startServer();
