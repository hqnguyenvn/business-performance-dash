import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

// Trust proxy for deployment environments
app.set('trust proxy', true);

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    log("Starting server initialization...");

    // Register all API routes first
    await registerRoutes(app);
    log("API routes registered successfully");

    // Create HTTP server instance
    const server = createServer(app);

    // Setup Vite in development or serve static files in production
    if (process.env.NODE_ENV === "production") {
      log("Setting up static file serving...");
      serveStatic(app);
    } else {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    }

    // Add error handling middleware (must be last)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    // Start server with proper error handling
    const port = Number(process.env.PORT) || 5000;
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`);
        process.exit(1);
      } else {
        log(`Server error: ${error.message}`);
        process.exit(1);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      log(`Server running on http://0.0.0.0:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : error}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  console.error(reason);
  process.exit(1);
});

// Start the server
startServer();